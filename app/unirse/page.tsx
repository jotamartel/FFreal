'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  Spinner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [checkingStore, setCheckingStore] = useState(true);

  useEffect(() => {
    const verifyStoreStatus = async () => {
      try {
        const response = await fetch('/api/store-status');
        if (response.ok) {
          const data = await response.json();
          if (data.status?.isStoreOpen === false) {
            if (data.status?.inviteRedirectUrl) {
              sessionStorage.setItem('ff-invite-redirect', data.status.inviteRedirectUrl);
            }
            router.replace('/closed');
            return;
          }
        }
      } catch (error) {
        console.error('[unirse] Error fetching store status:', error);
      } finally {
        setCheckingStore(false);
      }
    };

    verifyStoreStatus();
  }, [router]);

  useEffect(() => {
    if (checkingStore) {
      return;
    }
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setInviteCode(codeParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, checkingStore]);

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

  if (checkingStore) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <Text variant="headingLg" as="h1">
        Unirse a un Grupo Friends & Family
      </Text>
      <Text variant="bodyMd" tone="subdued" as="p">
        Ingresá tu código de invitación para sumarte al grupo. Si tu cuenta aún no está
        asociada a la tienda, podés indicar tu correo para que podamos vincularte.
      </Text>

      {successMessage && (
        <Banner tone="success" title="¡Éxito!">
          <p>{successMessage}</p>
        </Banner>
      )}

      {errorMessage && (
        <Banner tone="critical" title="No pudimos unirte">
          <p>{errorMessage}</p>
        </Banner>
      )}

      <Card>
        <div style={{ padding: '24px' }}>
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
              variant="primary"
              onClick={handleJoin}
              disabled={!canSubmit || loading}
              loading={loading}
            >
              Unirse al Grupo
            </Button>
          </FormLayout>
        </div>
      </Card>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGroupContent />
    </Suspense>
  );
}
