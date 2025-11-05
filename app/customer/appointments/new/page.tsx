'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  Form,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  Text,
  Banner,
  InlineStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

interface AvailableSlot {
  date: string;
  time: string;
  dayName: string;
  available: boolean;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  
  const [branchId, setBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [reason, setReason] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadBranches();
    // TODO: Get customer info from session
    setCustomerName('John Doe');
    setCustomerEmail('customer@example.com');
  }, []);

  useEffect(() => {
    if (branchId && selectedDate) {
      loadAvailableSlots(branchId, selectedDate);
    }
  }, [branchId, selectedDate]);

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadAvailableSlots = async (branchId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/availability?branchId=${branchId}&date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!branchId || !selectedDate || !selectedTime || !customerName || !customerEmail) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Get merchant ID and customer ID from session
      const merchantId = 'demo-merchant';
      const customerId = 'demo-customer-id';

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          branchId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          shopifyCustomerId: customerId,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.appointment) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/customer/appointments`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTimesForDate = availableSlots
    .filter(slot => slot.date === selectedDate && slot.available)
    .map(slot => slot.time)
    .sort();

  const branchOptions = branches.map(branch => ({
    label: `${branch.name}${branch.city ? ` - ${branch.city}` : ''}`,
    value: branch.id,
  }));

  return (
    <Page
      title="Book Appointment"
      backAction={{ onAction: () => router.push('/customer/appointments') }}
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
            <Banner tone="success">
              Appointment booked successfully! Redirecting...
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <BlockStack gap="400">
                  <Select
                    label="Branch"
                    options={[
                      { label: 'Select a branch', value: '' },
                      ...branchOptions,
                    ]}
                    value={branchId}
                    onChange={setBranchId}
                    disabled={loadingBranches}
                  />

                  <TextField
                    label="Date"
                    type="date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    disabled={!branchId}
                    min={new Date().toISOString().split('T')[0]}
                    autoComplete="off"
                  />

                  {selectedDate && (
                    <Select
                      label="Time"
                      options={[
                        { label: 'Select a time', value: '' },
                        ...availableTimesForDate.map(time => ({
                          label: time,
                          value: time,
                        })),
                      ]}
                      value={selectedTime}
                      onChange={setSelectedTime}
                      disabled={loadingSlots || availableTimesForDate.length === 0}
                      helpText={
                        availableTimesForDate.length === 0
                          ? 'No available slots for this date'
                          : `${availableTimesForDate.length} available slots`
                      }
                    />
                  )}

                  <TextField
                    label="Your Name"
                    value={customerName}
                    onChange={setCustomerName}
                    autoComplete="name"
                  />

                  <TextField
                    label="Email"
                    type="email"
                    value={customerEmail}
                    onChange={setCustomerEmail}
                    autoComplete="email"
                  />

                  <TextField
                    label="Phone (optional)"
                    type="tel"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    autoComplete="tel"
                  />

                  <TextField
                    label="Reason (optional)"
                    value={reason}
                    onChange={setReason}
                    multiline={3}
                    helpText="Tell us why you're booking this appointment"
                    autoComplete="off"
                  />

                  <Button
                    variant="primary"
                    submit
                    loading={loading}
                    disabled={!branchId || !selectedDate || !selectedTime || !customerName || !customerEmail || success}
                  >
                    Book Appointment
                  </Button>
                </BlockStack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

