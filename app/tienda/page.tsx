'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export const dynamic = 'force-dynamic';

interface Group {
  id: string;
  name: string;
  owner_email: string;
  current_members: number;
  max_members: number;
  status: string;
  invite_code: string;
}

export default function TiendaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Removed store status check - Friends & Family app should always be available
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        loadGroups();
      } else {
        setShowLogin(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setShowLogin(true);
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      if (!storeChecked) return;
      const response = await fetch('/api/customer/group');
      
      if (response.status === 401) {
        setShowLogin(true);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setGroups([]);
      setShowLogin(true);
      router.push('/tienda');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">Activo</Badge>;
      case 'suspended':
        return <Badge tone="attention">Suspendido</Badge>;
      case 'terminated':
        return <Badge tone="critical">Terminado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Page title="Friends & Family">
        <Card>
          <Text as="p">Cargando...</Text>
        </Card>
      </Page>
    );
  }

  if (showLogin || !user) {
    return (
      <Page title="Friends & Family - Iniciar Sesión">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h1" variant="headingLg">
                    Friends & Family
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Gestiona tus grupos de descuento y invita a familiares y amigos
                  </Text>
                </BlockStack>

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    onClick={() => router.push('/login?redirect=/tienda')}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => router.push('/login?register=true&redirect=/tienda')}
                  >
                    Crear Cuenta
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const activeGroup = groups.find(g => g.status === 'active');

  return (
    <Page
      title="Friends & Family"
      subtitle="Gestiona tus grupos de descuento"
      primaryAction={{
        content: user ? 'Cerrar Sesión' : 'Iniciar Sesión',
        onAction: user ? handleLogout : () => router.push('/login'),
      }}
    >
      <Layout>
        {activeGroup && (
          <Layout.Section>
            <Banner tone="info">
              Estás en el grupo <strong>{activeGroup.name}</strong>.
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          {groups.length === 0 ? (
            <Card>
              <EmptyState
                heading="Aún no tienes grupos"
                action={{
                  content: 'Crear un Grupo',
                  onAction: () => router.push('/tienda/grupos/nuevo'),
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>Crea un grupo Friends & Family para empezar a ahorrar juntos!</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Mis Grupos ({groups.length})
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
                          onClick={() => router.push(`/tienda/grupos/${group.id}`)}
                        >
                          Gestionar
                        </Button>
                      </InlineStack>

                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          Miembros: {group.current_members} / {group.max_members}
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Código de Invitación: <code style={{ fontFamily: 'monospace' }}>{group.invite_code}</code>
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
                Acciones Rápidas
              </Text>
              <InlineStack gap="400">
                <Button
                  variant="primary"
                  onClick={() => router.push('/tienda/grupos/nuevo')}
                  disabled={activeGroup !== undefined}
                >
                  Crear Nuevo Grupo
                </Button>
                <Button
                  onClick={() => router.push('/tienda/unirse')}
                >
                  Unirse a un Grupo
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

