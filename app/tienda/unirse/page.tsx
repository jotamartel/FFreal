'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Spinner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const [joining, setJoining] = useState(false);

  // Auto-fill invite code from URL parameter
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setInviteCode(codeParam.toUpperCase());
      // Auto-search if code is provided
      setTimeout(() => {
        handleSearch(codeParam.toUpperCase());
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = async (code?: string) => {
    const codeToSearch = code || inviteCode.trim();
    if (!codeToSearch) {
      setError('Por favor ingresa un código de invitación');
      return;
    }

    setLoading(true);
    setError(null);
    setGroup(null);

    try {
      const response = await fetch(`/api/groups?inviteCode=${codeToSearch.toUpperCase()}`);
      const data = await response.json();

      if (response.ok && data.group) {
        setGroup(data.group);
      } else {
        setError(data.error || 'Grupo no encontrado. Verifica el código.');
      }
    } catch (error) {
      console.error('Error searching group:', error);
      setError('Error al buscar el grupo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;

    setJoining(true);
    setError(null);

    try {
      const inviteResponse = await fetch('/api/invitations/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });

      const inviteData = await inviteResponse.json();

      if (inviteResponse.ok && inviteData.member) {
        // Redirigir al grupo o a la página principal
        router.push(`/tienda/grupos/${group.id}`);
      } else {
        setError(inviteData.error || 'Error al unirse al grupo');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Error al unirse al grupo. Intenta de nuevo.');
    } finally {
      setJoining(false);
    }
  };

  const isFull = group && group.current_members >= group.max_members;

  return (
    <Page
      title="Unirse a un Grupo"
      backAction={{ onAction: () => router.push('/tienda') }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Ingresa el Código de Invitación
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Si un amigo o familiar te compartió un código de invitación, ingrésalo aquí para unirte a su grupo y comenzar a ahorrar juntos.
                </Text>
              </BlockStack>

              <InlineStack gap="300" align="start" blockAlign="center">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Código de Invitación"
                    labelHidden
                    value={inviteCode}
                    onChange={setInviteCode}
                    placeholder="Ej: 98E818AE4474BFF4"
                    disabled={loading || joining}
                    autoComplete="off"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  loading={loading}
                  disabled={!inviteCode.trim() || joining}
                >
                  Buscar Grupo
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {group && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {group.name}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {group.current_members} / {group.max_members} miembros
                  </Text>
                </BlockStack>

                {isFull && (
                  <Banner tone="warning">
                    Este grupo está completo. No se pueden agregar más miembros.
                  </Banner>
                )}

                {group.status !== 'active' && (
                  <Banner tone="critical">
                    Este grupo no está activo.
                  </Banner>
                )}

                {!isFull && group.status === 'active' && (
                  <Button
                    variant="primary"
                    onClick={handleJoin}
                    loading={joining}
                    disabled={joining}
                  >
                    Unirse al Grupo
                  </Button>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <Page title="Unirse a un Grupo">
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spinner size="large" />
          </div>
        </Card>
      </Page>
    }>
      <JoinGroupContent />
    </Suspense>
  );
}

