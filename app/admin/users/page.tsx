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
  InlineGrid,
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


  return (
    <PolarisProvider>
      <Page
        title="Gestión de Usuarios / User Management"
        backAction={{ onAction: () => router.push('/admin'), content: 'Volver / Back' }}
        primaryAction={{
          content: 'Recargar / Reload',
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
                Filtros / Filters
              </Text>
              <InlineStack gap="400" align="space-between">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Buscar / Search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Email o nombre... / Email or name..."
                    autoComplete="off"
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Select
                    label="Rol / Role"
                    options={[
                      { label: 'Todos / All', value: 'all' },
                      { label: 'Customer / Customer', value: 'customer' },
                      { label: 'Admin / Admin', value: 'admin' },
                    ]}
                    value={roleFilter}
                    onChange={setRoleFilter}
                  />
                </div>
                <div style={{ width: '250px' }}>
                  <Select
                    label="Puede Crear Grupos / Can Create Groups"
                    options={[
                      { label: 'Todos / All', value: 'all' },
                      { label: 'Sí / Yes', value: 'true' },
                      { label: 'No / No', value: 'false' },
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
                heading="No se encontraron usuarios / No users found"
                action={{
                  content: 'Recargar / Reload',
                  onAction: loadUsers,
                }}
              >
                <p>Intenta ajustar los filtros o crear un nuevo usuario. / Try adjusting filters or create a new user.</p>
              </EmptyState>
            ) : (
              <>
                <BlockStack gap="400">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingSm">
                              {user.email}
                            </Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              {user.name || 'Sin nombre'} • {user.role}
                            </Text>
                          </BlockStack>
                          <Badge tone={user.is_active ? 'success' : 'attention'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </InlineStack>
                        
                        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                              <strong>Puede Crear Grupos / Can Create Groups:</strong>
                            </Text>
                            <Checkbox
                              label="Permitir crear grupos de Friends & Family / Allow creating Friends & Family groups"
                              checked={user.can_create_groups === true}
                              onChange={() => handleTogglePermission(user.id, user.can_create_groups)}
                              disabled={saving[user.id]}
                            />
                          </BlockStack>
                          
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                              <strong>Estado de Cuenta / Account Status:</strong>
                            </Text>
                            <Checkbox
                              label="Usuario activo (puede iniciar sesión) / Active user (can log in)"
                              checked={user.is_active}
                              onChange={() => handleToggleActive(user.id, user.is_active)}
                              disabled={saving[user.id]}
                            />
                          </BlockStack>
                        </InlineGrid>
                        
                        {saving[user.id] && (
                          <Text as="p" variant="bodyMd" tone="subdued">
                            Guardando... / Saving...
                          </Text>
                        )}
                        
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Creado / Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          {user.last_login_at && ` • Último acceso / Last login: ${new Date(user.last_login_at).toLocaleDateString()}`}
                        </Text>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
                {total > limit && (
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <InlineStack gap="400" align="center">
                      <Button
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        Anterior / Previous
                      </Button>
                      <Text as="p" variant="bodyMd">
                        Mostrando / Showing {offset + 1}-{Math.min(offset + limit, total)} de / of {total}
                      </Text>
                      <Button
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= total}
                      >
                        Siguiente / Next
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
                Información / Information
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Puede Crear Grupos / Can Create Groups:</strong> Si está habilitado, el usuario puede crear
                grupos de Friends & Family. Si está deshabilitado, solo puede unirse a grupos
                usando códigos de invitación. / If enabled, the user can create Friends & Family groups. 
                If disabled, they can only join groups using invitation codes.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>Activo / Active:</strong> Controla si el usuario puede iniciar sesión en el sistema. / 
                Controls whether the user can log in to the system.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </PolarisProvider>
  );
}

