// Database functions for Appointments (Simplified - no chatbot dependency)

import { pool } from './client';
import { DBAppointment, CreateAppointmentParams, UpdateAppointmentParams } from '@/types/appointments';

/**
 * Crear una nueva cita
 */
export async function createAppointment(
  params: CreateAppointmentParams
): Promise<DBAppointment | null> {
  try {
    const { 
      merchantId, 
      branchId, 
      customerName, 
      customerEmail, 
      customerPhone,
      shopifyCustomerId,
      appointmentDate, 
      appointmentTime, 
      reason, 
      notes 
    } = params;

    const result = await pool.query(
      `INSERT INTO appointments 
       (merchant_id, branch_id, customer_name, customer_email, customer_phone, shopify_customer_id, appointment_date, appointment_time, reason, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        merchantId || null, 
        branchId || null, 
        customerName, 
        customerEmail, 
        customerPhone || null,
        shopifyCustomerId || null,
        appointmentDate, 
        appointmentTime, 
        reason || null, 
        notes || null
      ]
    );

    return result.rows[0] as DBAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    return null;
  }
}

/**
 * Obtener todas las citas
 */
export async function getAllAppointments(
  merchantId?: string,
  limit: number = 100
): Promise<DBAppointment[]> {
  try {
    let query = 'SELECT * FROM appointments';
    const params: any[] = [];
    
    if (merchantId) {
      query += ' WHERE merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' ORDER BY appointment_date DESC, appointment_time DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows as DBAppointment[];
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
}

/**
 * Obtener cita por ID
 */
export async function getAppointmentById(id: string): Promise<DBAppointment | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    return result.rows[0] as DBAppointment || null;
  } catch (error) {
    console.error('Error getting appointment by id:', error);
    return null;
  }
}

/**
 * Obtener citas por customer email
 */
export async function getAppointmentsByEmail(
  email: string,
  merchantId?: string
): Promise<DBAppointment[]> {
  try {
    let query = 'SELECT * FROM appointments WHERE customer_email = $1';
    const params: any[] = [email];
    
    if (merchantId) {
      query += ' AND merchant_id = $2';
      params.push(merchantId);
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as DBAppointment[];
  } catch (error) {
    console.error('Error getting appointments by email:', error);
    return [];
  }
}

/**
 * Obtener citas por Shopify customer ID
 */
export async function getAppointmentsByCustomerId(
  customerId: string,
  merchantId?: string
): Promise<DBAppointment[]> {
  try {
    let query = 'SELECT * FROM appointments WHERE shopify_customer_id = $1';
    const params: any[] = [customerId];
    
    if (merchantId) {
      query += ' AND merchant_id = $2';
      params.push(merchantId);
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as DBAppointment[];
  } catch (error) {
    console.error('Error getting appointments by customer ID:', error);
    return [];
  }
}

/**
 * Actualizar estado de una cita
 */
export async function updateAppointment(
  params: UpdateAppointmentParams
): Promise<DBAppointment | null> {
  try {
    const { id, status, notes } = params;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE appointments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] as DBAppointment || null;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return null;
  }
}

/**
 * Cancelar una cita
 */
export async function cancelAppointment(id: string): Promise<boolean> {
  try {
    const result = await updateAppointment({ id, status: 'cancelled' });
    return result !== null;
  } catch (error) {
    console.error('Error canceling appointment:', error);
    return false;
  }
}

/**
 * Obtener citas pendientes
 */
export async function getPendingAppointments(
  merchantId?: string
): Promise<DBAppointment[]> {
  try {
    let query = `SELECT * FROM appointments 
       WHERE status = 'pending' 
       AND appointment_date >= CURRENT_DATE`;
    const params: any[] = [];
    
    if (merchantId) {
      query += ' AND merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' ORDER BY appointment_date ASC, appointment_time ASC';

    const result = await pool.query(query, params);
    return result.rows as DBAppointment[];
  } catch (error) {
    console.error('Error getting pending appointments:', error);
    return [];
  }
}

