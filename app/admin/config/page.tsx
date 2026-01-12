'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  Form,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  BlockStack,
  Text,
  Banner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/admin/LanguageSelector';

interface FeedbackState {
  tone: 'success' | 'critical' | 'warning';
  message: string;
}

export default function DiscountConfigPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [maxGroupsPerEmail, setMaxGroupsPerEmail] = useState('1');
  const [coolingPeriodDays, setCoolingPeriodDays] = useState('30');
  const [maxMembersDefault, setMaxMembersDefault] = useState('20');
  const [inviteRedirectUrl, setInviteRedirectUrl] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [nextEventDate, setNextEventDate] = useState('');
  const [eventMessage, setEventMessage] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [termsText, setTermsText] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailSupport, setEmailSupport] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const merchantId = 'default';
      const response = await fetch(`/api/admin/config?merchantId=${merchantId}`);
      const data = await response.json();

      if (data.config) {
        setIsEnabled(Boolean(data.config.is_enabled));
        setMaxGroupsPerEmail(data.config.max_groups_per_email?.toString() || '1');
        setCoolingPeriodDays(data.config.cooling_period_days?.toString() || '30');
        setMaxMembersDefault(data.config.max_members_default?.toString() || '20');
        setInviteRedirectUrl(data.config.invite_redirect_url || '');
        setIsStoreOpen(Boolean(data.config.is_store_open));
        setNextEventDate(
          data.config.next_event_date
            ? new Date(data.config.next_event_date).toISOString().slice(0, 16)
            : ''
        );
        setEventMessage(data.config.event_message || '');
      }

      if (data.terms) {
        setTermsVersion(data.terms.version || '');
        setTermsText(data.terms.text || '');
      }

      if (data.email) {
        setEmailFrom(data.email.from || '');
        setEmailSupport(data.email.support || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setFeedback({ tone: 'critical', message: t('config.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    if (!emailFrom) {
      setFeedback({ tone: 'warning', message: t('config.validation.emailFrom') });
      setSaving(false);
      return;
    }

    if (nextEventDate && isNaN(Date.parse(nextEventDate))) {
      setFeedback({ tone: 'warning', message: t('config.validation.date') });
      setSaving(false);
      return;
    }

    try {
      const merchantId = 'default';
      const payload = {
        merchantId,
        isEnabled,
        maxGroupsPerEmail: parseInt(maxGroupsPerEmail, 10),
        coolingPeriodDays: parseInt(coolingPeriodDays, 10),
        maxMembersDefault: parseInt(maxMembersDefault, 10),
        inviteRedirectUrl: inviteRedirectUrl || null,
        isStoreOpen,
        nextEventDate: nextEventDate ? new Date(nextEventDate).toISOString() : null,
        eventMessage: eventMessage || null,
        termsVersion: termsVersion || null,
        termsText: termsText || null,
        emailFrom,
        emailSupport: emailSupport || null,
      };

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      setFeedback({ tone: 'success', message: t('config.saved') });
    } catch (error) {
      console.error('Error saving config:', error);
      setFeedback({ tone: 'critical', message: t('config.saveError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title={t('config.title')}>
        <Card>
          <Text as="p">{t('common.loading')}</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={t('config.title')}
      backAction={{ onAction: () => router.push('/admin'), content: t('common.back') }}
      secondaryActions={[
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
              <Text variant="headingMd" as="h2">
                {t('config.program.title')}
              </Text>
              <Form onSubmit={handleSave}>
                <FormLayout>
                  <Checkbox
                    label={t('config.program.enabled')}
                    checked={isEnabled}
                    onChange={setIsEnabled}
                  />
                  <TextField
                    label={t('config.program.maxGroupsPerEmail')}
                    type="number"
                    value={maxGroupsPerEmail}
                    onChange={setMaxGroupsPerEmail}
                    autoComplete="off"
                  />
                  <TextField
                    label={t('config.program.coolingPeriod')}
                    type="number"
                    value={coolingPeriodDays}
                    onChange={setCoolingPeriodDays}
                    autoComplete="off"
                  />
                  <TextField
                    label={t('config.program.maxMembersDefault')}
                    type="number"
                    value={maxMembersDefault}
                    onChange={setMaxMembersDefault}
                    helpText={t('config.program.maxMembersHelp')}
                    autoComplete="off"
                  />
                  <TextField
                    label={t('config.program.inviteRedirectUrl')}
                    type="url"
                    value={inviteRedirectUrl}
                    onChange={setInviteRedirectUrl}
                    placeholder={t('config.program.inviteRedirectPlaceholder')}
                    autoComplete="off"
                  />
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                {t('config.storeStatus.title')}
              </Text>
              <Checkbox
                label={t('config.storeStatus.open')}
                checked={isStoreOpen}
                onChange={setIsStoreOpen}
              />
              <TextField
                label={t('config.storeStatus.nextEvent')}
                type="text"
                value={nextEventDate}
                onChange={setNextEventDate}
                helpText={t('config.storeStatus.nextEventHelp')}
                autoComplete="off"
                placeholder="2025-12-31T23:59"
              />
              <TextField
                label={t('config.storeStatus.message')}
                value={eventMessage}
                onChange={setEventMessage}
                multiline={4}
                placeholder={t('config.storeStatus.messagePlaceholder')}
                autoComplete="off"
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                {t('config.email.title')}
              </Text>
              <TextField
                label={t('config.email.from')}
                type="email"
                value={emailFrom}
                onChange={setEmailFrom}
                autoComplete="off"
              />
              <TextField
                label={t('config.email.support')}
                type="email"
                value={emailSupport}
                onChange={setEmailSupport}
                autoComplete="off"
                placeholder={t('config.email.supportPlaceholder')}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                {t('config.terms.title')}
              </Text>
              <TextField
                label={t('config.terms.version')}
                value={termsVersion}
                onChange={setTermsVersion}
                autoComplete="off"
                placeholder="v1.0"
              />
              <TextField
                label={t('config.terms.text')}
                value={termsText}
                onChange={setTermsText}
                multiline={6}
                autoComplete="off"
                helpText={t('config.terms.help')}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

