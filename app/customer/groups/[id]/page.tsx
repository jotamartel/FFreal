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
  TextField,
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

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();
      
      setGroup(data.group);
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          email: inviteEmail.trim(),
          expiresInDays: 7,
        }),
      });

      const data = await response.json();

      if (response.ok && data.invitation) {
        setSuccess(`Invitation sent to ${inviteEmail}!`);
        setInviteEmail('');
        // TODO: Send email with invitation link
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group? You will lose access to the discount.')) {
      return;
    }

    setLeaving(true);
    setError(null);

    try {
      // TODO: Get customer ID from session
      const customerId = 'demo-customer-id';
      const customerEmail = 'customer@example.com';

      const response = await fetch('/api/customer/group/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          customerId,
          email: customerEmail,
        }),
      });

      if (response.ok) {
        router.push('/customer');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLeaving(false);
    }
  };

  const isOwner = group?.owner_customer_id === 'demo-customer-id'; // TODO: Get from session

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
    member.status === 'active' ? <Badge tone="success">Active</Badge> : <Badge>{member.status}</Badge>,
    member.email_verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>,
  ]);

  const canInvite = group.current_members < group.max_members && group.status === 'active';

  return (
    <Page
      title={group.name}
      backAction={{ onAction: () => router.push('/customer') }}
      secondaryActions={
        !isOwner
          ? [
              {
                content: 'Leave Group',
                destructive: true,
                onAction: handleLeave,
                loading: leaving,
              },
            ]
          : []
      }
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="300">
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Invite Code:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <code style={{ fontFamily: 'monospace' }}>{group.invite_code}</code>
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Share this code with friends to invite them to join
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

                {canInvite && isOwner && (
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">
                        Invite by Email
                      </Text>
                      <InlineStack gap="300">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label=""
                            labelHidden
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={setInviteEmail}
                            autoComplete="off"
                          />
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleInvite}
                          loading={inviting}
                          disabled={!inviteEmail.trim()}
                        >
                          Send Invite
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                )}

                {!canInvite && (
                  <Banner tone="info">
                    Group is full. Maximum {group.max_members} members reached.
                  </Banner>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Group Members ({members.length})
              </Text>

              {members.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No members yet.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Email', 'Role', 'Status', 'Verified']}
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

