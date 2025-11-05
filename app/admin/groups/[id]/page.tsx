'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  Badge,
  Button,
  InlineStack,
  DataTable,
  Banner,
} from '@shopify/polaris';
import { useRouter, useParams } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  owner_email: string;
  owner_customer_id: string;
  current_members: number;
  max_members: number;
  status: string;
  invite_code: string;
  created_at: string;
}

interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
  email_verified: boolean;
  joined_at: string;
}

interface GroupData {
  group: Group;
  members: Member[];
  allMembers?: Member[];
  memberCountBreakdown?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      const groupData: GroupData = await groupResponse.json();
      
      setGroup(groupData.group);
      setMembers(groupData.members || []);
      
      // Log breakdown if available for debugging
      if (groupData.memberCountBreakdown) {
        console.log('[GROUP] Member count breakdown:', groupData.memberCountBreakdown);
      }
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this group?')) return;

    setSuspending(true);
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });

      if (response.ok) {
        loadGroup();
      }
    } catch (error) {
      console.error('Error suspending group:', error);
    } finally {
      setSuspending(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this group? This action cannot be undone.')) return;

    setSuspending(true);
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminate' }),
      });

      if (response.ok) {
        loadGroup();
      }
    } catch (error) {
      console.error('Error terminating group:', error);
    } finally {
      setSuspending(false);
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

  const getMemberStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">Active</Badge>;
      case 'pending':
        return <Badge>Pending</Badge>;
      case 'removed':
        return <Badge tone="critical">Removed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Page title="Group Details">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  if (!group) {
    return (
      <Page title="Group Details">
        <Card>
          <Text as="p">Group not found</Text>
        </Card>
      </Page>
    );
  }

  const memberRows = members.map((member) => [
    member.email,
    member.role === 'owner' ? <Badge>Owner</Badge> : <Badge>Member</Badge>,
    getMemberStatusBadge(member.status),
    member.email_verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>,
    member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-',
  ]);

  return (
    <Page
      title={group.name}
      backAction={{ onAction: () => router.push('/admin/groups') }}
      primaryAction={
        group.status === 'active'
          ? {
              content: 'Suspend Group',
              destructive: true,
              onAction: handleSuspend,
              loading: suspending,
            }
          : undefined
      }
      secondaryActions={
        group.status === 'active'
          ? [
              {
                content: 'Terminate Group',
                destructive: true,
                onAction: handleTerminate,
                loading: suspending,
              },
            ]
          : []
      }
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Group Information
                  </Text>
                  {getStatusBadge(group.status)}
                </BlockStack>
              </InlineStack>

              <BlockStack gap="300">
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Owner:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {group.owner_email}
                  </Text>
                </div>

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Members:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {group.current_members} / {group.max_members}
                  </Text>
                </div>

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Invite Code:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <code style={{ fontFamily: 'monospace' }}>{group.invite_code}</code>
                  </Text>
                </div>

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Created:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {new Date(group.created_at).toLocaleString()}
                  </Text>
                </div>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Group Members ({members.length})
                </Text>
                {group.current_members !== members.length && (
                  <Button
                    variant="secondary"
                    size="slim"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/admin/groups/${groupId}/sync-members`, {
                          method: 'POST',
                        });
                        const result = await response.json();
                        if (result.success) {
                          loadGroup();
                        }
                      } catch (error) {
                        console.error('Error syncing:', error);
                      }
                    }}
                  >
                    Sync Count
                  </Button>
                )}
              </InlineStack>
              
              {group.current_members !== members.length && (
                <Banner tone="attention">
                  Member count mismatch: Database shows {group.current_members} but there are {members.length} active members. Click "Sync Count" to fix.
                </Banner>
              )}

              {members.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No members yet.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Email', 'Role', 'Status', 'Verified', 'Joined']}
                  rows={memberRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

