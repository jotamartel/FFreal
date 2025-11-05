'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  TextField,
  Button,
  Banner,
  InlineStack,
} from '@shopify/polaris';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  // Get redirect from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const register = params.get('register');
      if (register === 'true') {
        setIsRegister(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, name: name || undefined }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        setLoading(false);
        return;
      }

      // Success - redirect to redirect param or default
      // Use window.location.href with full reload to ensure cookie is available
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/customer';
      
      // Force a full page reload to ensure cookie is set and middleware can read it
      // Using setTimeout to ensure the response is fully processed
      setTimeout(() => {
        window.location.href = redirect;
      }, 200);
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text as="h1" variant="headingLg">
                  {isRegister ? 'Create Account' : 'Login'}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {isRegister
                    ? 'Create an account to manage your Friends & Family groups'
                    : 'Login to access your Friends & Family groups'}
                </Text>
              </BlockStack>

              {error && (
                <Banner tone="critical">{error}</Banner>
              )}

              <form onSubmit={handleSubmit}>
                <BlockStack gap="400">
                  {isRegister && (
                    <TextField
                      label="Name"
                      value={name}
                      onChange={setName}
                      autoComplete="name"
                      disabled={loading}
                    />
                  )}

                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    disabled={loading}
                  />

                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    disabled={loading}
                  />

                  <InlineStack gap="300" align="space-between">
                    <Button
                      variant="primary"
                      submit
                      loading={loading}
                      disabled={loading}
                    >
                      {isRegister ? 'Create Account' : 'Login'}
                    </Button>

                    <Button
                      variant="plain"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

