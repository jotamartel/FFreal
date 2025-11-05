'use client';

import { useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Form,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  Banner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState('6');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          maxMembers: parseInt(maxMembers) || 6,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (response.ok && data.group) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/customer/groups/${data.group.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Create Friends & Family Group"
      backAction={{ onAction: () => router.push('/customer') }}
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
            <Banner tone="success">
              Group created successfully! Redirecting...
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <BlockStack gap="400">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Create a Friends & Family group to share discounts with your friends and family. 
                    You'll be the group owner and can invite others to join.
                  </Text>

                  <TextField
                    label="Group Name"
                    value={name}
                    onChange={setName}
                    placeholder="e.g., My Family, Friends Circle"
                    helpText="Choose a name for your group"
                    autoComplete="off"
                  />

                  <TextField
                    label="Max Members"
                    type="number"
                    value={maxMembers}
                    onChange={setMaxMembers}
                    helpText="Maximum number of members in your group (including you)"
                    autoComplete="off"
                  />

                  <Button
                    variant="primary"
                    submit
                    loading={loading}
                    disabled={!name.trim() || success}
                  >
                    Create Group
                  </Button>
                </BlockStack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                How it works
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  1. Create your group and get a unique invite code
                </Text>
                <Text as="p" variant="bodyMd">
                  2. Share the invite code with friends and family
                </Text>
                <Text as="p" variant="bodyMd">
                  3. The more members join, the better discount everyone gets!
                </Text>
                <Text as="p" variant="bodyMd">
                  4. Discounts are automatically applied at checkout
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

