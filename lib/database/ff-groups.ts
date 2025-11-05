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
  params: CreateGroupParams & { ownerUserId?: string }
): Promise<FFGroup | null> {
  try {
    const { merchantId, name, ownerCustomerId, ownerEmail, maxMembers = 6, ownerUserId } = params;
    
    // Verificar qué columnas existen
    const groupsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ff_groups' AND column_name IN ('owner_user_id')
    `);
    const hasOwnerUserId = groupsColumns.rows.length > 0;
    
    const membersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ff_group_members' AND column_name IN ('user_id')
    `);
    const hasMemberUserId = membersColumns.rows.length > 0;
    
    // Generar código único
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

    // Construir query INSERT dinámicamente basado en columnas disponibles
    let insertColumns = ['merchant_id', 'name', 'owner_customer_id', 'owner_email', 'invite_code', 'max_members', 'current_members'];
    let insertValues: any[] = [merchantId, name, ownerCustomerId, ownerEmail, inviteCode, maxMembers, 1];
    
    if (hasOwnerUserId && ownerUserId) {
      insertColumns.push('owner_user_id');
      insertValues.push(ownerUserId);
    }
    
    const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
    const columnsStr = insertColumns.join(', ');
    
    const result = await pool.query(
      `INSERT INTO ff_groups (${columnsStr})
       VALUES (${placeholders})
       RETURNING *`,
      insertValues
    );

    const group = result.rows[0] as FFGroup;

    // Crear el owner como miembro activo
    if (hasMemberUserId && ownerUserId) {
      // Con user_id disponible
      await pool.query(
        `INSERT INTO ff_group_members 
         (group_id, customer_id, user_id, email, role, status, email_verified, joined_at)
         VALUES ($1, $2, $3, $4, 'owner', 'active', true, NOW())`,
        [group.id, ownerCustomerId, ownerUserId, ownerEmail]
      );
    } else {
      // Sin user_id (columna no existe o no disponible)
      await pool.query(
        `INSERT INTO ff_group_members 
         (group_id, customer_id, email, role, status, email_verified, joined_at)
         VALUES ($1, $2, $3, 'owner', 'active', true, NOW())`,
        [group.id, ownerCustomerId, ownerEmail]
      );
    }

    return group;
  } catch (error) {
    console.error('Error creating group:', error);
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
    return result.rows[0] as FFGroup || null;
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
export async function getGroupMembers(groupId: string): Promise<FFGroupMember[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM ff_group_members WHERE group_id = $1 ORDER BY created_at ASC',
      [groupId]
    );
    return result.rows as FFGroupMember[];
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
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
    await updateMember({ id: memberId, status: 'removed' });
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
 * Aceptar invitación
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

    // Crear o actualizar miembro
    let member = await getMemberByEmailAndGroup(invitation.email, invitation.group_id);
    
    if (member) {
      // Actualizar miembro existente (agregar user_id si no tiene)
      if (userId && !member.user_id) {
        await pool.query(
          'UPDATE ff_group_members SET user_id = $1 WHERE id = $2',
          [userId, member.id]
        );
      }
      
      member = await updateMember({
        id: member.id,
        status: 'active',
        emailVerified: true,
      });
    } else {
      // Crear nuevo miembro (con user_id si está disponible)
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const memberResult = await pool.query(
        `INSERT INTO ff_group_members 
         (group_id, customer_id, user_id, email, role, status, email_verified, verification_token, verification_expires_at, joined_at)
         VALUES ($1, $2, $3, $4, 'member', 'active', true, $5, $6, NOW())
         RETURNING *`,
        [invitation.group_id, customerId || null, userId || null, invitation.email, verificationToken, expiresAt]
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

    // Verificar columnas disponibles
    const membersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ff_group_members' AND column_name IN ('user_id')
    `);
    const hasMemberUserId = membersColumns.rows.length > 0;

    // Crear o actualizar miembro
    let member: FFGroupMember | null = null;

    if (existingMember) {
      // Actualizar miembro existente
      if (userId && hasMemberUserId) {
        await pool.query(
          'UPDATE ff_group_members SET user_id = $1, status = $2, email_verified = $3, joined_at = NOW() WHERE id = $4',
          [userId, 'active', true, existingMember.id]
        );
      } else {
        await pool.query(
          'UPDATE ff_group_members SET status = $1, email_verified = $2, joined_at = NOW() WHERE id = $3',
          ['active', true, existingMember.id]
        );
      }
      member = await getMemberById(existingMember.id);
    } else {
      // Crear nuevo miembro
      if (hasMemberUserId && userId) {
        const result = await pool.query(
          `INSERT INTO ff_group_members 
           (group_id, customer_id, user_id, email, role, status, email_verified, joined_at)
           VALUES ($1, $2, $3, $4, 'member', 'active', true, NOW())
           RETURNING *`,
          [group.id, customerId || null, userId, email]
        );
        member = result.rows[0] as FFGroupMember;
      } else {
        const result = await pool.query(
          `INSERT INTO ff_group_members 
           (group_id, customer_id, email, role, status, email_verified, joined_at)
           VALUES ($1, $2, $3, 'member', 'active', true, NOW())
           RETURNING *`,
          [group.id, customerId || null, email]
        );
        member = result.rows[0] as FFGroupMember;
      }
    }

    // Actualizar contador de miembros del grupo
    await pool.query(
      'UPDATE ff_groups SET current_members = current_members + 1, updated_at = NOW() WHERE id = $1',
      [group.id]
    );

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
      discountType,
      tiers,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
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
      if (discountType) {
        updates.push(`discount_type = $${paramCount++}`);
        values.push(discountType);
      }
      if (tiers) {
        updates.push(`tiers = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(tiers));
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
         (merchant_id, is_enabled, discount_type, tiers, rules, max_groups_per_email, cooling_period_days)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
         RETURNING *`,
        [
          merchantId,
          isEnabled ?? true,
          discountType ?? 'percentage',
          JSON.stringify(tiers || []),
          JSON.stringify(rules || {}),
          maxGroupsPerEmail ?? 1,
          coolingPeriodDays ?? 30,
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
  memberCount: number
): Promise<number> {
  try {
    const config = await getDiscountConfig(merchantId);
    
    if (!config || !config.is_enabled) {
      return 0;
    }

    const tiers = config.tiers || [];
    if (tiers.length === 0) {
      return 0;
    }

    // Ordenar tiers por memberCount descendente
    const sortedTiers = [...tiers].sort((a, b) => b.memberCount - a.memberCount);
    
    // Encontrar el tier apropiado
    for (const tier of sortedTiers) {
      if (memberCount >= tier.memberCount) {
        return tier.discountValue;
      }
    }

    return 0;
  } catch (error) {
    console.error('Error calculating discount:', error);
    return 0;
  }
}

