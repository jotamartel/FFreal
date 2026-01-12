-- ============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- ============================================
-- Este script combina todos los schemas necesarios en el orden correcto
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: SCHEMA PRINCIPAL
-- ============================================
-- Este es el contenido de lib/database/schema.sql
-- Crea todas las tablas base del sistema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios del programa (empleados y administradores)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'customer',
  can_create_groups BOOLEAN DEFAULT false,
  max_members_per_group INTEGER,
  discount_tier_identifier VARCHAR(50),
  shopify_customer_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- ============================================
-- FRIENDS & FAMILY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS ff_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_customer_id VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  discount_code VARCHAR(50),
  max_members INTEGER DEFAULT 20 CHECK (max_members > 0),
  current_members INTEGER DEFAULT 1 CHECK (current_members >= 0),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ff_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES ff_groups(id) ON DELETE CASCADE,
  customer_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'inactive')),
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_expires_at TIMESTAMP,
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES ff_group_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES ff_groups(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  expires_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ff_discount_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  invite_redirect_url VARCHAR(500),
  max_groups_per_email INTEGER DEFAULT 1,
  cooling_period_days INTEGER DEFAULT 30,
  max_members_default INTEGER DEFAULT 20,
  rules JSONB DEFAULT '{}'::jsonb,
  is_store_open BOOLEAN DEFAULT false,
  next_event_date TIMESTAMP WITH TIME ZONE,
  event_message TEXT,
  terms_version VARCHAR(50),
  terms_text TEXT,
  email_from VARCHAR(255),
  email_support VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ff_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES ff_groups(id) ON DELETE CASCADE,
  invite_code VARCHAR(50) NOT NULL,
  customer_id VARCHAR(255),
  order_id VARCHAR(255),
  used_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TERMS & CONDITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL,
  terms_version VARCHAR(50) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_users_shopify_customer ON users(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_can_create_groups ON users(can_create_groups);
CREATE INDEX IF NOT EXISTS idx_users_max_members_per_group ON users(max_members_per_group);
CREATE INDEX IF NOT EXISTS idx_users_discount_tier_identifier ON users(discount_tier_identifier);

CREATE INDEX IF NOT EXISTS idx_ff_groups_merchant ON ff_groups(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ff_groups_owner_customer ON ff_groups(owner_customer_id);
CREATE INDEX IF NOT EXISTS idx_ff_groups_owner_user ON ff_groups(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_ff_groups_invite_code ON ff_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_ff_groups_status ON ff_groups(status);

CREATE INDEX IF NOT EXISTS idx_ff_members_group ON ff_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_ff_members_customer ON ff_group_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_ff_members_email ON ff_group_members(email);
CREATE INDEX IF NOT EXISTS idx_ff_members_user ON ff_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ff_members_status ON ff_group_members(status);

CREATE INDEX IF NOT EXISTS idx_ff_invitations_group ON ff_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_ff_invitations_token ON ff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_ff_invitations_email ON ff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_ff_invitations_status ON ff_invitations(status);
CREATE INDEX IF NOT EXISTS idx_ff_invitations_expires ON ff_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_ff_config_merchant ON ff_discount_config(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ff_config_store_status ON ff_discount_config(is_store_open);

CREATE INDEX IF NOT EXISTS idx_ff_code_usage_group ON ff_code_usage(group_id);
CREATE INDEX IF NOT EXISTS idx_ff_code_usage_code ON ff_code_usage(invite_code);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ff_groups_updated_at BEFORE UPDATE ON ff_groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ff_members_updated_at BEFORE UPDATE ON ff_group_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ff_config_updated_at BEFORE UPDATE ON ff_discount_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mantener current_members sincronizado con los movimientos de miembros
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE ff_groups
    SET current_members = current_members + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE ff_groups
      SET current_members = current_members + 1
      WHERE id = NEW.group_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE ff_groups
      SET current_members = GREATEST(current_members - 1, 0)
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE ff_groups
    SET current_members = GREATEST(current_members - 1, 0)
    WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON ff_group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- ============================================
-- PARTE 2: CONFIGURACIONES ADICIONALES
-- ============================================
-- Estas configuraciones ya están incluidas en el schema principal,
-- pero las dejamos aquí por si necesitas ejecutarlas por separado

-- Asegurar que max_members_default tenga un valor por defecto
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ff_discount_config'
  ) THEN
    UPDATE ff_discount_config 
    SET max_members_default = 20 
    WHERE max_members_default IS NULL;
  END IF;
END $$;

-- Asegurar que can_create_groups tenga un valor por defecto
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users'
  ) THEN
    UPDATE users 
    SET can_create_groups = false 
    WHERE can_create_groups IS NULL;
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 
    'ff_groups', 
    'ff_group_members', 
    'ff_invitations', 
    'ff_discount_config', 
    'ff_code_usage',
    'terms_acceptance'
  );
  
  IF table_count = 7 THEN
    RAISE NOTICE '✅ Todas las tablas fueron creadas correctamente';
  ELSE
    RAISE WARNING '⚠️ Solo se crearon % de 7 tablas esperadas', table_count;
  END IF;
END $$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Después de ejecutar este script:
-- 1. Verifica en Table Editor que todas las tablas existen
-- 2. Configura DATABASE_URL en Vercel y localmente
-- 3. Prueba la conexión con: node scripts/test-supabase-connection.js
