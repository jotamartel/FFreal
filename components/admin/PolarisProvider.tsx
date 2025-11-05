'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { ReactNode } from 'react';

export function PolarisProvider({ children }: { children: ReactNode }) {
  return (
    <AppProvider i18n={{}}>
      {children}
    </AppProvider>
  );
}

