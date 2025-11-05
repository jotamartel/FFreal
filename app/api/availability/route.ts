// API routes for Availability

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlotsForDate, getNextAvailableDays } from '@/lib/database/availability';

/**
 * GET /api/availability - Get available slots
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const branchId = searchParams.get('branchId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30');

    if (!branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 }
      );
    }

    let slots;

    if (date) {
      slots = await getAvailableSlotsForDate(date, branchId);
    } else {
      slots = await getNextAvailableDays(daysAhead, branchId);
    }

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error('Error getting availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

