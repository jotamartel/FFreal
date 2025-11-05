// Types for Availability System

export interface DBAvailabilitySlot {
  id: string;
  merchant_id: string | null;
  branch_id: string | null;
  day_of_week: number; // 0-6 (0=Sunday)
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  max_appointments: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dayName: string;
  available: boolean;
  branchId?: string;
}

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

