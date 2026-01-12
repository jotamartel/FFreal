// Database functions for Friends & Family Groups

import { pool } from './client';
import {
  FFGroup,
  FFGroupMember,
  FFInvitation,
  FFDiscountConfig,
  CreateGroupParams,
  CreateInvitationParams,
  UpdateGroupParams,
  UpdateMemberParams,
  UpdateDiscountConfigParams,
} from '@/types/ff-groups';
import { getOrCreateShopifyCustomer } from '@/lib/shopify/admin';
import { createUser, getUserByEmail, updateUser, findOrCreateUserByShopifyCustomerId } from './users';
import { getUserById } from './users';
import crypto from 'crypto';

/**
 * Generar código de invitación único
 */
function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Generar token de verificación
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crear un nuevo grupo Friends & Family
 */
export async function createGroup(
  params: CreateGroupParams
): Promise<FFGroup | null> {
  try {
    const { merchantId, name, ownerCustomerId, ownerEmail, ownerUserId, maxMembers } = params;

    if (!ownerUserId) {
      throw new Error('ownerUserId is required to create a group');
    }

    const ownerUser = await getUserById(ownerUserId);
    if (!ownerUser) {
      throw new Error('Owner user not found');
    }

    if (!ownerUser.is_active) {
      throw new Error('Owner user is inactive');
    }

    if (!ownerUser.can_create_groups) {
      throw new Error('User is not authorized to create groups');
    }

    const existingGroups = await pool.query(
      `SELECT 1 FROM ff_groups WHERE owner_user_id = $1 AND status = 'active' LIMIT 1`,
      [ownerUserId]
    );

    if (existingGroups.rows.length > 0) {
      throw new Error('User already owns an active group');
    }

    const config = await getDiscountConfig(merchantId);
    const finalMaxMembers =
      maxMembers ?? ownerUser.max_members_per_group ?? config?.max_members_default ?? 20;

    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await pool.query(
        'SELECT id FROM ff_groups WHERE invite_code = $1',
        [inviteCode]
      );
      if (existing.rows.length === 0) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const result = await pool.query(
      `INSERT INTO ff_groups (
        merchant_id,
        name,
        owner_customer_id,
        owner_email,
        owner_user_id,
        invite_code,
        max_members,
        current_members,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'active')
      RETURNING *`,
      [
        merchantId,
        name,
        ownerCustomerId,
        ownerEmail,
        ownerUserId,
        inviteCode,
        finalMaxMembers,
      ]
    );

    const group = result.rows[0] as FFGroup;

    await pool.query(
      `INSERT INTO ff_group_members (
        group_id,
        customer_id,
        user_id,
        email,
        role,
        status,
        email_verified,
        joined_at
      ) VALUES ($1, $2, $3, $4, 'owner', 'active', true, NOW())`,
      [group.id, ownerCustomerId, ownerUserId, ownerEmail]
    );

    return group;
  } catch (error) {
    console.error('[createGroup] Error creating group:', error);
    return null;
  }
}

/**
 * Obtener grupo por ID
 */
