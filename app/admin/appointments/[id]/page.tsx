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
  Banner,
} from '@shopify/polaris';
import { useRouter, useParams } from 'next/navigation';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  branch_id: string | null;
  shopify_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const data = await response.json();
      
      setAppointment(data.appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setSuccess(false);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        loadAppointment();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setUpdating(false);
    }
  };

  const cancelAppointment = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/appointments');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <Page title="Appointment Details">
        <Card>
          <Text as="p">Loading...</Text>
        </Card>
      </Page>
    );
  }

  if (!appointment) {
    return (
      <Page title="Appointment Details">
        <Card>
          <Text as="p">Appointment not found</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={`Appointment - ${appointment.customer_name}`}
      backAction={{ onAction: () => router.push('/admin/appointments') }}
      primaryAction={
        appointment.status === 'pending'
          ? {
              content: 'Confirm',
              onAction: () => updateStatus('confirmed'),
              loading: updating,
            }
          : appointment.status === 'confirmed'
          ? {
              content: 'Mark Complete',
              onAction: () => updateStatus('completed'),
              loading: updating,
            }
          : undefined
      }
      secondaryActions={
        appointment.status !== 'cancelled'
          ? [
              {
                content: 'Cancel Appointment',
                destructive: true,
                onAction: cancelAppointment,
                loading: updating,
              },
            ]
          : []
      }
    >
      <Layout>
        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              Appointment updated successfully!
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Appointment Information
                  </Text>
                  {getStatusBadge(appointment.status)}
                </BlockStack>
              </InlineStack>

              <BlockStack gap="300">
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Customer Name:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {appointment.customer_name}
                  </Text>
                </div>

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Email:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {appointment.customer_email}
                  </Text>
                </div>

                {appointment.customer_phone && (
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Phone:
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {appointment.customer_phone}
                    </Text>
                  </div>
                )}

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Date & Time:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                  </Text>
                </div>

                {appointment.reason && (
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Reason:
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {appointment.reason}
                    </Text>
                  </div>
                )}

                {appointment.notes && (
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Notes:
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {appointment.notes}
                    </Text>
                  </div>
                )}

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Created:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {new Date(appointment.created_at).toLocaleString()}
                  </Text>
                </div>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

