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
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

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
  const { t } = useI18n();
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
      <Page title={t('analytics.title')}>
        <Card>
          <Text as="p">{t('common.loading')}</Text>
        </Card>
      </Page>
    );
  }

  if (!analytics) {
    return (
      <Page title={t('analytics.title')}>
        <Card>
          <EmptyState
            heading={t('analytics.noData')}
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            action={{
              content: t('common.reload'),
              onAction: loadAnalytics,
            }}
          >
            <Text as="p">{t('analytics.unableToLoad')}</Text>
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
      title={t('analytics.title')}
      backAction={{ onAction: () => router.push('/admin'), content: t('common.back') }}
      secondaryActions={[
        {
          content: <LanguageSelector />,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('analytics.totalGroups')}
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalGroups}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('analytics.totalMembers')}
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalMembers}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('analytics.avgGroupSize')}
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.averageGroupSize.toFixed(1)}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('analytics.activeGroups')}
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
                {t('analytics.groupsByStatus')}
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  {t('analytics.activePlural')}: <strong>{analytics.groupsByStatus.active || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  {t('analytics.suspended')}: <strong>{analytics.groupsByStatus.suspended || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  {t('analytics.terminated')}: <strong>{analytics.groupsByStatus.terminated || 0}</strong>
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('analytics.topGroups')}
              </Text>
              {analytics.topGroups.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t('analytics.noGroups')}
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={[t('analytics.groupName'), t('analytics.members'), t('analytics.created')]}
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

