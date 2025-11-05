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
  reason: string | null;
  created_at: string;
}

export default function CustomerAppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      // TODO: Get customer ID or email from session
      const customerEmail = 'customer@example.com';
      const response = await fetch(`/api/appointments?email=${customerEmail}`);
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

  const rows = appointments.map((apt) => [
    `${apt.appointment_date} ${apt.appointment_time}`,
    apt.reason || '-',
    getStatusBadge(apt.status),
    new Date(apt.created_at).toLocaleDateString(),
    <Button
      key={apt.id}
      onClick={() => router.push(`/customer/appointments/${apt.id}`)}
    >
      View
    </Button>,
  ]);

  if (loading) {
    return (
      <Page title="My Appointments">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="My Appointments"
      backAction={{ onAction: () => router.push('/customer') }}
      primaryAction={{
        content: 'Book Appointment',
        onAction: () => router.push('/customer/appointments/new'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            {appointments.length === 0 ? (
              <EmptyState
                heading="No appointments yet"
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                action={{
                  content: 'Book Appointment',
                  onAction: () => router.push('/customer/appointments/new'),
                }}
              >
                <Text as="p">Book your first appointment to get started!</Text>
              </EmptyState>
            ) : (
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  My Appointments ({appointments.length})
                </Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Date & Time', 'Reason', 'Status', 'Booked', 'Actions']}
                  rows={rows}
                />
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

