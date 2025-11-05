'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Badge,
  EmptyState,
  Banner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  owner_email: string;
  current_members: number;
  max_members: number;
  status: string;
  invite_code: string;
  discount_tier: number;
}

export default function CustomerPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/customer/group');
      
      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load groups');
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">Active</Badge>;
      case 'suspended':
        return <Badge tone="attention">Suspended</Badge>;
      case 'terminated':
        return <Badge tone="critical">Terminated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Page title="My Groups">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  const activeGroup = groups.find(g => g.status === 'active');

  return (
    <Page
      title="Friends & Family"
      subtitle="Manage your discount groups"
    >
      <Layout>
        {activeGroup && (
          <Layout.Section>
            <Banner tone="info">
              You're currently in the <strong>{activeGroup.name}</strong> group. 
              You're saving with a {activeGroup.discount_tier}% discount!
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          {groups.length === 0 ? (
            <Card>
              <EmptyState
                heading="No groups yet"
                action={{
                  content: 'Create a Group',
                  onAction: () => router.push('/customer/groups/new'),
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>Create a Friends & Family group to start saving together!</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  My Groups ({groups.length})
                </Text>

                {groups.map((group) => (
                  <Card key={group.id}>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            {group.name}
                          </Text>
                          {getStatusBadge(group.status)}
                        </BlockStack>
                        <Button
                          onClick={() => router.push(`/customer/groups/${group.id}`)}
                        >
                          Manage
                        </Button>
                      </InlineStack>

                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          Members: {group.current_members} / {group.max_members}
                        </Text>
                        {group.status === 'active' && (
                          <Text as="p" variant="bodyMd" tone="success">
                            Current Discount: {group.discount_tier}%
                          </Text>
                        )}
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Invite Code: <code style={{ fontFamily: 'monospace' }}>{group.invite_code}</code>
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            </Card>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <Button
                variant="primary"
                onClick={() => router.push('/customer/groups/new')}
                disabled={activeGroup !== undefined}
              >
                Create New Group
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

