"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  VerticalStack,
} from '@shopify/polaris';

export default function JoinGroupPage() {
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/invitations/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode, customerEmail: email || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo unir al grupo');
      }

      setSuccessMessage('¡Listo! Te uniste al grupo correctamente.');
      setInviteCode('');
      setEmail('');
    } catch (error: any) {
      setErrorMessage(error.message || 'Error intentando unirse al grupo');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = inviteCode.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <VerticalStack gap="400">
        <Text variant="headingLg" as="h1">
          Unirse a un Grupo Friends & Family
        </Text>
        <Text variant="bodyMd" tone="subdued">
          Ingresá tu código de invitación para sumarte al grupo. Si tu cuenta aún no está
          asociada a la tienda, podés indicar tu correo para que podamos vincularte.
        </Text>

        {successMessage && (
          <Banner status="success" title="¡Éxito!">
            <p>{successMessage}</p>
          </Banner>
        )}

        {errorMessage && (
          <Banner status="critical" title="No pudimos unirte">
            <p>{errorMessage}</p>
          </Banner>
        )}

        <Card>
          <Card.Section>
            <FormLayout>
              <TextField
                label="Código de Invitación"
                value={inviteCode}
                onChange={setInviteCode}
                autoComplete="off"
                helpText="Ingresá el código exactamente como lo recibiste."
              />
              <TextField
                label="Correo (opcional)"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                helpText="Sólo si aún no tenés cuenta o querés usar otro correo."
              />
              <Button
                primary
                onClick={handleJoin}
                disabled={!canSubmit || loading}
                loading={loading}
              >
                Unirse al Grupo
              </Button>
            </FormLayout>
          </Card.Section>
        </Card>
      </VerticalStack>
    </div>
  );
}
