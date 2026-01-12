// API route to validate cart rules before checkout

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CartItem {
  productId?: string;
  sku?: string;
  quantity: number;
  category?: string;
  categories?: string[];
}

interface ValidateCartPayload {
  items?: CartItem[];
}

const MAX_TOTAL_ITEMS = 20;
const MAX_LUXURY_ITEMS = 5;
const LUXURY_CATEGORY_KEYWORD = 'lujo';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateCartPayload;
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          errors: ['El carrito está vacío o el formato de items es inválido.'],
        },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    const totalQuantity = items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0);
    if (totalQuantity > MAX_TOTAL_ITEMS) {
      errors.push(`El carrito supera el máximo permitido de ${MAX_TOTAL_ITEMS} unidades totales.`);
    }

    const luxuryQuantity = items.reduce((sum, item) => {
      const categories: string[] = [];
      if (item.category) {
        categories.push(item.category.toLowerCase());
      }
      if (Array.isArray(item.categories)) {
        categories.push(...item.categories.map((c) => (c ? c.toLowerCase() : '')));
      }
      const isLuxury = categories.some((c) => c.includes(LUXURY_CATEGORY_KEYWORD));
      return isLuxury ? sum + Math.max(0, item.quantity || 0) : sum;
    }, 0);

    if (luxuryQuantity > MAX_LUXURY_ITEMS) {
      errors.push(`Los productos de la categoría Lujo superan el máximo de ${MAX_LUXURY_ITEMS} unidades.`);
    }

    const isValid = errors.length === 0;

    return NextResponse.json(
      {
        valid: isValid,
        errors,
        summary: {
          totalItems: totalQuantity,
          luxuryItems: luxuryQuantity,
          maxTotalItems: MAX_TOTAL_ITEMS,
          maxLuxuryItems: MAX_LUXURY_ITEMS,
        },
      },
      { status: isValid ? 200 : 400 }
    );
  } catch (error) {
    console.error('[POST /api/checkout/validate-cart] Error:', error);
    return NextResponse.json(
      {
        valid: false,
        errors: ['Error interno del servidor'],
      },
      { status: 500 }
    );
  }
}
