'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  DataTable,
  Badge,
  Button,
  BlockStack,
  Text,
  TextField,
  Select,
  EmptyState,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  branch_id: string | null;
  created_at: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    try {
      const merchantId = 'demo-merchant'; // Replace with actual merchant ID
      const response = await fetch(`/api/appointments?merchantId=${merchantId}`);
      const data = await response.json();
      
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge tone="success">Confirmed</Badge>;
      case 'pending':
        return <Badge>Pending</Badge>;
      case 'cancelled':
        return <Badge tone="critical">Cancelled</Badge>;
      case 'completed':
        return <Badge tone="info">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      apt.customer_name.toLowerCase().includes(query) ||
      apt.customer_email.toLowerCase().includes(query)
    );
  }).filter((apt) => {
    if (statusFilter === 'all') return true;
    return apt.status === statusFilter;
  });

  const rows = filteredAppointments.map((apt) => [
    apt.customer_name,
    apt.customer_email,
    `${apt.appointment_date} ${apt.appointment_time}`,
    getStatusBadge(apt.status),
    new Date(apt.created_at).toLocaleDateString(),
    <Button
      key={apt.id}
      onClick={() => router.push(`/admin/appointments/${apt.id}`)}
    >
      View
    </Button>,
  ]);

  if (loading) {
    return (
      <Page title="Appointments">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Appointments"
      backAction={{ onAction: () => router.push('/admin') }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                All Appointments ({filteredAppointments.length})
              </Text>

              <BlockStack gap="300">
                <TextField
                  label=""
                  labelHidden
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  autoComplete="off"
                />
                <Select
                  label="Status Filter"
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Cancelled', value: 'cancelled' },
                    { label: 'Completed', value: 'completed' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </BlockStack>

              {filteredAppointments.length === 0 ? (
                <EmptyState
                  heading="No appointments found"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                  action={{
                    content: 'Refresh',
                    onAction: loadAppointments,
                  }}
                >
                  <Text as="p">No appointments match your search criteria.</Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Customer', 'Email', 'Date & Time', 'Status', 'Created', 'Actions']}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

