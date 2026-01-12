'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  InlineGrid,
  DataTable,
  EmptyState,
  InlineStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

interface GrowthPoint {
  month: string;
  count: number;
}

interface SizeDistribution {
  upTo2: number;
  from3To4: number;
  from5To6: number;
  from7To10: number;
  above10: number;
}

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
  growth?: GrowthPoint[];
  sizeDistribution?: SizeDistribution;
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

  const growthRows = useMemo(() => {
    if (!analytics.growth || analytics.growth.length === 0) return [];
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      year: 'numeric',
    });
    return analytics.growth.map((point) => {
      const label = point.month ? formatter.format(new Date(point.month)) : t('analytics.unknown');
      return {
        label,
        count: point.count,
      };
    });
  }, [analytics.growth, t]);

  const distributionItems = useMemo(() => {
    const distribution = analytics.sizeDistribution;
    if (!distribution) return [];
    const total =
      distribution.upTo2 +
      distribution.from3To4 +
      distribution.from5To6 +
      distribution.from7To10 +
      distribution.above10 || 1;

    const makeItem = (label: string, value: number) => ({
      label,
      value,
      percentage: Math.round((value / total) * 100),
    });

    return [
      makeItem(t('analytics.distribution.upTo2'), distribution.upTo2),
      makeItem(t('analytics.distribution.from3To4'), distribution.from3To4),
      makeItem(t('analytics.distribution.from5To6'), distribution.from5To6),
      makeItem(t('analytics.distribution.from7To10'), distribution.from7To10),
      makeItem(t('analytics.distribution.above10'), distribution.above10),
    ];
  }, [analytics.sizeDistribution, t]);

  return (
    <Page
      title={t('analytics.title')}
      backAction={{ onAction: () => router.push('/admin'), content: t('common.back') }}
      secondaryActions={[
        {
          content: <LanguageSelector />,
        } as any,
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
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  {t('analytics.growthTitle')}
                </Text>
                <Text as="p" tone="subdued" variant="bodyMd">
                  {t('analytics.growthSubtitle')}
                </Text>
              </InlineStack>
              {growthRows.length === 0 ? (
                <Text as="p" tone="subdued" variant="bodyMd">
                  {t('analytics.noGrowthData')}
                </Text>
              ) : (
                <BlockStack gap="200">
                  {growthRows.map((row) => (
                    <InlineStack key={row.label} align="space-between">
                      <Text as="p" variant="bodyMd">{row.label}</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {row.count}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('analytics.distribution.title')}
              </Text>
              {distributionItems.length === 0 ? (
                <Text as="p" tone="subdued" variant="bodyMd">
                  {t('analytics.distribution.noData')}
                </Text>
              ) : (
                <BlockStack gap="200">
                  {distributionItems.map((item) => (
                    <BlockStack key={item.label} gap="100">
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodyMd">{item.label}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {item.value} · {item.percentage}%
                        </Text>
                      </InlineStack>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--p-color-bg-surface-success-subdued)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.percentage}%`,
                            height: '100%',
                            backgroundColor: 'var(--p-color-bg-success-strong)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </BlockStack>
                  ))}
                </BlockStack>
              )}
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

