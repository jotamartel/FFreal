'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  DataTable,
  Badge,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Select,
  TextField,
  EmptyState,
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
  created_at: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGroups();
  }, [statusFilter]);

  const loadGroups = async () => {
    try {
      // Use 'default' to match groups created from frontend
      // In a multi-tenant app, this would come from Shopify session
      const merchantId = 'default';
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const url = `/api/admin/groups?merchantId=${merchantId}${status ? `&status=${status}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error loading groups:', data.error);
        setGroups([]);
        return;
      }
      
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
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

  const filteredGroups = groups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.owner_email.toLowerCase().includes(query) ||
      group.invite_code.toLowerCase().includes(query)
    );
  });

  const rows = filteredGroups.map((group) => [
    group.name,
    group.owner_email,
    `${group.current_members}/${group.max_members}`,
    getStatusBadge(group.status),
    group.invite_code,
    new Date(group.created_at).toLocaleDateString(),
    <Button
      key={group.id}
      onClick={() => router.push(`/admin/groups/${group.id}`)}
    >
      View
    </Button>,
  ]);

  if (loading) {
    return (
      <Page title="Groups">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Friends & Family Groups"
      backAction={{ onAction: () => router.push('/admin') }}
      primaryAction={{
        content: 'View Analytics',
        onAction: () => router.push('/admin/analytics'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <TextField
                  label=""
                  labelHidden
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  autoComplete="off"
                />
                <Select
                  label=""
                  labelHidden
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Suspended', value: 'suspended' },
                    { label: 'Terminated', value: 'terminated' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </InlineStack>

              {filteredGroups.length === 0 ? (
                <EmptyState
                  heading="No groups found"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                  action={{
                    content: 'Refresh',
                    onAction: loadGroups,
                  }}
                >
                  <Text as="p">No groups match your search criteria.</Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'Owner', 'Members', 'Status', 'Invite Code', 'Created', 'Actions']}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

