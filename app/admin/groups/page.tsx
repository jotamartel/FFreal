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

interface FeedbackState {
  tone: 'success' | 'critical' | 'warning';
  message: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minMembers, setMinMembers] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<string>('skip');
  const [importResult, setImportResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string | null; action: string | null }>({
    id: null,
    action: null,
  });

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const merchantId = 'default';
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const url = `/api/admin/groups?merchantId=${merchantId}${status ? `&status=${status}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading groups:', data.error);
        setGroups([]);
        setFeedback({ tone: 'critical', message: t('groups.loadError') });
        return;
      }

      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
      setFeedback({ tone: 'critical', message: t('groups.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">{t('groups.status.active')}</Badge>;
      case 'suspended':
        return <Badge tone="attention">{t('groups.status.suspended')}</Badge>;
      case 'terminated':
        return <Badge tone="critical">{t('groups.status.terminated')}</Badge>;
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
      setFeedback({
        tone: 'success',
        message: `${t('groups.exportSuccess')} (${format.toUpperCase()})`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      setFeedback({ tone: 'critical', message: t('groups.exportError') });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      setFeedback({ tone: 'warning', message: t('groups.importNoFile') });
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
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
        const groupsMap = new Map();

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
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
        setFeedback({ tone: 'success', message: t('groups.importSuccess') });
        setTimeout(() => {
          loadGroups();
          setShowImportModal(false);
        }, 2000);
      } else {
        setFeedback({ tone: 'critical', message: result.error || t('groups.importError') });
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      setImportResult({
        success: false,
        error: error.message || 'Error importing file',
      });
      setFeedback({ tone: 'critical', message: error.message || t('groups.importError') });
    } finally {
      setImporting(false);
    }
  };

  const handleStatusAction = async (groupId: string, action: 'activate' | 'suspend' | 'terminate') => {
    try {
      setActionLoading({ id: groupId, action });
      let response: Response;

      if (action === 'activate') {
        response = await fetch(`/api/groups/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
      } else {
        response = await fetch(`/api/admin/groups/${groupId}/suspend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update group status');
      }

      setFeedback({ tone: 'success', message: t('groups.statusUpdated') });
      await loadGroups();
    } catch (error) {
      console.error('Error updating status:', error);
      setFeedback({ tone: 'critical', message: t('groups.statusUpdateError') });
    } finally {
      setActionLoading({ id: null, action: null });
    }
  };

  const handleSyncMembers = async (groupId: string) => {
    try {
      setActionLoading({ id: groupId, action: 'sync' });
      const response = await fetch(`/api/admin/groups/${groupId}/sync-members`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync members');
      }
      setFeedback({ tone: 'success', message: t('groups.syncSuccess') });
      await loadGroups();
    } catch (error) {
      console.error('Error syncing members:', error);
      setFeedback({ tone: 'critical', message: t('groups.syncError') });
    } finally {
      setActionLoading({ id: null, action: null });
    }
  };

  const filteredGroups = groups
    .filter((group) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(query) ||
        group.owner_email.toLowerCase().includes(query) ||
        group.invite_code.toLowerCase().includes(query)
      );
    })
    .filter((group) => {
      const min = minMembers ? parseInt(minMembers, 10) : null;
      const max = maxMembers ? parseInt(maxMembers, 10) : null;
      if (min !== null && group.current_members < min) {
        return false;
      }
      if (max !== null && group.current_members > max) {
        return false;
      }
      return true;
    });

  const rows = filteredGroups.map((group) => {
    const actions = [];

    if (group.status !== 'active') {
      actions.push(
        <Button
          key={`${group.id}-activate`}
          variant="secondary"
          size="slim"
          onClick={() => handleStatusAction(group.id, 'activate')}
          loading={actionLoading.id === group.id && actionLoading.action === 'activate'}
        >
          {t('groups.actions.activate')}
        </Button>
      );
    }

    if (group.status === 'active') {
      actions.push(
        <Button
          key={`${group.id}-suspend`}
          variant="secondary"
          size="slim"
          onClick={() => handleStatusAction(group.id, 'suspend')}
          loading={actionLoading.id === group.id && actionLoading.action === 'suspend'}
        >
          {t('groups.actions.suspend')}
        </Button>
      );
    }

    if (group.status !== 'terminated') {
      actions.push(
        <Button
          key={`${group.id}-terminate`}
          tone="critical"
          variant="secondary"
          size="slim"
          onClick={() => handleStatusAction(group.id, 'terminate')}
          loading={actionLoading.id === group.id && actionLoading.action === 'terminate'}
        >
          {t('groups.actions.terminate')}
        </Button>
      );
    }

    actions.push(
      <Button
        key={`${group.id}-sync`}
        variant="secondary"
        size="slim"
        onClick={() => handleSyncMembers(group.id)}
        loading={actionLoading.id === group.id && actionLoading.action === 'sync'}
      >
        {t('groups.actions.sync')}
      </Button>
    );

    actions.push(
      <Button
        key={`${group.id}-view`}
        onClick={() => router.push(`/admin/groups/${group.id}`)}
      >
        {t('groups.actions.view')}
      </Button>
    );

    return [
      group.name,
      group.owner_email,
      `${group.current_members}/${group.max_members}`,
      getStatusBadge(group.status),
      group.invite_code,
      new Date(group.created_at).toLocaleDateString(),
      <InlineStack gap="200" key={`${group.id}-actions`}>{actions}</InlineStack>,
    ];
  });

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
          content: t('groups.exportJson'),
          onAction: () => handleExport('json'),
          loading: exporting,
        },
        {
          content: t('groups.exportCsv'),
          onAction: () => handleExport('csv'),
          loading: exporting,
        },
        {
          content: t('groups.import'),
          onAction: () => setShowImportModal(true),
        },
        {
          content: <LanguageSelector />,
        } as any,
      ]}
    >
      <Layout>
        {feedback && (
          <Layout.Section>
            <Banner tone={feedback.tone} onDismiss={() => setFeedback(null)}>
              {feedback.message}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <TextField
                  label={t('groups.searchLabel')}
                  labelHidden
                  placeholder={t('groups.searchPlaceholder')}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  autoComplete="off"
                />
                <Select
                  label={t('groups.statusFilter.label')}
                  labelHidden
                  options={[
                    { label: t('groups.statusFilter.all'), value: 'all' },
                    { label: t('groups.status.active'), value: 'active' },
                    { label: t('groups.status.suspended'), value: 'suspended' },
                    { label: t('groups.status.terminated'), value: 'terminated' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </InlineStack>

              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
                <TextField
                  label={t('groups.memberFilters.min')}
                  type="number"
                  value={minMembers}
                  onChange={setMinMembers}
                  autoComplete="off"
                  placeholder="0"
                />
                <TextField
                  label={t('groups.memberFilters.max')}
                  type="number"
                  value={maxMembers}
                  onChange={setMaxMembers}
                  autoComplete="off"
                  placeholder="20"
                />
              </InlineGrid>

              {filteredGroups.length === 0 ? (
                <EmptyState
                  heading={t('groups.empty.heading')}
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                  action={{
                    content: t('groups.empty.action'),
                    onAction: loadGroups,
                  }}
                >
                  <Text as="p">{t('groups.empty.description')}</Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={[
                    t('groups.table.name'),
                    t('groups.table.owner'),
                    t('groups.table.members'),
                    t('groups.table.status'),
                    t('groups.table.inviteCode'),
                    t('groups.table.created'),
                    t('groups.table.actions'),
                  ]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title={t('groups.importModal.title')}
        primaryAction={{
          content: t('groups.importModal.primaryAction'),
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
              {t('groups.importModal.description')}
            </Text>

            <Select
              label={t('groups.importModal.modeLabel')}
              options={[
                { label: t('groups.importModal.modeSkip'), value: 'skip' },
                { label: t('groups.importModal.modeUpdate'), value: 'update' },
                { label: t('groups.importModal.modeReplace'), value: 'replace' },
              ]}
              value={importMode}
              onChange={setImportMode}
              helpText={t('groups.importModal.modeHelp')}
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
                title={importResult.success ? t('groups.importModal.resultSuccess') : t('groups.importModal.resultError')}
              >
                {importResult.success ? (
                  <BlockStack gap="200">
                    <Text as="p">
                      {`${t('groups.importModal.createdLabel')}: ${importResult.summary?.created || 0} | ${t('groups.importModal.updatedLabel')}: ${importResult.summary?.updated || 0} | ${t('groups.importModal.skippedLabel')}: ${importResult.summary?.skipped || 0}`}
                    </Text>
                    {importResult.summary?.errors > 0 && (
                      <Text as="p" tone="subdued">
                        {`${t('groups.importModal.errorsLabel')}: ${importResult.summary.errors}`}
                      </Text>
                    )}
                  </BlockStack>
                ) : (
                  <Text as="p">{importResult.error}</Text>
                )}
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

