// API route to join a group using invite code directly

import { NextRequest, NextResponse } from 'next/server';
import { joinGroupByCode } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/database/users';

/**
 * POST /api/invitations/join-by-code - Join a group using invite code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, email } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Código de invitación requerido' },
        { status: 400 }
      );
    }

    // Get user from session if authenticated
    const session = await getSession();
    let userId: string | undefined;
    let customerId: string | undefined;
    let userEmail = email;

    if (session) {
      const user = await getUserById(session.userId);
      if (user) {
        userId = user.id;
        customerId = user.shopify_customer_id || user.id;
        userEmail = user.email; // Use authenticated user's email
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email requerido. Por favor inicia sesión o proporciona un email.' },
        { status: 400 }
      );
    }

    const member = await joinGroupByCode(
      inviteCode.trim().toUpperCase(),
      userEmail,
      customerId,
      userId
    );

    if (!member) {
      return NextResponse.json(
        { error: 'No se pudo unir al grupo. Verifica que el código sea correcto, que el grupo no esté lleno, y que no seas ya miembro.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        member,
        message: 'Te has unido al grupo exitosamente'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining group by code:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

