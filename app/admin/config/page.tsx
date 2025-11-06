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
  Select,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Badge,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface DiscountTier {
  memberCount: number;
  discountValue: number;
}

interface DiscountRules {
  productInclusions?: string[];
  productExclusions?: string[];
  minimumPurchase?: number;
  geoRestrictions?: string[];
}

export default function DiscountConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [maxGroupsPerEmail, setMaxGroupsPerEmail] = useState('1');
  const [coolingPeriodDays, setCoolingPeriodDays] = useState('30');
  const [maxMembersDefault, setMaxMembersDefault] = useState('6');
  const [inviteRedirectUrl, setInviteRedirectUrl] = useState('');
  const [tiers, setTiers] = useState<DiscountTier[]>([
    { memberCount: 2, discountValue: 5 },
    { memberCount: 4, discountValue: 10 },
    { memberCount: 6, discountValue: 15 },
  ]);
  const [newTier, setNewTier] = useState({ memberCount: '', discountValue: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // TODO: Get merchant ID from session
      const merchantId = 'default'; // Use 'default' for single-tenant apps
      const response = await fetch(`/api/admin/config?merchantId=${merchantId}`);
      const data = await response.json();
      
      if (data.config) {
        setIsEnabled(data.config.is_enabled);
        setDiscountType(data.config.discount_type);
        setMaxGroupsPerEmail(data.config.max_groups_per_email?.toString() || '1');
        setCoolingPeriodDays(data.config.cooling_period_days?.toString() || '30');
        setMaxMembersDefault(data.config.max_members_default?.toString() || '6');
        setInviteRedirectUrl(data.config.invite_redirect_url || '');
        setTiers(data.config.tiers || []);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const merchantId = 'demo-merchant'; // Replace with actual merchant ID
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          isEnabled,
          discountType,
          tiers,
          maxGroupsPerEmail: parseInt(maxGroupsPerEmail),
          coolingPeriodDays: parseInt(coolingPeriodDays),
          maxMembersDefault: parseInt(maxMembersDefault),
          inviteRedirectUrl: inviteRedirectUrl || null,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    if (newTier.memberCount && newTier.discountValue) {
      setTiers([
        ...tiers,
        {
          memberCount: parseInt(newTier.memberCount),
          discountValue: parseFloat(newTier.discountValue),
        },
      ]);
      setNewTier({ memberCount: '', discountValue: '' });
    }
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
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
        },
      ]}
    >
      <Layout>
        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              {t('config.saved')}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Form onSubmit={handleSave}>
              <FormLayout>
                <Checkbox
                  label="Enable Friends & Family discount program"
                  checked={isEnabled}
                  onChange={setIsEnabled}
                />

                <Select
                  label="Discount Type"
                  options={[
                    { label: 'Percentage', value: 'percentage' },
                    { label: 'Fixed Amount', value: 'fixed' },
                  ]}
                  value={discountType}
                  onChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
                />

                <TextField
                  label="Max Groups Per Email"
                  type="number"
                  value={maxGroupsPerEmail}
                  onChange={setMaxGroupsPerEmail}
                  helpText="Maximum number of groups a customer can create with the same email"
                  autoComplete="off"
                />

                <TextField
                  label="Cooling Period (days)"
                  type="number"
                  value={coolingPeriodDays}
                  onChange={setCoolingPeriodDays}
                  helpText="Days a customer must wait after leaving a group before joining another"
                  autoComplete="off"
                />

                <TextField
                  label="Default Max Members Per Group"
                  type="number"
                  value={maxMembersDefault}
                  onChange={setMaxMembersDefault}
                  helpText="Maximum number of members allowed in each group (cannot be set by users, admin-controlled only)"
                  autoComplete="off"
                />

                <TextField
                  label="Invitation Redirect URL"
                  type="url"
                  value={inviteRedirectUrl}
                  onChange={setInviteRedirectUrl}
                  helpText="URL where invitation emails should redirect users (e.g., https://yourstore.com/tienda/unirse). If empty, uses app default."
                  placeholder="https://yourstore.com/tienda/unirse"
                  autoComplete="off"
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Discount Tiers
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Define discount levels based on group size. Members get the discount tier that matches their current group size.
              </Text>

              {tiers.map((tier, index) => (
                <Card key={index}>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          <strong>{tier.memberCount} members</strong> →{' '}
                          {discountType === 'percentage' ? `${tier.discountValue}%` : `$${tier.discountValue}`} discount
                        </Text>
                      </BlockStack>
                      <Button
                        tone="critical"
                        onClick={() => removeTier(index)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Card>
              ))}

              <Card>
                <BlockStack gap="300">
                  <FormLayout>
                    <InlineStack gap="400">
                      <TextField
                        label="Member Count"
                        type="number"
                        value={newTier.memberCount}
                        onChange={(value) => setNewTier({ ...newTier, memberCount: value })}
                        placeholder="e.g., 6"
                        autoComplete="off"
                      />
                      <TextField
                        label={discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                        type="number"
                        value={newTier.discountValue}
                        onChange={(value) => setNewTier({ ...newTier, discountValue: value })}
                        placeholder={discountType === 'percentage' ? 'e.g., 15' : 'e.g., 10.00'}
                        autoComplete="off"
                      />
                      <div style={{ paddingTop: '20px' }}>
                        <Button onClick={addTier}>Add Tier</Button>
                      </div>
                    </InlineStack>
                  </FormLayout>
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="end">
            <Button
              variant="primary"
              loading={saving}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

