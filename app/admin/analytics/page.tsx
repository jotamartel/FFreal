'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  InlineGrid,
  DataTable,
  EmptyState,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface Analytics {
  totalGroups: number;
  averageGroupSize: number;
  totalMembers: number;
  groupsByStatus: {
    active?: number;
    suspended?: number;
    terminated?: number;
  };
  topGroups: Array<{
    id: string;
    name: string;
    current_members: number;
    max_members: number;
    created_at: string;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Use 'default' to match groups created from frontend
      // In a multi-tenant app, this would come from Shopify session
      const merchantId = 'default';
      const response = await fetch(`/api/admin/analytics?merchantId=${merchantId}`);
      
      if (!response.ok) {
        console.error('Error loading analytics:', response.statusText);
        setAnalytics(null);
        return;
      }
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Analíticas / Analytics">
        <Card>
          <Text as="p">Cargando... / Loading...</Text>
        </Card>
      </Page>
    );
  }

  if (!analytics) {
    return (
      <Page title="Analíticas / Analytics">
        <Card>
          <EmptyState
            heading="No hay datos de analíticas / No analytics data"
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            action={{
              content: 'Recargar / Refresh',
              onAction: loadAnalytics,
            }}
          >
            <Text as="p">No se pudieron cargar los datos de analíticas. / Unable to load analytics data.</Text>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  const topGroupsRows = analytics.topGroups.map((group) => [
    group.name,
    `${group.current_members}/${group.max_members}`,
    new Date(group.created_at).toLocaleDateString(),
  ]);

  return (
    <Page
      title="Analíticas / Analytics"
      backAction={{ onAction: () => router.push('/admin'), content: 'Volver / Back' }}
    >
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Grupos / Total Groups
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalGroups}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Miembros / Total Members
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalMembers}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Tamaño Promedio / Avg Group Size
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.averageGroupSize.toFixed(1)}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Grupos Activos / Active Groups
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.groupsByStatus.active || 0}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Grupos por Estado / Groups by Status
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Activos / Active: <strong>{analytics.groupsByStatus.active || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  Suspendidos / Suspended: <strong>{analytics.groupsByStatus.suspended || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  Terminados / Terminated: <strong>{analytics.groupsByStatus.terminated || 0}</strong>
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Top Grupos por Cantidad de Miembros / Top Groups by Member Count
              </Text>
              {analytics.topGroups.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Aún no hay grupos. / No groups yet.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Nombre del Grupo / Group Name', 'Miembros / Members', 'Creado / Created']}
                  rows={topGroupsRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

