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
  const [maxMembersPerGroup, setMaxMembersPerGroup] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  
  // Group details state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
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
        setMaxMembersPerGroup(data.maxMembersPerGroup || null);
        console.log('[ProfileBlock] User permissions:', {
          canCreateGroups: data.canCreateGroups,
          maxMembersPerGroup: data.maxMembersPerGroup,
        });
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
      
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      console.log('[ProfileBlock] Authenticated account:', {
        hasAccount: !!authenticatedAccount,
        hasCustomer: !!customer,
        customerId: customer?.id,
      });
      
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
      
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      
      let apiUrl = `${appUrl}/api/customer/group`;
      if (customer?.id) {
        const customerIdMatch = customer.id.match(/Customer\/(\d+)/);
        if (customerIdMatch && customerIdMatch[1]) {
          apiUrl += `?customerId=${customerIdMatch[1]}`;
          console.log('[ProfileBlock] Using customer ID from authenticatedAccount:', customerIdMatch[1]);
        }
      }
      
      console.log('[ProfileBlock] Making request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
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

  async function fetchGroupDetails(groupId) {
    try {
      setLoadingDetails(true);
      setError(null);
      
      const sessionToken = await shopify.sessionToken.get();
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      
      const response = await fetch(`${appUrl}/api/groups/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalles del grupo');
      }

      const data = await response.json();
      setGroupDetails(data);
    } catch (err) {
      console.error('[ProfileBlock] Error fetching group details:', err);
      setError(err.message || 'Error al cargar detalles del grupo');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleViewDetails(group) {
    setSelectedGroup(group);
    setShowInviteForm(false);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(false);
    await fetchGroupDetails(group.id);
  }

  async function handleBackToList() {
    setSelectedGroup(null);
    setGroupDetails(null);
    setShowInviteForm(false);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(false);
    await fetchGroups(); // Refresh groups list
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteError('Por favor ingresa un email válido');
      return;
    }

    setSendingInvite(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const sessionToken = await shopify.sessionToken.get();
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      
      const response = await fetch(`${appUrl}/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          email: inviteEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.invitation) {
        // Check if email was sent successfully
        if (data.emailSent) {
          setInviteSuccess(true);
          setInviteEmail('');
          setTimeout(() => {
            setInviteSuccess(false);
            setShowInviteForm(false);
          }, 3000);
        } else {
          // Invitation was created but email failed
          // Show a warning with the invite code
          const errorMsg = data.emailError || 'El email no pudo ser enviado, pero la invitación fue creada.';
          setInviteError(errorMsg);
          // Still show success for invitation creation, but with warning
          setInviteSuccess(true);
          setTimeout(() => {
            setInviteSuccess(false);
            setShowInviteForm(false);
            setInviteError(null);
          }, 5000); // Show longer to read the message
        }
      } else {
        setInviteError(data.error || 'Error al enviar la invitación');
      }
    } catch (err) {
      console.error('[ProfileBlock] Error sending invitation:', err);
      setInviteError('Error al enviar la invitación. Intenta de nuevo.');
    } finally {
      setSendingInvite(false);
    }
  }

  async function createGroup() {
    try {
      setCreatingGroup(true);
      setCreateGroupError(null);
      
      if (!groupName.trim()) {
        setCreateGroupError('El nombre del grupo es requerido');
        return;
      }

      // Check if user already has a group (limit to 1 group per user)
      if (groups.length > 0) {
        setCreateGroupError('Ya tienes un grupo activo. Solo puedes tener un grupo a la vez.');
        return;
      }
      
      const sessionToken = await shopify.sessionToken.get();
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      let apiUrl = `${appUrl}/api/groups`;
      
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
          // max_members is controlled by backend (user.max_members_per_group or config)
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
      
      setShowCreateForm(false);
      setGroupName('');
      
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

  if (loading) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>Cargando grupos...</s-text>
        </s-stack>
      </s-section>
    );
  }

  if (error && !selectedGroup) {
    return (
      <s-section heading="Friends & Family">
        <s-banner tone="critical">
          <s-text>{error}</s-text>
        </s-banner>
      </s-section>
    );
  }

  // Show group details view
  if (selectedGroup && groupDetails) {
    const group = groupDetails.group;
    const members = groupDetails.members || [];
    
    return (
      <s-section heading="Detalles del Grupo">
        <s-stack direction="block" gap="base">
          <s-button 
            variant="secondary" 
            onClick={handleBackToList}
          >
            ← Volver a la lista
          </s-button>
          
          <s-stack direction="block" gap="small">
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
          
          {members.length > 0 && (
            <s-stack direction="block" gap="small">
              <s-heading>Miembros del Grupo</s-heading>
              {members.map((member) => (
                <s-text key={member.id}>
                  • {member.email} {member.is_owner ? '(Propietario)' : ''}
                </s-text>
              ))}
            </s-stack>
          )}
          
          {!showInviteForm ? (
            <s-button 
              variant="primary" 
              onClick={() => {
                setShowInviteForm(true);
                setInviteError(null);
                setInviteSuccess(false);
              }}
            >
              Invitar a alguien
            </s-button>
          ) : (
            <s-stack direction="block" gap="base">
              <s-heading>Invitar a un miembro</s-heading>
              
              {inviteSuccess && !inviteError && (
                <s-banner tone="success">
                  <s-text>¡Invitación enviada exitosamente!</s-text>
                </s-banner>
              )}
              
              {inviteSuccess && inviteError && (
                <s-banner tone="warning">
                  <s-text>Invitación creada, pero el email no pudo ser enviado:</s-text>
                  <s-text>{inviteError}</s-text>
                </s-banner>
              )}
              
              {!inviteSuccess && inviteError && (
                <s-banner tone="critical">
                  <s-text>{inviteError}</s-text>
                </s-banner>
              )}
              
              <s-text-field
                label="Email del invitado"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="ejemplo@email.com"
                disabled={sendingInvite}
              />
              
              <s-stack direction="inline" gap="base" alignment="end">
                <s-button
                  variant="secondary"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setInviteError(null);
                    setInviteSuccess(false);
                  }}
                  disabled={sendingInvite}
                >
                  Cancelar
                </s-button>
                <s-button
                  variant="primary"
                  onClick={handleInvite}
                  loading={sendingInvite}
                >
                  Enviar Invitación
                </s-button>
              </s-stack>
            </s-stack>
          )}
        </s-stack>
      </s-section>
    );
  }

  if (groups.length === 0) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>No tienes grupos activos de Friends & Family.</s-text>
          
          {canCreateGroups ? (
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
                  
                  {maxMembersPerGroup && (
                    <s-text appearance="subdued">
                      Tu grupo podrá tener hasta {maxMembersPerGroup} miembros.
                    </s-text>
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
                variant="primary" 
                onClick={() => handleViewDetails(group)}
              >
                Ver detalles
              </s-button>
            </s-stack>
          </s-section>
        ))}
        
        {canCreateGroups && groups.length === 0 && (
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
                
                {maxMembersPerGroup && (
                  <s-text appearance="subdued">
                    Tu grupo podrá tener hasta {maxMembersPerGroup} miembros.
                  </s-text>
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
        )}
      </s-stack>
    </s-section>
  );
}
