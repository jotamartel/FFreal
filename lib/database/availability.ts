// Database functions for Availability Management

import { pool } from './client';
import { DBAvailabilitySlot, AvailableSlot, DAY_NAMES } from '@/types/availability';

/**
 * Obtener slots de disponibilidad para un día específico de la semana
 */
export async function getAvailabilitySlotsByDay(
  dayOfWeek: number,
  branchId?: string
): Promise<DBAvailabilitySlot[]> {
  try {
    if (!branchId) {
      return [];
    }

    const query = `
      SELECT * FROM availability_slots 
      WHERE day_of_week = $1 AND branch_id = $2 AND is_active = true
      ORDER BY start_time ASC
    `;

    const result = await pool.query(query, [dayOfWeek, branchId]);
    return result.rows as DBAvailabilitySlot[];
  } catch (error) {
    console.error('Error getting availability slots:', error);
    return [];
  }
}

/**
 * Obtener horarios disponibles para una fecha específica
 */
export async function getAvailableSlotsForDate(
  date: string,
  branchId?: string
): Promise<AvailableSlot[]> {
  try {
    if (!branchId) {
      return [];
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const slots = await getAvailabilitySlotsByDay(dayOfWeek, branchId);

    if (slots.length === 0) {
      return [];
    }

    const countQuery = `
      SELECT appointment_time, COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date = $1 AND branch_id = $2 AND status != 'cancelled'
      GROUP BY appointment_time
    `;

    const result = await pool.query(countQuery, [date, branchId]);

    const bookedSlots = new Map(
      result.rows.map((row: any) => [
        row.appointment_time,
        parseInt(row.count)
      ])
    );

    return slots
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(slot => ({
        date,
        time: slot.start_time,
        dayName: DAY_NAMES[dayOfWeek],
        available: (bookedSlots.get(slot.start_time) || 0) < slot.max_appointments,
        branchId: slot.branch_id || undefined,
      }));
  } catch (error) {
    console.error('Error getting available slots for date:', error);
    return [];
  }
}

/**
 * Obtener próximos días con disponibilidad
 */
export async function getNextAvailableDays(
  daysAhead: number = 30,
  branchId?: string
): Promise<AvailableSlot[]> {
  const available: AvailableSlot[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    
    const dateStr = checkDate.toISOString().split('T')[0];
    const slots = await getAvailableSlotsForDate(dateStr, branchId);
    available.push(...slots.filter(s => s.available));
  }

  return available;
}

/**
 * Verificar si un slot específico está disponible
 */
export async function isSlotAvailable(
  date: string,
  time: string,
  branchId?: string
): Promise<boolean> {
  try {
    if (!branchId) {
      return false;
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const slotQuery = `
      SELECT max_appointments 
      FROM availability_slots 
      WHERE day_of_week = $1 AND start_time = $2 AND branch_id = $3 AND is_active = true
    `;

    const slotResult = await pool.query(slotQuery, [dayOfWeek, time, branchId]);

    if (slotResult.rows.length === 0) {
      return false;
    }

    const maxAppointments = slotResult.rows[0].max_appointments;

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date = $1 AND appointment_time = $2 AND branch_id = $3 AND status != 'cancelled'
    `;

    const countResult = await pool.query(countQuery, [date, time, branchId]);
    const bookedCount = parseInt(countResult.rows[0].count);

    return bookedCount < maxAppointments;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
}

/**
 * Obtener todos los slots de disponibilidad
 */
export async function getAllAvailabilitySlots(merchantId?: string): Promise<DBAvailabilitySlot[]> {
  try {
    let query = 'SELECT * FROM availability_slots';
    const params: any[] = [];
    
    if (merchantId) {
      query += ' WHERE merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' ORDER BY day_of_week ASC, start_time ASC';

    const result = await pool.query(query, params);
    return result.rows as DBAvailabilitySlot[];
  } catch (error) {
    console.error('Error getting all availability slots:', error);
    return [];
  }
}

