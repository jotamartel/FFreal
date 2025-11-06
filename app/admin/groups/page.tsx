'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  DataTable,
  Badge,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Select,
  TextField,
  EmptyState,
  Modal,
  Banner,
  InlineGrid,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

interface Group {
  id: string;
  name: string;
  owner_email: string;
  current_members: number;
  max_members: number;
  status: string;
  invite_code: string;
  created_at: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<string>('skip');
  const [importResult, setImportResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [statusFilter]);

  const loadGroups = async () => {
    try {
      // Use 'default' to match groups created from frontend
      // In a multi-tenant app, this would come from Shopify session
      const merchantId = 'default';
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const url = `/api/admin/groups?merchantId=${merchantId}${status ? `&status=${status}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error loading groups:', data.error);
        setGroups([]);
        return;
      }
      
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">Active</Badge>;
      case 'suspended':
        return <Badge tone="attention">Suspended</Badge>;
      case 'terminated':
        return <Badge tone="critical">Terminated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    setExporting(true);
    try {
      const merchantId = 'default';
      const url = `/api/admin/groups/export?format=${format}&merchantId=${merchantId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `groups-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting groups. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await importFile.text();
      let data;

      if (importFile.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (importFile.name.endsWith('.csv')) {
        // Simple CSV parsing (basic implementation)
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const groupsMap = new Map();

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const groupIdIndex = headers.indexOf('Group ID');
          const groupNameIndex = headers.indexOf('Group Name');
          const ownerEmailIndex = headers.indexOf('Owner Email');
          const inviteCodeIndex = headers.indexOf('Invite Code');
          const maxMembersIndex = headers.indexOf('Max Members');
          const memberEmailIndex = headers.indexOf('Member Email');
          const memberRoleIndex = headers.indexOf('Member Role');

          if (groupIdIndex >= 0 && values[groupIdIndex]) {
            const groupId = values[groupIdIndex];
            if (!groupsMap.has(groupId)) {
              groupsMap.set(groupId, {
                name: values[groupNameIndex] || '',
                owner_email: values[ownerEmailIndex] || '',
                invite_code: values[inviteCodeIndex] || '',
                max_members: parseInt(values[maxMembersIndex]) || 6,
                members: [],
              });
            }

            if (memberEmailIndex >= 0 && values[memberEmailIndex]) {
              groupsMap.get(groupId).members.push({
                email: values[memberEmailIndex],
                role: values[memberRoleIndex] || 'member',
              });
            }
          }
        }

        data = { groups: Array.from(groupsMap.values()) };
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      const response = await fetch('/api/admin/groups/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: data.groups || data,
          merchantId: 'default',
          mode: importMode,
        }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Reload groups after successful import
        setTimeout(() => {
          loadGroups();
          setShowImportModal(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      setImportResult({
        success: false,
        error: error.message || 'Error importing file',
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.owner_email.toLowerCase().includes(query) ||
      group.invite_code.toLowerCase().includes(query)
    );
  });

  const rows = filteredGroups.map((group) => [
    group.name,
    group.owner_email,
    `${group.current_members}/${group.max_members}`,
    getStatusBadge(group.status),
    group.invite_code,
    new Date(group.created_at).toLocaleDateString(),
    <Button
      key={group.id}
      onClick={() => router.push(`/admin/groups/${group.id}`)}
    >
      View
    </Button>,
  ]);

  if (loading) {
    return (
      <Page title={t('groups.title')}>
        <Card>
          <Text as="p">{t('common.loading')}</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={t('groups.title')}
      backAction={{ onAction: () => router.push('/admin'), content: t('common.back') }}
      primaryAction={{
        content: t('groups.viewAnalytics'),
        onAction: () => router.push('/admin/analytics'),
      }}
      secondaryActions={[
        {
          content: t('groups.export'),
          onAction: () => handleExport('json'),
          loading: exporting,
        },
        {
          content: t('groups.import'),
          onAction: () => setShowImportModal(true),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <TextField
                  label=""
                  labelHidden
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  autoComplete="off"
                />
                <Select
                  label=""
                  labelHidden
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Suspended', value: 'suspended' },
                    { label: 'Terminated', value: 'terminated' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </InlineStack>

              {/* Export buttons */}
              <InlineGrid columns={{ xs: 2, sm: 2 }} gap="300">
                <Button
                  variant="secondary"
                  onClick={() => handleExport('json')}
                  loading={exporting}
                >
                  Export JSON
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExport('csv')}
                  loading={exporting}
                >
                  Export CSV
                </Button>
              </InlineGrid>

              {filteredGroups.length === 0 ? (
                <EmptyState
                  heading="No groups found"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                  action={{
                    content: 'Refresh',
                    onAction: loadGroups,
                  }}
                >
                  <Text as="p">No groups match your search criteria.</Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'Owner', 'Members', 'Status', 'Invite Code', 'Created', 'Actions']}
                  rows={rows}
                />
              )}
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
        title="Import Groups and Members"
        primaryAction={{
          content: 'Import',
          onAction: handleImportFile,
          loading: importing,
          disabled: !importFile,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
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
              Import groups and members from a JSON or CSV file. The file should match the export format.
            </Text>

            <Select
              label="Import Mode"
              options={[
                { label: 'Skip Existing (Recommended)', value: 'skip' },
                { label: 'Update Existing', value: 'update' },
                { label: 'Replace All', value: 'replace' },
              ]}
              value={importMode}
              onChange={setImportMode}
              helpText="Skip: Don't import if group already exists. Update: Update existing groups. Replace: Delete and recreate."
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
                title={importResult.success ? 'Import Successful' : 'Import Failed'}
              >
                {importResult.success ? (
                  <BlockStack gap="200">
                    <Text as="p">
                      Created: {importResult.summary?.created || 0} | Updated: {importResult.summary?.updated || 0} | Skipped: {importResult.summary?.skipped || 0}
                    </Text>
                    {importResult.summary?.errors > 0 && (
                      <Text as="p" tone="subdued">
                        Errors: {importResult.summary.errors}
                      </Text>
                    )}
                  </BlockStack>
                ) : (
                  <Text as="p">{importResult.error || 'Unknown error occurred'}</Text>
                )}
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

