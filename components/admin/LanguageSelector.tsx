'use client';

import { useState, useCallback } from 'react';
import { Button, Popover, ActionList, InlineStack, Text } from '@shopify/polaris';
import { useI18n } from '@/lib/i18n/context';

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [popoverActive, setPopoverActive] = useState(false);

  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    []
  );

  const handleLanguageChange = useCallback((lang: 'es' | 'en') => {
    setLanguage(lang);
    setPopoverActive(false);
  }, [setLanguage]);

  const activator = (
    <Button onClick={togglePopoverActive} disclosure>
      {language === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </Button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      autofocusTarget="first-node"
      onClose={togglePopoverActive}
    >
      <ActionList
        items={[
          {
            content: 'Español',
            onAction: () => handleLanguageChange('es'),
            active: language === 'es',
          },
          {
            content: 'English',
            onAction: () => handleLanguageChange('en'),
            active: language === 'en',
          },
        ]}
      />
    </Popover>
  );
}

