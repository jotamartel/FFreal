import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect, useRef} from 'preact/hooks';

export default async () => {
  render(<FriendsFamilyBlock />, document.body);
}

function FriendsFamilyBlock() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState(null);
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState('6');

  useEffect(() => {
    fetchGroups();
  }, []);

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
      
      const maxMembersNum = parseInt(maxMembers, 10);
      if (isNaN(maxMembersNum) || maxMembersNum < 2 || maxMembersNum > 20) {
        setCreateGroupError('El máximo de miembros debe ser entre 2 y 20');
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
          max_members: maxMembersNum,
          merchantId: 'default',
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
      
      // Close modal and reset form
      if (modalRef.current) {
        modalRef.current.hideOverlay();
      }
      setGroupName('');
      setMaxMembers('6');
      
      // Refresh groups list
      await fetchGroups();
    } catch (err) {
      console.error('[ProfileBlock] Error creating group:', err);
      setCreateGroupError(err.message || 'Error desconocido al crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  }

  if (groups.length === 0) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>No tienes grupos activos de Friends & Family.</s-text>
          <s-button 
            variant="primary" 
            onClick={() => {
              console.log('[ProfileBlock] Button clicked, opening modal');
              if (modalRef.current) {
                modalRef.current.showOverlay();
              }
            }}
          >
            Crear un grupo
          </s-button>
          
          <s-modal ref={modalRef} id="create-group-modal">
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
              
              <s-text-field
                type="number"
                label="Máximo de Miembros"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                min="2"
                max="20"
                disabled={creatingGroup}
              />
              
              <s-text appearance="subdued">
                Máximo de personas que pueden unirse al grupo (incluyéndote)
              </s-text>
              
              <s-stack direction="inline" gap="base" alignment="end">
                <s-button
                  variant="secondary"
                  onClick={() => {
                    if (modalRef.current) {
                      modalRef.current.hideOverlay();
                    }
                    setCreateGroupError(null);
                    setGroupName('');
                    setMaxMembers('6');
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
          </s-modal>
        </s-stack>
      </s-section>
    );
  }

  return (
    <s-section heading="Friends & Family">
      <s-stack direction="block" gap="base">
        {groups.map((group) => (
          <s-card key={group.id}>
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
          </s-card>
        ))}
        
        <s-button 
          variant="primary" 
          onClick={() => {
            console.log('[ProfileBlock] Button clicked, opening modal');
            if (modalRef.current) {
              modalRef.current.showOverlay();
            }
          }}
        >
          Crear nuevo grupo
        </s-button>
        
        <s-modal ref={modalRef} id="create-group-modal">
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
            
            <s-text-field
              type="number"
              label="Máximo de Miembros"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              min="2"
              max="20"
              disabled={creatingGroup}
            />
            
            <s-text appearance="subdued">
              Máximo de personas que pueden unirse al grupo (incluyéndote)
            </s-text>
            
            <s-stack direction="inline" gap="base" alignment="end">
              <s-button
                variant="secondary"
                onClick={() => {
                  if (modalRef.current) {
                    modalRef.current.hideOverlay();
                  }
                  setCreateGroupError(null);
                  setGroupName('');
                  setMaxMembers('6');
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
        </s-modal>
      </s-stack>
    </s-section>
  );
}

