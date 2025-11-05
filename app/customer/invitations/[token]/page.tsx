'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  Button,
  Banner,
  InlineStack,
} from '@shopify/polaris';
import { useRouter, useParams } from 'next/navigation';

interface Invitation {
  id: string;
  group_id: string;
  email: string;
  status: string;
  expires_at: string;
}

interface Group {
  id: string;
  name: string;
  current_members: number;
  max_members: number;
  status: string;
}

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations?token=${token}`);
      const data = await response.json();

      if (response.ok && data.invitation) {
        setInvitation(data.invitation);
        // Load group details
        const groupResponse = await fetch(`/api/groups/${data.invitation.group_id}`);
        const groupData = await groupResponse.json();
        setGroup(groupData.group);
      } else {
        setError(data.error || 'Invitation not found or expired');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    try {
      // TODO: Get customer ID from session
      const customerId = 'demo-customer-id';

      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (response.ok && data.member && invitation) {
        router.push(`/customer/groups/${invitation.group_id}`);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Invitation">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  if (error || !invitation || !group) {
    return (
      <Page title="Invitation">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              {error || 'Invitation not found or expired'}
            </Banner>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Button onClick={() => router.push('/customer')}>
                Go to My Groups
              </Button>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = invitation.status === 'accepted';
  const isFull = group.current_members >= group.max_members;

  return (
    <Page title="Group Invitation">
      <Layout>
        {isExpired && (
          <Layout.Section>
            <Banner tone="critical">
              This invitation has expired.
            </Banner>
          </Layout.Section>
        )}

        {isAccepted && (
          <Layout.Section>
            <Banner tone="info">
              You have already accepted this invitation.
            </Banner>
          </Layout.Section>
        )}

        {isFull && (
          <Layout.Section>
            <Banner tone="warning">
              This group is full and cannot accept more members.
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  You've been invited to join
                </Text>
                <Text as="h1" variant="heading2xl">
                  {group.name}
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Join this Friends & Family group to start saving together!
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Current members: {group.current_members} / {group.max_members}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                </Text>
              </BlockStack>

              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onClick={handleAccept}
                  loading={accepting}
                  disabled={isExpired || isAccepted || isFull}
                >
                  Accept Invitation
                </Button>
                <Button onClick={() => router.push('/customer')}>
                  Decline
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