export async function getGroupById(id: string): Promise<FFGroup | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_groups WHERE id = $1',
      [id]
    );
    const group = (result.rows[0] as FFGroup) || null;

    if (!group) {
      return null;
    }

    try {
      let targetMax = group.max_members;
      if (group.owner_user_id) {
        const ownerUser = await getUserById(group.owner_user_id);
        const config = await getDiscountConfig(group.merchant_id);
        targetMax = ownerUser?.max_members_per_group ?? config?.max_members_default ?? 20;
      }

      if (targetMax && targetMax !== group.max_members) {
        const updateResult = await pool.query(
          `UPDATE ff_groups SET max_members = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [targetMax, id]
        );
        return (updateResult.rows[0] as FFGroup) || group;
      }
    } catch (syncError) {
      console.warn('[getGroupById] Failed to sync max_members, returning existing value', syncError);
    }

    return group;
  } catch (error) {
    console.error('Error getting group by id:', error);
    return null;
  }
}

/**
 * Obtener grupo por código de invitación
 */
export async function getGroupByInviteCode(code: string): Promise<FFGroup | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_groups WHERE invite_code = $1 AND status = $2',
      [code, 'active']
    );
    return result.rows[0] as FFGroup || null;
  } catch (error) {
    console.error('Error getting group by invite code:', error);
    return null;
  }
}

/**
 * Obtener grupos de un customer (por customer_id)
 */
export async function getGroupsByCustomerId(
  customerId: string,
  merchantId?: string
): Promise<FFGroup[]> {
  try {
    let query = `
      SELECT DISTINCT g.* FROM ff_groups g
      INNER JOIN ff_group_members m ON g.id = m.group_id
      WHERE m.customer_id = $1 AND m.status = 'active'
    `;
    const params: any[] = [customerId];
    
    if (merchantId) {
      query += ' AND g.merchant_id = $2';
      params.push(merchantId);
    }
    
    query += ' ORDER BY g.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as FFGroup[];
  } catch (error) {
    console.error('Error getting groups by customer id:', error);
    return [];
  }
}

/**
 * Obtener grupos de un usuario (por user_id)
 */
export async function getGroupsByUserId(
  userId: string,
  merchantId?: string
): Promise<FFGroup[]> {
  try {
    // Primero verificar si la columna user_id existe
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ff_group_members' AND column_name = 'user_id'
    `);
    
    const hasUserIdColumn = columnCheck.rows.length > 0;
    
    let query: string;
    const params: any[] = [];
    
    if (hasUserIdColumn) {
      // Usar user_id si la columna existe
      query = `
        SELECT DISTINCT g.* FROM ff_groups g
        INNER JOIN ff_group_members m ON g.id = m.group_id
        WHERE (m.user_id = $1 OR g.owner_user_id = $1) AND m.status = 'active'
      `;
      params.push(userId);
    } else {
      // Fallback: buscar por owner_user_id en ff_groups si la columna no existe
      query = `
        SELECT DISTINCT g.* FROM ff_groups g
        WHERE g.owner_user_id = $1
      `;
      params.push(userId);
    }
    
    if (merchantId) {
      query += ` AND g.merchant_id = $${params.length + 1}`;
      params.push(merchantId);
    }
    
    query += ' ORDER BY g.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as FFGroup[];
  } catch (error) {
    console.error('Error getting groups by user id:', error);
    return [];
  }
}

/**
 * Obtener grupos de un merchant
 */
export async function getGroupsByMerchantId(
  merchantId: string,
  status?: 'active' | 'suspended' | 'terminated'
): Promise<FFGroup[]> {
  try {
    let query = 'SELECT * FROM ff_groups WHERE merchant_id = $1';
    const params: any[] = [merchantId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as FFGroup[];
  } catch (error) {
    console.error('Error getting groups by merchant id:', error);
    return [];
  }
}

/**
 * Actualizar grupo
 */
export async function updateGroup(
  params: UpdateGroupParams
): Promise<FFGroup | null> {
  try {
    const { id, name, maxMembers, status } = params;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (maxMembers !== undefined) {
      updates.push(`max_members = $${paramCount++}`);
      values.push(maxMembers);
    }

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE ff_groups SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] as FFGroup || null;
  } catch (error) {
    console.error('Error updating group:', error);
    return null;
  }
}

/**
 * Obtener miembros de un grupo
 */
export async function getGroupMembers(groupId: string, includeInactive: boolean = false): Promise<FFGroupMember[]> {
  try {
    let query = 'SELECT * FROM ff_group_members WHERE group_id = $1';
    const params: any[] = [groupId];
    
    if (!includeInactive) {
      // By default, only show active members
      query += ' AND status = $2';
      params.push('active');
    }
    
    query += ' ORDER BY created_at ASC';
    
    const result = await pool.query(query, params);
    return result.rows as FFGroupMember[];
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
  }
}

/**
 * Sincronizar el contador current_members con la cantidad real de miembros activos
 */
