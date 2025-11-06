'use client';

import { Page, Card, Layout, Text, BlockStack, InlineGrid, InlineStack } from '@shopify/polaris';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isInShopify, setIsInShopify] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      const shop = params.get('shop');
      setIsInShopify(Boolean(host || shop || pathname?.startsWith('/app')));
    }
  }, [pathname]);

  const getRoute = (route: string) => {
    if (isInShopify && route.startsWith('/admin')) {
      return route.replace('/admin', '/app');
    }
    return route;
  };

  return (
    <Page
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      secondaryActions={[
        {
          content: <LanguageSelector />,
        } as any,
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('dashboard.quickAccess')}
              </Text>
              <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                <div
                  onClick={() => router.push(getRoute('/admin/groups'))}
                  style={{ cursor: 'pointer' }}
                >
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        {t('dashboard.groups.title')}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {t('dashboard.groups.description')}
                      </Text>
                    </BlockStack>
                  </Card>
                </div>
                <div
                  onClick={() => router.push(getRoute('/admin/users'))}
                  style={{ cursor: 'pointer' }}
                >
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        {t('dashboard.users.title')}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {t('dashboard.users.description')}
                      </Text>
                    </BlockStack>
                  </Card>
                </div>
                <div
                  onClick={() => router.push(getRoute('/admin/config'))}
                  style={{ cursor: 'pointer' }}
                >
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        {t('dashboard.config.title')}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {t('dashboard.config.description')}
                      </Text>
                    </BlockStack>
                  </Card>
                </div>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <div
            onClick={() => router.push(getRoute('/admin/analytics'))}
            style={{ cursor: 'pointer' }}
          >
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  {t('dashboard.analytics.title')}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('dashboard.analytics.description')}
                </Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

