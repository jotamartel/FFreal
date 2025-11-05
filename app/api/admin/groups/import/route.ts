// API route to import groups and members

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

interface ImportGroup {
  id?: string;
  merchant_id?: string;
  name: string;
  owner_email: string;
  owner_customer_id?: string;
  owner_user_id?: string;
  invite_code?: string;
  max_members?: number;
  current_members?: number;
  status?: string;
  members?: ImportMember[];
}

interface ImportMember {
  id?: string;
  group_id?: string;
  email: string;
  customer_id?: string;
  user_id?: string;
  role?: string;
  status?: string;
  email_verified?: boolean;
}

/**
 * POST /api/admin/groups/import - Import groups and members
 * Body: JSON with groups array
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groups, merchantId = 'default', mode = 'skip' } = body;

    // mode: 'skip' (skip existing), 'update' (update existing), 'replace' (delete and recreate)
    
    if (!groups || !Array.isArray(groups)) {
      return NextResponse.json(
        { error: 'Invalid import data. Expected groups array.' },
        { status: 400 }
      );
    }

    console.log('[IMPORT] Importing groups:', {
      count: groups.length,
      merchantId,
      mode,
    });

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      groupIds: [] as string[],
    };

    for (const groupData of groups) {
      try {
        const group: ImportGroup = groupData;

        // Validate required fields
        if (!group.name || !group.owner_email) {
          results.errors.push(`Group missing required fields: ${group.name || 'unknown'}`);
          continue;
        }

        // Check if group exists (by name or invite_code)
        let existingGroup: any = null;
        
        if (group.invite_code) {
          const existingResult = await pool.query(
            'SELECT id FROM ff_groups WHERE invite_code = $1 AND merchant_id = $2',
            [group.invite_code, merchantId]
          );
          existingGroup = existingResult.rows[0];
        }

        if (!existingGroup && group.name) {
          const existingResult = await pool.query(
            'SELECT id FROM ff_groups WHERE name = $1 AND merchant_id = $2 LIMIT 1',
            [group.name, merchantId]
          );
          existingGroup = existingResult.rows[0];
        }

        let groupId: string;

        if (existingGroup) {
          if (mode === 'skip') {
            results.skipped++;
            results.groupIds.push(existingGroup.id);
            continue;
          }

          // Update existing group
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          if (group.max_members !== undefined) {
            updateFields.push(`max_members = $${paramIndex++}`);
            updateValues.push(group.max_members);
          }
          if (group.status) {
            updateFields.push(`status = $${paramIndex++}`);
            updateValues.push(group.status);
          }
          if (group.owner_email) {
            updateFields.push(`owner_email = $${paramIndex++}`);
            updateValues.push(group.owner_email);
          }

          updateValues.push(existingGroup.id);

          if (updateFields.length > 0) {
            await pool.query(
              `UPDATE ff_groups SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
              updateValues
            );
            results.updated++;
          } else {
            results.skipped++;
          }

          groupId = existingGroup.id;
        } else {
          // Create new group
          const inviteCode = group.invite_code || generateInviteCode();
          const maxMembers = group.max_members || 6;
          const status = group.status || 'active';

          // Generate unique invite code if needed
          let finalInviteCode = inviteCode;
          let attempts = 0;
          while (attempts < 10) {
            const codeCheck = await pool.query(
              'SELECT id FROM ff_groups WHERE invite_code = $1',
              [finalInviteCode]
            );
            if (codeCheck.rows.length === 0) break;
            finalInviteCode = generateInviteCode();
            attempts++;
          }

          const insertResult = await pool.query(
            `INSERT INTO ff_groups 
             (merchant_id, name, owner_customer_id, owner_email, owner_user_id, invite_code, max_members, current_members, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
             RETURNING id`,
            [
              merchantId,
              group.name,
              group.owner_customer_id || null,
              group.owner_email,
              group.owner_user_id || null,
              finalInviteCode,
              maxMembers,
              status,
            ]
          );

          groupId = insertResult.rows[0].id;
          results.created++;
        }

        results.groupIds.push(groupId);

        // Import members
        if (group.members && Array.isArray(group.members)) {
          for (const memberData of group.members) {
            try {
              const member: ImportMember = memberData;

              if (!member.email) {
                continue;
              }

              // Check if member exists
              const existingMember = await pool.query(
                'SELECT id FROM ff_group_members WHERE group_id = $1 AND email = $2',
                [groupId, member.email]
              );

              if (existingMember.rows.length > 0 && mode === 'skip') {
                continue;
              }

              const role = member.role || 'member';
              const status = member.status || 'active';
              const emailVerified = member.email_verified !== undefined ? member.email_verified : true;

              // Check if user_id column exists
              const membersColumns = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'ff_group_members' AND column_name = 'user_id'
              `);
              const hasUserId = membersColumns.rows.length > 0;

              if (existingMember.rows.length > 0 && mode === 'update') {
                // Update existing member
                if (hasUserId && member.user_id) {
                  await pool.query(
                    'UPDATE ff_group_members SET user_id = $1, status = $2, email_verified = $3, updated_at = NOW() WHERE id = $4',
                    [member.user_id, status, emailVerified, existingMember.rows[0].id]
                  );
                } else {
                  await pool.query(
                    'UPDATE ff_group_members SET status = $2, email_verified = $3, updated_at = NOW() WHERE id = $4',
                    [status, emailVerified, existingMember.rows[0].id]
                  );
                }
              } else if (!existingMember.rows.length) {
                // Create new member
                if (hasUserId && member.user_id) {
                  await pool.query(
                    `INSERT INTO ff_group_members 
                     (group_id, customer_id, user_id, email, role, status, email_verified, joined_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [
                      groupId,
                      member.customer_id || null,
                      member.user_id,
                      member.email,
                      role,
                      status,
                      emailVerified,
                    ]
                  );
                } else {
                  await pool.query(
                    `INSERT INTO ff_group_members 
                     (group_id, customer_id, email, role, status, email_verified, joined_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [
                      groupId,
                      member.customer_id || null,
                      member.email,
                      role,
                      status,
                      emailVerified,
                    ]
                  );
                }

                // Update group member count
                await pool.query(
                  'UPDATE ff_groups SET current_members = current_members + 1, updated_at = NOW() WHERE id = $1',
                  [groupId]
                );
              }
            } catch (memberError: any) {
              results.errors.push(`Error importing member ${member.email}: ${memberError.message}`);
            }
          }
        }
      } catch (groupError: any) {
        results.errors.push(`Error importing group ${group.name}: ${groupError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: groups.length,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[IMPORT] Error importing groups:', error);
    return NextResponse.json(
      { error: error.message || 'Error importing groups and members' },
      { status: 500 }
    );
  }
}

function generateInviteCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

