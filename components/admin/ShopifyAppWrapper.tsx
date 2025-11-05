'use client';

import { useEffect } from 'react';
import { PolarisProvider } from './PolarisProvider';

interface ShopifyAppWrapperProps {
  children: React.ReactNode;
}

export function ShopifyAppWrapper({ children }: ShopifyAppWrapperProps) {
  useEffect(() => {
    // Inicializar App Bridge si estamos dentro de Shopify
    // App Bridge se inicializa automáticamente cuando hay parámetros host y shop
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const host = urlParams.get('host');
      const shop = urlParams.get('shop');
      const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

      if (host && shop && apiKey) {
        // App Bridge se inicializa automáticamente por Shopify
        // Solo logueamos para confirmar que estamos en Shopify
        console.log('App cargada dentro de Shopify:', { shop, host });
      }
    }
  }, []);

  // Polaris funciona perfectamente sin Provider adicional
  // App Bridge se inicializa automáticamente desde Shopify cuando detecta los parámetros
  return <PolarisProvider>{children}</PolarisProvider>;
}


