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
      <Page title="Analytics">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  if (!analytics) {
    return (
      <Page title="Analytics">
        <Card>
          <EmptyState
            heading="No analytics data"
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            action={{
              content: 'Refresh',
              onAction: loadAnalytics,
            }}
          >
            <Text as="p">Unable to load analytics data.</Text>
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
      title="Analytics"
      backAction={{ onAction: () => router.push('/admin') }}
    >
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Groups
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalGroups}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Members
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.totalMembers}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Avg Group Size
                </Text>
                <Text as="h2" variant="heading2xl">
                  {analytics.averageGroupSize.toFixed(1)}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Active Groups
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
                Groups by Status
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Active: <strong>{analytics.groupsByStatus.active || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  Suspended: <strong>{analytics.groupsByStatus.suspended || 0}</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  Terminated: <strong>{analytics.groupsByStatus.terminated || 0}</strong>
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Top Groups by Member Count
              </Text>
              {analytics.topGroups.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No groups yet.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Group Name', 'Members', 'Created']}
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

