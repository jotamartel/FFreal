// Database functions for Branches Management

import { pool } from './client';
import { DBBranch, CreateBranchParams } from '@/types/branch';

/**
 * Obtener todas las sucursales activas
 */
export async function getActiveBranches(merchantId?: string): Promise<DBBranch[]> {
  try {
    let query = 'SELECT * FROM branches WHERE is_active = true';
    const params: any[] = [];
    
    if (merchantId) {
      query += ' AND merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return result.rows as DBBranch[];
  } catch (error) {
    console.error('Error getting active branches:', error);
    return [];
  }
}

/**
 * Obtener todas las sucursales (activas e inactivas)
 */
export async function getAllBranches(merchantId?: string): Promise<DBBranch[]> {
  try {
    let query = 'SELECT * FROM branches';
    const params: any[] = [];
    
    if (merchantId) {
      query += ' WHERE merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return result.rows as DBBranch[];
  } catch (error) {
    console.error('Error getting all branches:', error);
    return [];
  }
}

/**
 * Obtener una sucursal por ID
 */
export async function getBranchById(id: string): Promise<DBBranch | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM branches WHERE id = $1',
      [id]
    );

    return result.rows[0] as DBBranch || null;
  } catch (error) {
    console.error('Error getting branch by ID:', error);
    return null;
  }
}

/**
 * Crear una nueva sucursal
 */
export async function createBranch(
  params: CreateBranchParams
): Promise<DBBranch | null> {
  try {
    const { merchantId, name, address, city, phone, email } = params;

    const result = await pool.query(
      'INSERT INTO branches (merchant_id, name, address, city, phone, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [merchantId || null, name, address || null, city || null, phone || null, email || null]
    );

    return result.rows[0] as DBBranch;
  } catch (error) {
    console.error('Error creating branch:', error);
    return null;
  }
}

/**
 * Actualizar estado de una sucursal
 */
export async function updateBranchStatus(
  id: string,
  isActive: boolean
): Promise<DBBranch | null> {
  try {
    const result = await pool.query(
      'UPDATE branches SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    return result.rows[0] as DBBranch || null;
  } catch (error) {
    console.error('Error updating branch status:', error);
    return null;
  }
}

