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

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      setLoading(true);
      
      // Obtener el token de sesión del cliente desde Shopify
      const sessionToken = await shopify.sessionToken.get();
      
      // Llamar a la API de tu aplicación
      // Nota: Necesitas usar la URL completa de tu aplicación en Vercel
      const appUrl = 'https://shopify-friends-family-app.vercel.app';
      const response = await fetch(`${appUrl}/api/customer/group`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include', // Para incluir cookies de autenticación
      });

      if (!response.ok) {
        throw new Error('Error al cargar grupos');
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.message);
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

  if (groups.length === 0) {
    return (
      <s-section heading="Friends & Family">
        <s-stack direction="block" gap="base">
          <s-text>No tienes grupos activos de Friends & Family.</s-text>
          <s-button 
            variant="primary" 
            href="https://shopify-friends-family-app.vercel.app/tienda/grupos/nuevo"
            target="_blank"
          >
            Crear un grupo
          </s-button>
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
                href={`https://shopify-friends-family-app.vercel.app/tienda/grupos/${group.id}`}
                target="_blank"
              >
                Gestionar grupo
              </s-button>
            </s-stack>
          </s-card>
        ))}
        
        <s-button 
          variant="primary" 
          href="https://shopify-friends-family-app.vercel.app/tienda/grupos/nuevo"
          target="_blank"
        >
          Crear nuevo grupo
        </s-button>
      </s-stack>
    </s-section>
  );
}