export async function syncGroupMemberCount(groupId: string): Promise<boolean> {
  try {
    // Contar miembros activos reales
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM ff_group_members 
       WHERE group_id = $1 AND status = 'active'`,
      [groupId]
    );

    const actualCount = parseInt(countResult.rows[0]?.count || '0');

    // Actualizar current_members
    await pool.query(
      `UPDATE ff_groups 
       SET current_members = $1, updated_at = NOW() 
       WHERE id = $2`,
      [actualCount, groupId]
    );

    console.log(`[SYNC] Group ${groupId}: Updated current_members to ${actualCount}`);
    return true;
  } catch (error) {
    console.error('Error syncing group member count:', error);
    return false;
  }
}

/**
 * Obtener miembro por ID
 */
export async function getMemberById(id: string): Promise<FFGroupMember | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_group_members WHERE id = $1',
      [id]
    );
    return result.rows[0] as FFGroupMember || null;
  } catch (error) {
    console.error('Error getting member by id:', error);
    return null;
  }
}

/**
 * Obtener miembro por email y grupo
 */
export async function getMemberByEmailAndGroup(
  email: string,
  groupId: string
): Promise<FFGroupMember | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_group_members WHERE email = $1 AND group_id = $2',
      [email, groupId]
    );
    return result.rows[0] as FFGroupMember || null;
  } catch (error) {
    console.error('Error getting member by email and group:', error);
    return null;
  }
}

/**
 * Actualizar miembro
 */
export async function updateMember(
  params: UpdateMemberParams
): Promise<FFGroupMember | null> {
  try {
    const { id, status, emailVerified } = params;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      
      if (status === 'active') {
        updates.push(`joined_at = NOW()`);
      }
    }

    if (emailVerified !== undefined) {
      updates.push(`email_verified = $${paramCount++}`);
      values.push(emailVerified);
      
      if (emailVerified) {
        updates.push(`verification_token = NULL`);
        updates.push(`verification_expires_at = NULL`);
      }
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE ff_group_members SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] as FFGroupMember || null;
  } catch (error) {
    console.error('Error updating member:', error);
    return null;
  }
}

/**
 * Eliminar miembro del grupo
 */
export async function removeMemberFromGroup(
  memberId: string
): Promise<boolean> {
  try {
    const member = await getMemberById(memberId);

    if (!member) {
      console.warn('[removeMemberFromGroup] Member not found:', memberId);
      return false;
    }

    if (member.role === 'owner') {
      console.warn('[removeMemberFromGroup] Attempt to remove owner blocked:', memberId);
      return false;
    }

    await updateMember({ id: memberId, status: 'removed' });
    if (member.group_id) {
      await syncGroupMemberCount(member.group_id);
    }
    return true;
  } catch (error) {
    console.error('Error removing member from group:', error);
    return false;
  }
}

/**
 * Crear invitación
 */
export async function createInvitation(
  params: CreateInvitationParams
): Promise<FFInvitation | null> {
  try {
    const { groupId, email, expiresInDays = 7 } = params;
    
    // Verificar que el grupo existe y está activo
    const group = await getGroupById(groupId);
    if (!group || group.status !== 'active') {
      return null;
    }

    // Verificar que no exceda el límite de miembros
    if (group.current_members >= group.max_members) {
      return null;
    }

    // Verificar que el email no esté ya en el grupo
    const existingMember = await getMemberByEmailAndGroup(email, groupId);
    if (existingMember && existingMember.status === 'active') {
      return null;
    }

    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await pool.query(
      `INSERT INTO ff_invitations 
       (group_id, email, token, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [groupId, email, token, expiresAt]
    );

    return result.rows[0] as FFInvitation;
  } catch (error) {
    console.error('Error creating invitation:', error);
    return null;
  }
}

/**
 * Obtener invitación por token
 */
export async function getInvitationByToken(token: string): Promise<FFInvitation | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_invitations WHERE token = $1',
      [token]
    );
    return result.rows[0] as FFInvitation || null;
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    return null;
  }
}

/**
 * Obtener invitaciones pendientes de un grupo
 */
export async function getPendingInvitationsByGroupId(groupId: string): Promise<FFInvitation[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM ff_invitations 
       WHERE group_id = $1 
       AND status = 'pending' 
       AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [groupId]
    );
    return result.rows as FFInvitation[];
  } catch (error) {
    console.error('Error getting pending invitations by group ID:', error);
    return [];
  }
}

/**
 * Revocar/Eliminar una invitación pendiente
 */
