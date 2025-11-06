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
  Modal,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  can_create_groups: boolean;
  max_members_per_group?: number | null;
  discount_tier_identifier?: string | null;
  shopify_customer_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { t } = useI18n();
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
  
  // Export/Import
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<string>('skip');
  const [importResult, setImportResult] = useState<any>(null);

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

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    setExporting(true);
    try {
      const url = `/api/admin/users/export?format=${format}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting:', error);
      setError('Error exporting users. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      setError('Please select a file');
      return;
    }

    setImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const text = await importFile.text();
      let data;

      if (importFile.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (importFile.name.endsWith('.csv')) {
        // Simple CSV parsing (basic implementation)
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const users: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          const emailIndex = headers.indexOf('Email');
          const nameIndex = headers.indexOf('Name');
          const phoneIndex = headers.indexOf('Phone');
          const roleIndex = headers.indexOf('Role');
          const isActiveIndex = headers.indexOf('Is Active');
          const canCreateGroupsIndex = headers.indexOf('Can Create Groups');
          const maxMembersPerGroupIndex = headers.indexOf('Max Members Per Group');
          const discountTierIdentifierIndex = headers.indexOf('Discount Tier Identifier');
          const shopifyCustomerIdIndex = headers.indexOf('Shopify Customer ID');

          if (emailIndex >= 0 && values[emailIndex]) {
            users.push({
              email: values[emailIndex],
              name: nameIndex >= 0 ? values[nameIndex] : null,
              phone: phoneIndex >= 0 ? values[phoneIndex] : null,
              role: roleIndex >= 0 ? values[roleIndex] : 'customer',
              is_active: isActiveIndex >= 0 ? values[isActiveIndex] === 'true' : true,
              can_create_groups: canCreateGroupsIndex >= 0 ? values[canCreateGroupsIndex] === 'true' : false,
              max_members_per_group: maxMembersPerGroupIndex >= 0 && values[maxMembersPerGroupIndex] ? parseInt(values[maxMembersPerGroupIndex]) || null : null,
              discount_tier_identifier: discountTierIdentifierIndex >= 0 ? values[discountTierIdentifierIndex] || null : null,
              shopify_customer_id: shopifyCustomerIdIndex >= 0 ? values[shopifyCustomerIdIndex] : null,
            });
          }
        }

        data = { users };
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: data.users || data,
          mode: importMode,
        }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Reload users after successful import
        setTimeout(() => {
          loadUsers();
          setShowImportModal(false);
        }, 2000);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      setError(error.message || 'Error importing users. Please check the file format.');
      setImportResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

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

  const handleUpdateField = async (userId: string, field: string, value: any) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Campo actualizado exitosamente`);
        setTimeout(() => setSuccess(null), 3000);
        await loadUsers();
      } else {
        setError(data.error || `Error al actualizar ${field}`);
      }
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      setError(`Error al actualizar ${field}`);
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
        title={t('users.title')}
        backAction={{ onAction: () => router.push('/admin'), content: t('common.back') }}
        primaryAction={{
          content: t('common.reload'),
          onAction: loadUsers,
          loading: loading,
        }}
        secondaryActions={[
          {
            content: t('users.export'),
            onAction: () => handleExport('json'),
            loading: exporting,
          },
          {
            content: t('users.import'),
            onAction: () => setShowImportModal(true),
          },
          {
            content: <LanguageSelector />,
          } as any,
        ]}
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
              <InlineStack gap="400" align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {t('users.filters')}
                </Text>
                <InlineGrid columns={{ xs: 2, sm: 2 }} gap="300">
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('json')}
                    loading={exporting}
                  >
                    {t('users.exportJSON')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('csv')}
                    loading={exporting}
                  >
                    {t('users.exportCSV')}
                  </Button>
                </InlineGrid>
              </InlineStack>
              <InlineStack gap="400" align="space-between">
                <div style={{ flex: 1 }}>
                  <TextField
                    label={t('common.search')}
                    value={search}
                    onChange={setSearch}
                    placeholder={t('users.searchPlaceholder')}
                    autoComplete="off"
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Select
                    label={t('users.role')}
                    options={[
                      { label: t('users.roleOptions.all'), value: 'all' },
                      { label: t('users.roleOptions.customer'), value: 'customer' },
                      { label: t('users.roleOptions.admin'), value: 'admin' },
                    ]}
                    value={roleFilter}
                    onChange={setRoleFilter}
                  />
                </div>
                <div style={{ width: '250px' }}>
                  <Select
                    label={t('users.canCreateGroups')}
                    options={[
                      { label: t('users.permissionOptions.all'), value: 'all' },
                      { label: t('users.permissionOptions.yes'), value: 'true' },
                      { label: t('users.permissionOptions.no'), value: 'false' },
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
                heading={t('users.noUsersFound')}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                action={{
                  content: t('common.reload'),
                  onAction: loadUsers,
                }}
              >
                <p>{t('users.tryFilters')}</p>
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
                              {user.name || t('users.noName')} • {user.role}
                            </Text>
                          </BlockStack>
                          <Badge tone={user.is_active ? 'success' : 'attention'}>
                            {user.is_active ? t('analytics.active') : t('analytics.inactive')}
                          </Badge>
                        </InlineStack>
                        
                        {user.can_create_groups && (
                          <BlockStack gap="300">
                            <Text as="p" variant="bodyMd">
                              <strong>{t('users.groupSettings')}</strong>
                            </Text>
                            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                              <TextField
                                label={t('users.maxMembersPerGroup')}
                                value={user.max_members_per_group?.toString() || ''}
                                onChange={(value) => {
                                  const numValue = value === '' ? null : parseInt(value) || null;
                                  handleUpdateField(user.id, 'max_members_per_group', numValue);
                                }}
                                type="number"
                                min={1}
                                disabled={saving[user.id]}
                                helpText={t('users.maxMembersPerGroupHelp')}
                                autoComplete="off"
                              />
                              <TextField
                                label={t('users.discountTierIdentifier')}
                                value={user.discount_tier_identifier || ''}
                                onChange={(value) => {
                                  handleUpdateField(user.id, 'discount_tier_identifier', value || null);
                                }}
                                disabled={saving[user.id]}
                                helpText={t('users.discountTierIdentifierHelp')}
                                autoComplete="off"
                              />
                            </InlineGrid>
                          </BlockStack>
                        )}
                        
                        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                              <strong>{t('users.canCreateGroupsLabel')}</strong>
                            </Text>
                            <Checkbox
                              label={t('users.allowCreatingGroups')}
                              checked={user.can_create_groups === true}
                              onChange={() => handleTogglePermission(user.id, user.can_create_groups)}
                              disabled={saving[user.id]}
                            />
                          </BlockStack>
                          
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                              <strong>{t('users.accountStatus')}</strong>
                            </Text>
                            <Checkbox
                              label={t('users.activeUser')}
                              checked={user.is_active}
                              onChange={() => handleToggleActive(user.id, user.is_active)}
                              disabled={saving[user.id]}
                            />
                          </BlockStack>
                        </InlineGrid>
                        
                        {saving[user.id] && (
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {t('users.saving')}
                          </Text>
                        )}
                        
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {t('users.created')}: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          {user.last_login_at && ` • ${t('users.lastLogin')}: ${new Date(user.last_login_at).toLocaleDateString()}`}
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
                        {t('common.previous')}
                      </Button>
                      <Text as="p" variant="bodyMd">
                        {t('common.showing')} {offset + 1}-{Math.min(offset + limit, total)} {t('common.of')} {total}
                      </Text>
                      <Button
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= total}
                      >
                        {t('common.next')}
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
                {t('users.information')}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>{t('users.canCreateGroupsLabel')}</strong> {t('users.canCreateGroupsInfo')}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                <strong>{t('analytics.active')}:</strong> {t('users.activeInfo')}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Import Modal */}
      <Modal
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title={t('users.importTitle')}
        primaryAction={{
          content: t('users.import'),
          onAction: handleImportFile,
          loading: importing,
          disabled: !importFile,
        }}
        secondaryActions={[
          {
            content: t('common.cancel'),
            onAction: () => {
              setShowImportModal(false);
              setImportFile(null);
              setImportResult(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              {t('users.importDescription')}
            </Text>

            <Select
              label={t('users.importMode')}
              options={[
                { label: t('users.importModeSkip'), value: 'skip' },
                { label: t('users.importModeUpdate'), value: 'update' },
              ]}
              value={importMode}
              onChange={setImportMode}
              helpText={t('users.importModeHelp')}
            />

            <input
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImportFile(file || null);
              }}
              style={{ padding: '10px' }}
            />

            {importResult && (
              <Banner
                tone={importResult.success ? 'success' : 'critical'}
                title={importResult.success ? t('users.importSuccess') : t('users.importFailed')}
              >
                {importResult.success ? (
                  <BlockStack gap="200">
                    <Text as="p">
                      {t('users.created')}: {importResult.summary?.created || 0} | {t('users.updated')}: {importResult.summary?.updated || 0} | {t('users.skipped')}: {importResult.summary?.skipped || 0}
                    </Text>
                    {importResult.summary?.errors > 0 && (
                      <Text as="p" tone="subdued">
                        {t('users.errors')}: {importResult.summary.errors}
                      </Text>
                    )}
                  </BlockStack>
                ) : (
                  <Text as="p">{importResult.error || t('users.unknownError')}</Text>
                )}
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
    </PolarisProvider>
  );
}

