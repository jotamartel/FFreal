'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';

export function PolarisProvider({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AppProvider i18n={{}}>
        {children}
      </AppProvider>
    </I18nProvider>
  );
}

