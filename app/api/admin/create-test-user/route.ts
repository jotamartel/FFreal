// Endpoint temporal para crear usuario de prueba
// IMPORTANTE: Eliminar este endpoint después de crear el usuario

import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/database/users';

export async function POST(request: NextRequest) {
  try {
    // Leer el body
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      );
    }

    // Crear el usuario
    const user = await createUser({
      email,
      password,
      name: name || null,
      role: 'customer',
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Error al crear el usuario. Verifica que el email no exista ya.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

