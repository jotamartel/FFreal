'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Hook para detectar si estamos dentro de Shopify App
 * y generar rutas apropiadas
 */
export function useShopifyApp() {
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);
  
  const host = searchParams?.get('host') || '';
  const shop = searchParams?.get('shop') || '';
  const isInShopify = Boolean(host || shop || pathname?.startsWith('/app'));

  /**
   * Genera una ruta que funciona tanto en /admin como en /app
   */
  const getRoute = (route: string) => {
    if (isInShopify && route.startsWith('/admin')) {
      return route.replace('/admin', '/app');
    }
    return route;
  };

  return {
    isInShopify,
    host,
    shop,
    getRoute,
  };
}

