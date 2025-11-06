'use client';

import { useState, useEffect, useCallback } from 'react';
import { PolarisProvider } from '@/components/admin/PolarisProvider';
import {
  Page,
  Card,
  Layout,
  DataTable,
  TextField,
  Select,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Banner,
  Badge,
  Checkbox,
  EmptyState,
  Spinner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  can_create_groups: boolean;
  shopify_customer_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [canCreateGroupsFilter, setCanCreateGroupsFilter] = useState<string>('all');
  
  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) {
        params.append('search', search);
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (canCreateGroupsFilter !== 'all') {
        params.append('canCreateGroups', canCreateGroupsFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setTotal(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, canCreateGroupsFilter, offset]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleTogglePermission = async (userId: string, currentValue: boolean) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          can_create_groups: !currentValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Permiso ${!currentValue ? 'habilitado' : 'deshabilitado'} para ${data.user.email}`
        );
        setTimeout(() => setSuccess(null), 3000);
        await loadUsers();
      } else {
        setError(data.error || 'Error al actualizar permiso');
      }
    } catch (err: any) {
      console.error('Error updating permission:', err);
      setError('Error al actualizar permiso');
    } finally {
      setSaving(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const handleToggleActive = async (userId: string, currentValue: boolean) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !currentValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Usuario ${!currentValue ? 'activado' : 'desactivado'}: ${data.user.email}`
        );
        setTimeout(() => setSuccess(null), 3000);
        await loadUsers();
      } else {
        setError(data.error || 'Error al actualizar usuario');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError('Error al actualizar usuario');
    } finally {
      setSaving(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const rows = users.map((user) => [
    user.email,
    user.name || '-',
    user.role,
    <Badge
      key={`active-${user.id}`}
      tone={user.is_active ? 'success' : 'attention'}
    >
      {user.is_active ? 'Activo' : 'Inactivo'}
    </Badge>,
    <Checkbox
      key={`can-create-${user.id}`}
      label=""
      checked={user.can_create_groups === true}
      onChange={() => handleTogglePermission(user.id, user.can_create_groups)}
      disabled={saving[user.id]}
    />,
    <Checkbox
      key={`active-${user.id}`}
      label=""
      checked={user.is_active}
      onChange={() => handleToggleActive(user.id, user.is_active)}
      disabled={saving[user.id]}
    />,
    user.created_at ? new Date(user.created_at).toLocaleDateString() : '-',
  ]);

  const headings = [
    'Email',
    'Nombre',
    'Rol',
    'Estado',
    'Puede Crear Grupos',
    'Activo',
    'Fecha Creación',
  ];

  return (
    <PolarisProvider>
      <Page
        title="Gestión de Usuarios"
        backAction={{ onAction: () => router.push('/admin') }}
        primaryAction={{
          content: 'Recargar',
          onAction: loadUsers,
          loading: loading,
        }}
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
              <Text as="h2" variant="headingMd">
                Filtros
              </Text>
              <InlineStack gap="400" align="space-between">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Buscar"
                    value={search}
                    onChange={setSearch}
                    placeholder="Email o nombre..."
                    autoComplete="off"
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Select
                    label="Rol"
                    options={[
                      { label: 'Todos', value: 'all' },
                      { label: 'Customer', value: 'customer' },
                      { label: 'Admin', value: 'admin' },
                    ]}
                    value={roleFilter}
                    onChange={setRoleFilter}
                  />
                </div>
                <div style={{ width: '250px' }}>
                  <Select
                    label="Puede Crear Grupos"
                    options={[
                      { label: 'Todos', value: 'all' },
                      { label: 'Sí', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={canCreateGroupsFilter}
                    onChange={setCanCreateGroupsFilter}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                heading="No se encontraron usuarios"
                action={{
                  content: 'Recargar',
                  onAction: loadUsers,
                }}
              >
                <p>Intenta ajustar los filtros o crear un nuevo usuario.</p>
              </EmptyState>
            ) : (
              <>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={headings}
                  rows={rows}
                />
                {total > limit && (
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <InlineStack gap="400" align="center">
                      <Button
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        Anterior
                      </Button>
                      <Text as="p" variant="bodyMd">
                        Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total}
                      </Text>
                      <Button
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= total}
                      >
                        Siguiente
                      </Button>
                    </InlineStack>
                  </div>
                )}
              </>
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Información
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Puede Crear Grupos:</strong> Si está habilitado, el usuario puede crear
                grupos de Friends & Family. Si está deshabilitado, solo puede unirse a grupos
                usando códigos de invitación.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Activo:</strong> Controla si el usuario puede iniciar sesión en el sistema.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </PolarisProvider>
  );
}

