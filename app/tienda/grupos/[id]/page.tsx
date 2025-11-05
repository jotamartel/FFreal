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

export const dynamic = 'force-dynamic';

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

export default function GrupoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      
      if (response.status === 401) {
        router.push('/login?redirect=/tienda/grupos/' + groupId);
        return;
      }

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
      setError('El email es requerido');
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

      if (response.status === 401) {
        router.push('/login?redirect=/tienda/grupos/' + groupId);
        return;
      }

      if (response.ok && data.invitation) {
        setSuccess(`¡Invitación enviada a ${inviteEmail}!`);
        setInviteEmail('');
      } else {
        setError(data.error || 'Error al enviar la invitación');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Detalles del Grupo">
        <Card>
          <Text as="p">Cargando...</Text>
        </Card>
      </Page>
    );
  }

  if (!group) {
    return (
      <Page title="Detalles del Grupo">
        <Card>
          <Text as="p">Grupo no encontrado</Text>
        </Card>
      </Page>
    );
  }

  const memberRows = members.map((member) => [
    member.email,
    member.role === 'owner' ? <Badge>Dueño</Badge> : <Badge>Miembro</Badge>,
    member.status === 'active' ? <Badge tone="success">Activo</Badge> : <Badge>{member.status}</Badge>,
    member.email_verified ? <Badge tone="success">Verificado</Badge> : <Badge>No Verificado</Badge>,
  ]);

  const canInvite = group.current_members < group.max_members && group.status === 'active';

  return (
    <Page
      title={group.name}
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
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Información del Grupo
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Nombre:</strong> {group.name}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Miembros:</strong> {group.current_members} / {group.max_members}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Estado:</strong> {group.status}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Código de Invitación:</strong>{' '}
                  <code style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                    {group.invite_code}
                  </code>
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {canInvite && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Invitar Miembro
                </Text>
                <InlineStack gap="300" align="end">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Email"
                      type="email"
                      value={inviteEmail}
                      onChange={setInviteEmail}
                      placeholder="email@example.com"
                      autoComplete="email"
                      disabled={inviting}
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleInvite}
                    loading={inviting}
                    disabled={inviting || !inviteEmail.trim()}
                  >
                    Enviar Invitación
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Miembros ({members.length})
              </Text>
              {members.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Email', 'Rol', 'Estado', 'Verificado']}
                  rows={memberRows}
                />
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No hay miembros aún
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
