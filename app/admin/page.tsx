'use client';

import { Page, Card, Layout, Text, BlockStack, InlineGrid } from '@shopify/polaris';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isInShopify, setIsInShopify] = useState(false);

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
      title="Dashboard Friends & Family"
      subtitle="Gestiona grupos de descuento"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Acceso Rápido
              </Text>
              <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                <div
                  onClick={() => router.push(getRoute('/admin/groups'))}
                  style={{ cursor: 'pointer' }}
                >
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Grupos / Groups
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Gestiona grupos Friends & Family / Manage Friends & Family groups
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
                        Usuarios / Users
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Gestiona permisos y acceso de usuarios / Manage user permissions and access
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
                        Configuración / Discount Config
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Configura niveles y reglas de descuento / Configure discount tiers and rules
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
                  Analíticas / Analytics
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Ver estadísticas y métricas de grupos / View group statistics and performance metrics
                </Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

