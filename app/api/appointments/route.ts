// API routes for Appointments

import { NextRequest, NextResponse } from 'next/server';
import { 
  createAppointment, 
  getAllAppointments,
  getAppointmentsByEmail,
  getAppointmentsByCustomerId 
} from '@/lib/database/appointments';
import { isSlotAvailable } from '@/lib/database/availability';

/**
 * POST /api/appointments - Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      notes,
    } = body;

    if (!customerName || !customerEmail || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify slot availability
    if (branchId) {
      const available = await isSlotAvailable(appointmentDate, appointmentTime, branchId);
      if (!available) {
        return NextResponse.json(
          { error: 'This time slot is no longer available' },
          { status: 409 }
        );
      }
    }

    const appointment = await createAppointment({
      merchantId,
      branchId,
      customerName,
      customerEmail,
      customerPhone,
      shopifyCustomerId,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments - Get appointments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');

    let appointments;

    if (email) {
      appointments = await getAppointmentsByEmail(email, merchantId || undefined);
    } else if (customerId) {
      appointments = await getAppointmentsByCustomerId(customerId, merchantId || undefined);
    } else {
      const limit = parseInt(searchParams.get('limit') || '100');
      appointments = await getAllAppointments(merchantId || undefined, limit);
    }

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error('Error getting appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

