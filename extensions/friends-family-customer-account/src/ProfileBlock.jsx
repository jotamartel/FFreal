import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect, useRef} from 'preact/hooks';

export default async () => {
  render(<FriendsFamilyBlock />, document.body);
}

const APP_URL = 'https://shopify-friends-family-app.vercel.app';

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
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // Group details state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteManualCode, setInviteManualCode] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const [removeSuccess, setRemoveSuccess] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState(null);
  const [revokeInvitationError, setRevokeInvitationError] = useState(null);
  const groupDetailsRefreshIntervalRef = useRef(null);
  
  // Form state
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchPermissions();
    fetchGroups();
    
    // Cleanup interval on unmount
    return () => {
      if (groupDetailsRefreshIntervalRef.current) {
        clearInterval(groupDetailsRefreshIntervalRef.current);
      }
    };
  }, []);

  async function fetchPermissions() {
    try {
      const sessionToken = await shopify.sessionToken.get();
      const authenticatedAccount = shopify.authenticatedAccount;
      const customer = authenticatedAccount?.customer?.value;
      
      let apiUrl = `${APP_URL}/api/customer/permissions`;
      
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
      
      
      let apiUrl = `${APP_URL}/api/customer/group`;
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
      
      const response = await fetch(`${APP_URL}/api/groups/${groupId}`, {
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
      console.log('[ProfileBlock] Group details received:', {
        hasGroup: !!data.group,
        membersCount: data.members?.length || 0,
        pendingInvitationsCount: data.pendingInvitations?.length || 0,
        pendingInvitations: data.pendingInvitations,
      });
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
    setInviteManualCode(null);
    setCopyMessage(null);
    setRemoveError(null);
    setRemoveSuccess(false);
    setRemovingMemberId(null);
    await fetchGroupDetails(group.id);
    
    // Auto-refresh group details every 10 seconds when viewing details
    // This ensures we see new members who accepted invitations
    if (groupDetailsRefreshIntervalRef.current) {
      clearInterval(groupDetailsRefreshIntervalRef.current);
    }
    groupDetailsRefreshIntervalRef.current = setInterval(async () => {
      if (group) {
        console.log('[ProfileBlock] Auto-refreshing group details...');
        await fetchGroupDetails(group.id);
      }
    }, 10000); // Refresh every 10 seconds
  }

  async function handleBackToList() {
    // Clear refresh interval when leaving group details
    if (groupDetailsRefreshIntervalRef.current) {
      clearInterval(groupDetailsRefreshIntervalRef.current);
      groupDetailsRefreshIntervalRef.current = null;
    }
    
    setSelectedGroup(null);
    setGroupDetails(null);
    setShowInviteForm(false);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(false);
    setInviteManualCode(null);
    setCopyMessage(null);
    setRemoveError(null);
    setRemoveSuccess(false);
    setRemovingMemberId(null);
    await fetchGroups(); // Refresh groups list
  }
  
  async function handleRefreshGroupDetails() {
    if (selectedGroup) {
      await fetchGroupDetails(selectedGroup.id);
    }
  }

  async function handleRevokeInvitation(invitationId) {
    if (!selectedGroup || !invitationId) {
      console.warn('[ProfileBlock] Cannot revoke invitation: missing selectedGroup or invitationId');
      return;
    }

    console.log('[ProfileBlock] Revoking invitation:', { invitationId, groupId: selectedGroup.id });
    setRevokingInvitationId(invitationId);
    setRevokeInvitationError(null);

    try {
      const sessionToken = await shopify.sessionToken.get();
      console.log('[ProfileBlock] Session token obtained, length:', sessionToken?.length || 0);
      
      const url = `${APP_URL}/api/invitations/revoke?id=${invitationId}`;
      console.log('[ProfileBlock] Calling DELETE:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });

      console.log('[ProfileBlock] Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('[ProfileBlock] Response data:', data);

      if (response.ok && data.success) {
        console.log('[ProfileBlock] ✅ Invitation revoked successfully');
        // Reload group details to refresh the pending invitations list
        await fetchGroupDetails(selectedGroup.id);
        setRevokeInvitationError(null);
      } else {
        const errorMsg = data.error || 'Error al eliminar la invitación';
        console.error('[ProfileBlock] ❌ Error revoking invitation:', errorMsg);
        setRevokeInvitationError(errorMsg);
      }
    } catch (err) {
      console.error('[ProfileBlock] Exception revoking invitation:', err);
      setRevokeInvitationError('Error al eliminar la invitación. Intenta de nuevo.');
    } finally {
      setRevokingInvitationId(null);
    }
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
      
      const response = await fetch(`${APP_URL}/api/invitations`, {
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
          setInviteManualCode(null);
          setCopyMessage(null);
          // Reload group details to show the new pending invitation
          await fetchGroupDetails(selectedGroup.id);
          setTimeout(() => {
            setInviteSuccess(false);
            setShowInviteForm(false);
          }, 3000);
        } else {
          // Invitation was created but email failed
          const errorMsg = data.emailError || 'El email no pudo ser enviado, pero la invitación fue creada.';
          setInviteError(errorMsg);
          setInviteManualCode(data.inviteCode || null);
          setInviteSuccess(true);
          // Reload group details to show the new pending invitation
          await fetchGroupDetails(selectedGroup.id);
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

  async function handleRemoveMember(memberId) {
    if (!selectedGroup) {
      return;
    }

    setRemoveError(null);
    setRemoveSuccess(false);
    setRemovingMemberId(memberId);

    try {
      const sessionToken = await shopify.sessionToken.get();

      const response = await fetch(`${APP_URL}/api/groups/${selectedGroup.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar al miembro');
      }

      setRemoveSuccess(true);
      setTimeout(() => setRemoveSuccess(false), 3000);

      await fetchGroupDetails(selectedGroup.id);
      await fetchGroups();
    } catch (err) {
      console.error('[ProfileBlock] Error removing member:', err);
      setRemoveError(err.message || 'No se pudo eliminar al miembro. Intenta de nuevo.');
    } finally {
      setRemovingMemberId(null);
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
      
      let apiUrl = `${APP_URL}/api/groups`;
      
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
      setJoinError('Por favor ingresa un código de invitación');
      return;
    }

    setJoiningGroup(true);
    setJoinError(null);
    setJoinSuccess(false);

    try {
      const sessionToken = await shopify.sessionToken.get();
      
      const response = await fetch(`${APP_URL}/api/invitations/join-by-code`, {
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
        setJoinSuccess(true);
        await fetchGroups();
      } else {
        setJoinError(data.error || 'Error al unirse al grupo');
      }
    } catch (err) {
      console.error('[ProfileBlock] Error joining group:', err);
      setJoinError('Error al unirse al grupo. Intenta de nuevo.');
    } finally {
      setJoiningGroup(false);
    }
  }

  async function copyInviteCode(code) {
    if (!code) return;
    try {
      await navigator.clipboard?.writeText?.(code);
      setCopyMessage('Código copiado al portapapeles');
      setTimeout(() => setCopyMessage(null), 3000);
    } catch (err) {
      console.warn('[ProfileBlock] No se pudo copiar el código:', err);
      setCopyMessage('No se pudo copiar automáticamente. Copia manualmente.');
      setTimeout(() => setCopyMessage(null), 5000);
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
    const pendingInvitations = groupDetails.pendingInvitations || [];
    
    // Debug log
    console.log('[ProfileBlock] Rendering group details:', {
      groupId: group?.id,
      membersCount: members.length,
      pendingInvitationsCount: pendingInvitations.length,
      pendingInvitations: pendingInvitations,
      groupDetailsKeys: Object.keys(groupDetails),
    });
    
    return (
      <s-section heading="Detalles del Grupo">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" justifyContent="space-between">
            <s-button 
              variant="secondary" 
              onClick={handleBackToList}
            >
              ← Volver a la lista
            </s-button>
            <s-button 
              variant="secondary" 
              size="slim"
              onClick={handleRefreshGroupDetails}
            >
              🔄 Actualizar
            </s-button>
          </s-stack>
          
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
            
            {group.invite_code && (
              <s-text>
                <s-text type="strong">Código de invitación:</s-text> {group.invite_code}
              </s-text>
            )}
          </s-stack>

          {removeSuccess && (
            <s-banner tone="success">
              <s-text>Miembro eliminado correctamente.</s-text>
            </s-banner>
          )}

          {removeError && (
            <s-banner tone="critical">
              <s-text>{removeError}</s-text>
            </s-banner>
          )}
          
          {members.length > 0 && (
            <s-stack direction="block" gap="small">
              <s-heading>Miembros del Grupo</s-heading>
              {members.map((member) => (
                <s-stack
                  key={member.id}
                  direction="inline"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <s-text>
                    • {member.email} {member.role === 'owner' ? '(Propietario)' : ''}
                  </s-text>
                  {member.role !== 'owner' && (
                    <s-button
                      variant="secondary"
                      size="slim"
                      onClick={() => handleRemoveMember(member.id)}
                      loading={removingMemberId === member.id}
                      disabled={removingMemberId === member.id}
                    >
                      Quitar
                    </s-button>
                  )}
                </s-stack>
              ))}
            </s-stack>
          )}

          {/* Debug info - mostrar siempre para verificar */}
          <s-stack direction="block" gap="small">
            <s-text tone="subdued" size="small">
              Debug: pendingInvitations recibidas = {pendingInvitations.length}
            </s-text>
            {pendingInvitations.length > 0 && (
              <s-text tone="subdued" size="small">
                Emails: {pendingInvitations.map((inv) => inv.email).join(', ')}
              </s-text>
            )}
          </s-stack>

          {revokeInvitationError && (
            <s-banner tone="critical">
              <s-text>{revokeInvitationError}</s-text>
            </s-banner>
          )}

          {pendingInvitations.length > 0 && (
            <s-stack direction="block" gap="small">
              <s-heading>Invitaciones Pendientes ({pendingInvitations.length})</s-heading>
              {pendingInvitations.map((invitation) => {
                const expiresDate = new Date(invitation.expires_at);
                const isExpiringSoon = expiresDate.getTime() - Date.now() < 24 * 60 * 60 * 1000; // Menos de 24 horas
                
                return (
                  <s-stack
                    key={invitation.id}
                    direction="inline"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <s-stack direction="block" gap="none">
                      <s-text>
                        • {invitation.email}
                      </s-text>
                      <s-text tone="subdued" size="small">
                        Enviada: {new Date(invitation.sent_at).toLocaleDateString('es-ES')}
                        {isExpiringSoon && (
                          <s-text tone="attention"> • Expira pronto</s-text>
                        )}
                      </s-text>
                    </s-stack>
                    <s-button
                      variant="secondary"
                      size="slim"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      loading={revokingInvitationId === invitation.id}
                      disabled={revokingInvitationId === invitation.id}
                    >
                      Eliminar
                    </s-button>
                  </s-stack>
                );
              })}
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
                  <s-text>Invitación creada, pero el email no pudo ser enviado.</s-text>
                  <s-text>{inviteError}</s-text>
                  {inviteManualCode && (
                    <s-stack direction="block" gap="small">
                      <s-text>
                        Comparte este código manualmente: <s-text type="strong">{inviteManualCode}</s-text>
                      </s-text>
                      <s-button
                        variant="secondary"
                        onClick={() => copyInviteCode(inviteManualCode)}
                        size="slim"
                      >
                        Copiar código
                      </s-button>
                      {copyMessage && (
                        <s-text appearance="subdued">{copyMessage}</s-text>
                      )}
                    </s-stack>
                  )}
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
                    setInviteManualCode(null);
                    setCopyMessage(null);
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
                  {!maxMembersPerGroup && (
                    <s-text appearance="subdued">
                      El número máximo de miembros se definirá según la configuración del programa.
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
                
                {joinError && (
                  <s-banner tone="critical">
                    <s-text>{joinError}</s-text>
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
                {joinSuccess && (
                  <s-text appearance="positive">
                    ¡Te uniste correctamente! Actualizaremos tus grupos.
                  </s-text>
                )}
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
                {!maxMembersPerGroup && (
                  <s-text appearance="subdued">
                    El número máximo de miembros se definirá según la configuración del programa.
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
