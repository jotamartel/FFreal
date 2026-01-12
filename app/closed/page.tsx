'use client';

import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Layout,
  BlockStack,
  Text,
  Button,
  InlineStack,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface StoreStatus {
  isStoreOpen: boolean;
  inviteRedirectUrl: string | null;
  nextEventDate: string | null;
  eventMessage: string | null;
}

export const dynamic = 'force-dynamic';

export default function ClosedStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StoreStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/store-status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
        }
      } catch (error) {
        console.error('[closed] Error fetching store status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const formattedDate = status?.nextEventDate
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(status.nextEventDate))
    : null;

  return (
    <Page title="Friends & Family" subtitle="Próximamente">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h1" variant="headingLg">
                Tienda temporalmente cerrada
              </Text>

              {loading ? (
                <Text as="p" variant="bodyMd">
                  Cargando estado de la tienda...
                </Text>
              ) : (
                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Estamos preparando la próxima edición del programa Friends & Family.
                  </Text>

                  {status?.eventMessage && (
                    <div
                      style={{
                        background: '#f5f7ff',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #dfe3ec',
                      }}
                    >
                      <Text as="p" variant="bodyMd">
                        {status.eventMessage}
                      </Text>
                    </div>
                  )}

                  {formattedDate && (
                    <Text as="p" variant="bodyMd">
                      Próximo evento: <strong>{formattedDate}</strong>
                    </Text>
                  )}

                  <InlineStack gap="300">
                    <Button onClick={() => router.refresh()}>
                      Actualizar
                    </Button>
                    {status?.inviteRedirectUrl && (
                      <Button
                        variant="primary"
                        onClick={() => router.push(status.inviteRedirectUrl!)}
                      >
                        Continuar como invitado
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