export async function revokeInvitation(invitationId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `UPDATE ff_invitations 
       SET status = 'revoked' 
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [invitationId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return false;
  }
}

/**
 * Aceptar invitación
 * Automáticamente crea el cliente en Shopify y vincula las cuentas
 */
export async function acceptInvitation(
  token: string,
  customerId?: string,
  userId?: string
): Promise<FFGroupMember | null> {
  try {
    const invitation = await getInvitationByToken(token);
    
    if (!invitation || invitation.status !== 'pending') {
      return null;
    }

    // Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      await pool.query(
        'UPDATE ff_invitations SET status = $1 WHERE id = $2',
        ['expired', invitation.id]
      );
      return null;
    }

    const group = await getGroupById(invitation.group_id);
    if (!group || group.status !== 'active') {
      return null;
    }

    // Verificar límite de miembros
    if (group.current_members >= group.max_members) {
      return null;
    }

    // ===== CREAR CLIENTE EN SHOPIFY Y VINCULAR CUENTAS =====
    let finalShopifyCustomerId: string | null = customerId || null;
    let finalUserId: string | null = userId || null;

    // 1. Crear o encontrar cliente en Shopify
    console.log('[acceptInvitation] Creating/finding Shopify customer for:', invitation.email);
    const { customerId: shopifyCustomerId, error: shopifyError } = await getOrCreateShopifyCustomer({
      email: invitation.email,
      acceptsMarketing: false,
      tags: ['friends-family', `group-${group.id}`],
      note: `Miembro del grupo Friends & Family: ${group.name}`,
    });

    if (shopifyError) {
      console.warn('[acceptInvitation] Shopify customer creation failed (continuing anyway):', shopifyError);
    } else if (shopifyCustomerId) {
      finalShopifyCustomerId = shopifyCustomerId;
      console.log('[acceptInvitation] ✅ Shopify customer created/found:', shopifyCustomerId);
    }

    // 2. Crear o encontrar usuario en la app y vincular con Shopify
    if (finalShopifyCustomerId) {
      // Buscar usuario existente por email
      let appUser = await getUserByEmail(invitation.email);
      
      if (appUser) {
        // Usuario existe: actualizar con shopify_customer_id si no lo tiene
        if (!appUser.shopify_customer_id) {
          await updateUser(appUser.id, { 
            // Note: updateUser doesn't support shopify_customer_id, so we'll do it directly
          });
          await pool.query(
            'UPDATE users SET shopify_customer_id = $1, updated_at = NOW() WHERE id = $2',
            [finalShopifyCustomerId, appUser.id]
          );
          appUser = { ...appUser, shopify_customer_id: finalShopifyCustomerId };
        }
        finalUserId = appUser.id;
        console.log('[acceptInvitation] ✅ Linked existing app user to Shopify customer');
      } else {
        // Usuario no existe: crear uno básico vinculado a Shopify
        // El usuario puede completar su registro más tarde
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        appUser = await createUser({
          email: invitation.email,
          password: tempPassword,
          role: 'customer',
          shopifyCustomerId: finalShopifyCustomerId,
        });
        
        if (appUser) {
          finalUserId = appUser.id;
          console.log('[acceptInvitation] ✅ Created new app user linked to Shopify customer');
        }
      }
    } else if (userId) {
      // Si no hay Shopify customer pero hay userId, usar ese
      finalUserId = userId;
    }

    // Crear o actualizar miembro
    let member = await getMemberByEmailAndGroup(invitation.email, invitation.group_id);
    
    if (member) {
      // Actualizar miembro existente
      if (finalUserId && !member.user_id) {
        await pool.query(
          'UPDATE ff_group_members SET user_id = $1, customer_id = $2 WHERE id = $3',
          [finalUserId, finalShopifyCustomerId, member.id]
        );
      } else if (finalShopifyCustomerId && !member.customer_id) {
        await pool.query(
          'UPDATE ff_group_members SET customer_id = $1 WHERE id = $2',
          [finalShopifyCustomerId, member.id]
        );
      }
      
      member = await updateMember({
        id: member.id,
        status: 'active',
        emailVerified: true,
      });
    } else {
      // Crear nuevo miembro
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const memberResult = await pool.query(
        `INSERT INTO ff_group_members 
         (group_id, customer_id, user_id, email, role, status, email_verified, verification_token, verification_expires_at, joined_at)
         VALUES ($1, $2, $3, $4, 'member', 'active', true, $5, $6, NOW())
         RETURNING *`,
        [invitation.group_id, finalShopifyCustomerId, finalUserId, invitation.email, verificationToken, expiresAt]
      );
      
      member = memberResult.rows[0] as FFGroupMember;
    }

    // Actualizar invitación
    await pool.query(
      'UPDATE ff_invitations SET status = $1, accepted_at = NOW() WHERE id = $2',
      ['accepted', invitation.id]
    );

    return member;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return null;
  }
}

/**
 * Unirse a un grupo usando el código de invitación
 * Automáticamente crea el cliente en Shopify y vincula las cuentas
 */
export async function joinGroupByCode(
  inviteCode: string,
  email: string,
  customerId?: string,
  userId?: string
): Promise<FFGroupMember | null> {
  try {
    // Buscar el grupo por código
    const group = await getGroupByInviteCode(inviteCode);
    if (!group || group.status !== 'active') {
      return null;
    }

    // Verificar que el grupo no esté lleno
    if (group.current_members >= group.max_members) {
      return null;
    }

    // Verificar que el email no esté ya en el grupo
    const existingMember = await getMemberByEmailAndGroup(email, group.id);
    if (existingMember && existingMember.status === 'active') {
      return null; // Ya es miembro activo
    }

    // ===== CREAR CLIENTE EN SHOPIFY Y VINCULAR CUENTAS =====
    let finalShopifyCustomerId: string | null = customerId || null;
    let finalUserId: string | null = userId || null;

    // 1. Crear o encontrar cliente en Shopify
    console.log('[joinGroupByCode] Creating/finding Shopify customer for:', email);
    const { customerId: shopifyCustomerId, error: shopifyError } = await getOrCreateShopifyCustomer({
      email: email,
      acceptsMarketing: false,
      tags: ['friends-family', `group-${group.id}`],
      note: `Miembro del grupo Friends & Family: ${group.name}`,
    });

    if (shopifyError) {
      console.warn('[joinGroupByCode] Shopify customer creation failed (continuing anyway):', shopifyError);
    } else if (shopifyCustomerId) {
      finalShopifyCustomerId = shopifyCustomerId;
      console.log('[joinGroupByCode] ✅ Shopify customer created/found:', shopifyCustomerId);
    }

    // 2. Crear o encontrar usuario en la app y vincular con Shopify
    if (finalShopifyCustomerId) {
      // Buscar usuario existente por email
      let appUser = await getUserByEmail(email);
      
      if (appUser) {
        // Usuario existe: actualizar con shopify_customer_id si no lo tiene
        if (!appUser.shopify_customer_id) {
          await pool.query(
            'UPDATE users SET shopify_customer_id = $1, updated_at = NOW() WHERE id = $2',
            [finalShopifyCustomerId, appUser.id]
          );
          appUser = { ...appUser, shopify_customer_id: finalShopifyCustomerId };
        }
        finalUserId = appUser.id;
        console.log('[joinGroupByCode] ✅ Linked existing app user to Shopify customer');
      } else {
        // Usuario no existe: crear uno básico vinculado a Shopify
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        appUser = await createUser({
          email: email,
          password: tempPassword,
          role: 'customer',
          shopifyCustomerId: finalShopifyCustomerId,
        });
        
        if (appUser) {
          finalUserId = appUser.id;
          console.log('[joinGroupByCode] ✅ Created new app user linked to Shopify customer');
        }
      }
    } else if (userId) {
      // Si no hay Shopify customer pero hay userId, usar ese
      finalUserId = userId;
    }

    // Verificar columnas disponibles
    const membersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ff_group_members' AND column_name IN ('user_id')
    `);
    const hasMemberUserId = membersColumns.rows.length > 0;

    // Crear o actualizar miembro
    let member: FFGroupMember | null = null;
    let isNewMember = false;

    if (existingMember) {
      // Actualizar miembro existente
      if (finalUserId && hasMemberUserId) {
        await pool.query(
          'UPDATE ff_group_members SET user_id = $1, customer_id = $2, status = $3, email_verified = $4, joined_at = NOW() WHERE id = $5',
          [finalUserId, finalShopifyCustomerId, 'active', true, existingMember.id]
        );
      } else if (finalShopifyCustomerId && !existingMember.customer_id) {
        await pool.query(
          'UPDATE ff_group_members SET customer_id = $1, status = $2, email_verified = $3, joined_at = NOW() WHERE id = $4',
          [finalShopifyCustomerId, 'active', true, existingMember.id]
        );
      } else {
        await pool.query(
          'UPDATE ff_group_members SET status = $1, email_verified = $2, joined_at = NOW() WHERE id = $3',
          ['active', true, existingMember.id]
        );
      }
      member = await getMemberById(existingMember.id);
      // No incrementar contador si el miembro ya existía
    } else {
      // Crear nuevo miembro
      isNewMember = true;
      if (hasMemberUserId && finalUserId) {
        const result = await pool.query(
          `INSERT INTO ff_group_members 
           (group_id, customer_id, user_id, email, role, status, email_verified, joined_at)
           VALUES ($1, $2, $3, $4, 'member', 'active', true, NOW())
           RETURNING *`,
          [group.id, finalShopifyCustomerId, finalUserId, email]
        );
        member = result.rows[0] as FFGroupMember;
      } else {
        const result = await pool.query(
          `INSERT INTO ff_group_members 
           (group_id, customer_id, email, role, status, email_verified, joined_at)
           VALUES ($1, $2, $3, 'member', 'active', true, NOW())
           RETURNING *`,
          [group.id, finalShopifyCustomerId, email]
        );
        member = result.rows[0] as FFGroupMember;
      }
    }

    // Actualizar contador de miembros del grupo solo si es un nuevo miembro
    if (isNewMember) {
      await pool.query(
        'UPDATE ff_groups SET current_members = current_members + 1, updated_at = NOW() WHERE id = $1',
        [group.id]
      );
    }

    return member;
  } catch (error) {
    console.error('Error joining group by code:', error);
    return null;
  }
}

