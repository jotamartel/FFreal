// Types for Appointments (Simplified - no chatbot dependency)

export interface DBAppointment {
  id: string;
  merchant_id: string | null;
  branch_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shopify_customer_id: string | null;
  appointment_date: string; // ISO date string
  appointment_time: string; // HH:MM format
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentParams {
  merchantId?: string;
  branchId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shopifyCustomerId?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentParams {
  id: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

