import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from 'preact/hooks';

export default async () => {
  render(<FriendsFamilyBlock />, document.body);
}

function FriendsFamilyBlock() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canCreateGroups, setCanCreateGroups] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  
  // Form state
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchPermissions();
    fetchGroups();
  }, []);

  async function fetchPermissions() {
    try {
      const sessionToken = await shopify.sessionToken.get();
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      let apiUrl = `${appUrl}/api/customer/permissions`;
      
      if (customer?.id) {
        const customerIdMatch = customer.id.match(/Customer\/(\d+)/);
        if (customerIdMatch && customerIdMatch[1]) {
          apiUrl += `?customerId=${customerIdMatch[1]}`;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCanCreateGroups(data.canCreateGroups === true);
        console.log('[ProfileBlock] User can create groups:', data.canCreateGroups);
      } else {
        console.warn('[ProfileBlock] Could not fetch permissions, defaulting to false');
        setCanCreateGroups(false);
      }
    } catch (err) {
      console.error('[ProfileBlock] Error fetching permissions:', err);
      setCanCreateGroups(false);
    }
  }

  async function fetchGroups() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[ProfileBlock] Starting to fetch groups...');
      
      // Verificar si hay una cuenta autenticada
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      console.log('[ProfileBlock] Authenticated account:', {
        hasAccount: !!authenticatedAccount,
        hasCustomer: !!customer,
        customerId: customer?.id,
      });
      
      // Obtener el token de sesión del cliente desde Shopify
      let sessionToken;
      try {
        sessionToken = await shopify.sessionToken.get();
        console.log('[ProfileBlock] Session token obtained, length:', sessionToken?.length || 0);
      } catch (tokenError) {
        console.error('[ProfileBlock] Error getting session token:', tokenError);
        throw new Error('No se pudo obtener el token de sesión');
      }
      
      if (!sessionToken) {
        throw new Error('Token de sesión no disponible');
      }
      
      // Llamar a la API de tu aplicación
      // Nota: Necesitas usar la URL completa de tu aplicación en Vercel
      // Usar la URL de producción de Vercel (no la URL de deployment específica)
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      
      // Build API URL with customer ID if available from authenticatedAccount
      let apiUrl = `${appUrl}/api/customer/group`;
      if (customer?.id) {
        // Extract numeric customer ID from GID format: gid://shopify/Customer/123456
        const customerIdMatch = customer.id.match(/Customer\/(\d+)/);
        if (customerIdMatch && customerIdMatch[1]) {
          apiUrl += `?customerId=${customerIdMatch[1]}`;
          console.log('[ProfileBlock] Using customer ID from authenticatedAccount:', customerIdMatch[1]);
        }
      }
      
      console.log('[ProfileBlock] Making request to:', apiUrl);
      console.log('[ProfileBlock] Session token length:', sessionToken?.length || 0);
      
      console.log('[ProfileBlock] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include', // Para incluir cookies de autenticación
      });

      console.log('[ProfileBlock] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProfileBlock] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        let errorMessage = 'Error al cargar grupos';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no es JSON, usar el texto
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[ProfileBlock] Success! Groups received:', data.groups?.length || 0);
      setGroups(data.groups || []);
    } catch (err) {
      console.error('[ProfileBlock] Error fetching groups:', err);
      setError(err.message || 'Error desconocido al cargar grupos');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>Cargando grupos...</s-text>
        </s-stack>
      </s-section>
    );
  }

  if (error) {
    return (
      <s-section heading="Friends & Family">
        <s-banner tone="critical">
          <s-text>{error}</s-text>
        </s-banner>
      </s-section>
    );
  }

  async function createGroup() {
    try {
      setCreatingGroup(true);
      setCreateGroupError(null);
      
      if (!groupName.trim()) {
        setCreateGroupError('El nombre del grupo es requerido');
        return;
      }
      
      // Get session token
      const sessionToken = await shopify.sessionToken.get();
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      let apiUrl = `${appUrl}/api/groups`;
      
      // Add customer ID to query if available
      if (customer?.id) {
        const customerIdMatch = customer.id.match(/Customer\/(\d+)/);
        if (customerIdMatch && customerIdMatch[1]) {
          apiUrl += `?customerId=${customerIdMatch[1]}`;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: groupName.trim(),
          merchantId: 'default',
          // max_members is now controlled by admin config, not user input
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error al crear el grupo';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[ProfileBlock] Group created successfully:', data);
      
      // Close form and reset
      setShowCreateForm(false);
      setGroupName('');
      
      // Refresh groups list
      await fetchGroups();
    } catch (err) {
      console.error('[ProfileBlock] Error creating group:', err);
      setCreateGroupError(err.message || 'Error desconocido al crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  }

  async function joinGroupByCode() {
    if (!inviteCode.trim()) {
      setError('Por favor ingresa un código de invitación');
      return;
    }

    setJoiningGroup(true);
    setError(null);

    try {
      const sessionToken = await shopify.sessionToken.get();
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      
      const response = await fetch(`${appUrl}/api/invitations/join-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.member) {
        setInviteCode('');
        await fetchGroups();
      } else {
        setError(data.error || 'Error al unirse al grupo');
      }
    } catch (err) {
      console.error('[ProfileBlock] Error joining group:', err);
      setError('Error al unirse al grupo. Intenta de nuevo.');
    } finally {
      setJoiningGroup(false);
    }
  }

  if (groups.length === 0) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>No tienes grupos activos de Friends & Family.</s-text>
          
          {canCreateGroups ? (
            // User can create groups - show create form
            !showCreateForm ? (
              <s-button 
                variant="primary" 
                onClick={() => {
                  console.log('[ProfileBlock] Button clicked, showing form');
                  setShowCreateForm(true);
                }}
              >
                Crear un grupo
              </s-button>
            ) : (
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-heading>Crear Grupo Friends & Family</s-heading>
                  
                  {createGroupError && (
                    <s-banner tone="critical">
                      <s-text>{createGroupError}</s-text>
                    </s-banner>
                  )}
                  
                  <s-text-field
                    label="Nombre del Grupo"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ej: Mi Familia"
                    disabled={creatingGroup}
                  />
                  
                  <s-stack direction="inline" gap="base" alignment="end">
                    <s-button
                      variant="secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCreateGroupError(null);
                        setGroupName('');
                      }}
                      disabled={creatingGroup}
                    >
                      Cancelar
                    </s-button>
                    <s-button
                      variant="primary"
                      onClick={createGroup}
                      loading={creatingGroup}
                    >
                      Crear Grupo
                    </s-button>
                  </s-stack>
                </s-stack>
              </s-section>
            )
          ) : (
            // User cannot create groups - only show join by code
            <s-section>
              <s-stack direction="block" gap="base">
                <s-heading>Unirse a un Grupo</s-heading>
                <s-text appearance="subdued">
                  Ingresa el código de invitación que recibiste por email para unirte a un grupo de Friends & Family.
                </s-text>
                
                {error && (
                  <s-banner tone="critical">
                    <s-text>{error}</s-text>
                  </s-banner>
                )}
                
                <s-text-field
                  label="Código de Invitación"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej: ABC12345"
                  disabled={joiningGroup}
                />
                
                <s-button
                  variant="primary"
                  onClick={joinGroupByCode}
                  loading={joiningGroup}
                >
                  Unirse al Grupo
                </s-button>
              </s-stack>
            </s-section>
          )}
        </s-stack>
      </s-section>
    );
  }

  return (
    <s-section heading="Friends & Family">
      <s-stack direction="block" gap="base">
        {groups.map((group) => (
          <s-section key={group.id}>
            <s-stack direction="block" gap="small">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-heading>{group.name}</s-heading>
                <s-badge tone={group.status === 'active' ? 'success' : 'attention'}>
                  {group.status === 'active' ? 'Activo' : group.status}
                </s-badge>
              </s-stack>
              
              <s-stack direction="block" gap="small">
                <s-text>
                  <s-text type="strong">Miembros:</s-text> {group.current_members} / {group.max_members}
                </s-text>
                
                {group.discount_tier && (
                  <s-text>
                    <s-text type="strong">Descuento:</s-text> {group.discount_tier}%
                  </s-text>
                )}
                
                {group.invite_code && (
                  <s-text>
                    <s-text type="strong">Código de invitación:</s-text> {group.invite_code}
                  </s-text>
                )}
              </s-stack>
              
              <s-button 
                variant="secondary" 
                onClick={() => {
                  // Open group management - we'll create a modal for this too
                  // For now, just show group details
                  console.log('Managing group:', group.id);
                }}
              >
                Ver detalles
              </s-button>
            </s-stack>
          </s-section>
        ))}
        
        {canCreateGroups ? (
          // User can create groups
          !showCreateForm ? (
            <s-button 
              variant="primary" 
              onClick={() => {
                console.log('[ProfileBlock] Button clicked, showing form');
                setShowCreateForm(true);
              }}
            >
              Crear nuevo grupo
            </s-button>
          ) : (
            <s-section>
              <s-stack direction="block" gap="base">
                <s-heading>Crear Grupo Friends & Family</s-heading>
                
                {createGroupError && (
                  <s-banner tone="critical">
                    <s-text>{createGroupError}</s-text>
                  </s-banner>
                )}
                
                <s-text-field
                  label="Nombre del Grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej: Mi Familia"
                  disabled={creatingGroup}
                />
                
                <s-stack direction="inline" gap="base" alignment="end">
                  <s-button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateGroupError(null);
                      setGroupName('');
                    }}
                    disabled={creatingGroup}
                  >
                    Cancelar
                  </s-button>
                  <s-button
                    variant="primary"
                    onClick={createGroup}
                    loading={creatingGroup}
                  >
                    Crear Grupo
                  </s-button>
                </s-stack>
              </s-stack>
            </s-section>
          )
        ) : (
          // User cannot create groups - show join by code
          <s-section>
            <s-stack direction="block" gap="base">
              <s-heading>Unirse a un Grupo</s-heading>
              <s-text appearance="subdued">
                Ingresa el código de invitación que recibiste por email para unirte a un grupo de Friends & Family.
              </s-text>
              
              {error && (
                <s-banner tone="critical">
                  <s-text>{error}</s-text>
                </s-banner>
              )}
              
              <s-text-field
                label="Código de Invitación"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Ej: ABC12345"
                disabled={joiningGroup}
              />
              
              <s-button
                variant="primary"
                onClick={joinGroupByCode}
                loading={joiningGroup}
              >
                Unirse al Grupo
              </s-button>
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </s-section>
  );
}