/**
 * Obtener configuración de descuento
 */
export async function getDiscountConfig(merchantId: string): Promise<FFDiscountConfig | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_discount_config WHERE merchant_id = $1',
      [merchantId]
    );
    return result.rows[0] as FFDiscountConfig || null;
  } catch (error) {
    console.error('Error getting discount config:', error);
    return null;
  }
}

/**
 * Crear o actualizar configuración de descuento
 */
export async function upsertDiscountConfig(
  params: UpdateDiscountConfigParams
): Promise<FFDiscountConfig | null> {
  try {
    const {
      merchantId,
      isEnabled,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
      maxMembersDefault,
      inviteRedirectUrl,
      isStoreOpen,
      nextEventDate,
      eventMessage,
    } = params;

    const existing = await getDiscountConfig(merchantId);

    if (existing) {
      // Update
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (isEnabled !== undefined) {
        updates.push(`is_enabled = $${paramCount++}`);
        values.push(isEnabled);
      }
      if (rules) {
        updates.push(`rules = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(rules));
      }
      if (maxGroupsPerEmail !== undefined) {
        updates.push(`max_groups_per_email = $${paramCount++}`);
        values.push(maxGroupsPerEmail);
      }
      if (coolingPeriodDays !== undefined) {
        updates.push(`cooling_period_days = $${paramCount++}`);
        values.push(coolingPeriodDays);
      }
      if (maxMembersDefault !== undefined) {
        updates.push(`max_members_default = $${paramCount++}`);
        values.push(maxMembersDefault);
      }
      if (inviteRedirectUrl !== undefined) {
        updates.push(`invite_redirect_url = $${paramCount++}`);
        values.push(inviteRedirectUrl);
      }
      if (isStoreOpen !== undefined) {
        updates.push(`is_store_open = $${paramCount++}`);
        values.push(isStoreOpen);
      }
      if (nextEventDate !== undefined) {
        updates.push(`next_event_date = $${paramCount++}`);
        values.push(nextEventDate);
      }
      if (eventMessage !== undefined) {
        updates.push(`event_message = $${paramCount++}`);
        values.push(eventMessage);
      }

      if (updates.length === 0) {
        return existing;
      }

      values.push(merchantId);

      const result = await pool.query(
        `UPDATE ff_discount_config SET ${updates.join(', ')}, updated_at = NOW() WHERE merchant_id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows[0] as FFDiscountConfig;
    } else {
      // Create
      const result = await pool.query(
        `INSERT INTO ff_discount_config 
         (merchant_id, is_enabled, rules, max_groups_per_email, cooling_period_days, max_members_default, invite_redirect_url, is_store_open, next_event_date, event_message)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          merchantId,
          isEnabled ?? true,
          JSON.stringify(rules || {}),
          maxGroupsPerEmail ?? 1,
          coolingPeriodDays ?? 30,
          maxMembersDefault ?? 20,
          inviteRedirectUrl || null,
          isStoreOpen ?? false,
          nextEventDate || null,
          eventMessage || null,
        ]
      );

      return result.rows[0] as FFDiscountConfig;
    }
  } catch (error) {
    console.error('Error upserting discount config:', error);
    return null;
  }
}

/**
 * Calcular descuento según el tier
 */
export async function calculateDiscount(
  merchantId: string,
  memberCount: number,
  discountTier?: number | string
): Promise<number> {
  // El sistema de L'Oréal no calcula descuentos dinámicos.
  // Los precios ya incluyen el descuento Friends & Family.
  // Mantener la firma para compatibilidad con puntos de integración existentes.
  console.warn('[calculateDiscount] Discount calculation is disabled for this project. Returning 0.');
  return 0;
}

