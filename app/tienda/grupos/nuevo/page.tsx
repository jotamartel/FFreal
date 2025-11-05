'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Card,
  Layout,
  Form,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner,
} from '@shopify/polaris';

export const dynamic = 'force-dynamic';

export default function CrearGrupoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState('6');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre del grupo es requerido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          maxMembers: parseInt(maxMembers) || 6,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push('/login?redirect=/tienda/grupos/nuevo');
        return;
      }

      if (response.ok && data.group) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/tienda/grupos/${data.group.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Error al crear el grupo');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Crear Grupo Friends & Family"
      backAction={{ onAction: () => router.push('/tienda') }}
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
              Grupo creado exitosamente! Redirigiendo...
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <BlockStack gap="400">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Crea un grupo para invitar a familiares y amigos y empezar a ahorrar juntos.
                  </Text>

                  <TextField
                    label="Nombre del Grupo"
                    value={name}
                    onChange={setName}
                    disabled={loading}
                    placeholder="Ej: Mi Familia"
                    autoComplete="off"
                  />

                  <TextField
                    label="Máximo de Miembros"
                    type="number"
                    value={maxMembers}
                    onChange={setMaxMembers}
                    disabled={loading}
                    helpText="Máximo de personas que pueden unirse al grupo (incluyéndote)"
                    autoComplete="off"
                  />

                  <InlineStack gap="300">
                    <Button
                      variant="primary"
                      submit
                      loading={loading}
                      disabled={loading || success}
                    >
                      Crear Grupo
                    </Button>
                    <Button
                      onClick={() => router.push('/tienda')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </InlineStack>
                </BlockStack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

