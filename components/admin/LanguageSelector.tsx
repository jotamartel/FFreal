'use client';

import { Select } from '@shopify/polaris';
import { useI18n } from '@/lib/i18n/context';

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  const options = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
  ];

  return (
    <Select
      label=""
      options={options}
      value={language}
      onChange={(value) => setLanguage(value as 'es' | 'en')}
    />
  );
}

