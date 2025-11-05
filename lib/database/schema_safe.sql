-- Shopify Friends & Family Discount App Database Schema
-- VERSION SEGURA - Maneja errores y verifica existencia de tablas/columnas
-- PostgreSQL compatible (Vercel Postgres, Supabase)

-- ============================================
-- APPOINTMENT SYSTEM (Simplified - no chatbot)
-- ============================================

-- Tabla de sucursales/branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de citas/appointments (sin dependencia de conversations)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shopify_customer_id VARCHAR(255),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de horarios disponibles
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 1=Lunes, etc
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_appointments INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FRIENDS & FAMILY DISCOUNT SYSTEM
-- ============================================

-- Tabla de grupos Friends & Family
CREATE TABLE IF NOT EXISTS ff_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_customer_id VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  max_members INTEGER DEFAULT 6,
  current_members INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  discount_tier INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de miembros del grupo
CREATE TABLE IF NOT EXISTS ff_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES ff_groups(id) ON DELETE CASCADE,
  customer_id VARCHAR(255),
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

-- Tabla de invitaciones
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

-- Tabla de configuración de descuentos
CREATE TABLE IF NOT EXISTS ff_discount_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(255) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  tiers JSONB DEFAULT '[]'::jsonb, -- Array of {memberCount: number, discountValue: number}
  rules JSONB DEFAULT '{}'::jsonb, -- {productInclusions, productExclusions, minimumPurchase, geoRestrictions, etc}
  max_groups_per_email INTEGER DEFAULT 1,
  cooling_period_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de uso de códigos (para códigos de un solo uso si es necesario)
CREATE TABLE IF NOT EXISTS ff_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES ff_groups(id) ON DELETE CASCADE,
  invite_code VARCHAR(50) NOT NULL,
  customer_id VARCHAR(255),
  order_id VARCHAR(255),
  used_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (con manejo de errores)
DO $$ 
BEGIN
  -- Branches
  DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
  CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- Appointments
  DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
  CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- Availability
  DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
  CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- FF Groups
  DROP TRIGGER IF EXISTS update_ff_groups_updated_at ON ff_groups;
  CREATE TRIGGER update_ff_groups_updated_at BEFORE UPDATE ON ff_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- FF Members
  DROP TRIGGER IF EXISTS update_ff_members_updated_at ON ff_group_members;
  CREATE TRIGGER update_ff_members_updated_at BEFORE UPDATE ON ff_group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- FF Config
  DROP TRIGGER IF EXISTS update_ff_config_updated_at ON ff_discount_config;
  CREATE TRIGGER update_ff_config_updated_at BEFORE UPDATE ON ff_discount_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating triggers: %', SQLERRM;
END $$;

-- Función para actualizar current_members cuando se agrega/elimina un miembro
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
      SET current_members = GREATEST(current_members - 1, 1) 
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE ff_groups 
    SET current_members = GREATEST(current_members - 1, 1) 
    WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger para member count
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_member_count_trigger ON ff_group_members;
  CREATE TRIGGER update_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ff_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating member count trigger: %', SQLERRM;
END $$;

-- ============================================
-- ÍNDICES (con verificación de existencia de columnas)
-- ============================================

-- Índices para Appointments
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'merchant_id') THEN
      CREATE INDEX IF NOT EXISTS idx_appointments_merchant ON appointments(merchant_id);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(branch_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(customer_email);
    CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(shopify_customer_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating appointment indexes: %', SQLERRM;
END $$;

-- Índices para Availability
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availability_slots') THEN
    CREATE INDEX IF NOT EXISTS idx_availability_branch ON availability_slots(branch_id);
    CREATE INDEX IF NOT EXISTS idx_availability_day ON availability_slots(day_of_week);
    CREATE INDEX IF NOT EXISTS idx_availability_active ON availability_slots(is_active);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating availability indexes: %', SQLERRM;
END $$;

-- Índices para Branches
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'merchant_id') THEN
      CREATE INDEX IF NOT EXISTS idx_branches_merchant ON branches(merchant_id);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating branch indexes: %', SQLERRM;
END $$;

-- Índices para Friends & Family
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ff_groups') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ff_groups' AND column_name = 'merchant_id') THEN
      CREATE INDEX IF NOT EXISTS idx_ff_groups_merchant ON ff_groups(merchant_id);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_ff_groups_owner ON ff_groups(owner_customer_id);
    CREATE INDEX IF NOT EXISTS idx_ff_groups_invite_code ON ff_groups(invite_code);
    CREATE INDEX IF NOT EXISTS idx_ff_groups_status ON ff_groups(status);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ff_groups indexes: %', SQLERRM;
END $$;

-- Índices para Group Members
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ff_group_members') THEN
    CREATE INDEX IF NOT EXISTS idx_ff_members_group ON ff_group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_ff_members_customer ON ff_group_members(customer_id);
    CREATE INDEX IF NOT EXISTS idx_ff_members_email ON ff_group_members(email);
    CREATE INDEX IF NOT EXISTS idx_ff_members_status ON ff_group_members(status);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ff_members indexes: %', SQLERRM;
END $$;

-- Índices para Invitations
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ff_invitations') THEN
    CREATE INDEX IF NOT EXISTS idx_ff_invitations_group ON ff_invitations(group_id);
    CREATE INDEX IF NOT EXISTS idx_ff_invitations_token ON ff_invitations(token);
    CREATE INDEX IF NOT EXISTS idx_ff_invitations_email ON ff_invitations(email);
    CREATE INDEX IF NOT EXISTS idx_ff_invitations_status ON ff_invitations(status);
    CREATE INDEX IF NOT EXISTS idx_ff_invitations_expires ON ff_invitations(expires_at);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ff_invitations indexes: %', SQLERRM;
END $$;

-- Índices para Discount Config
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ff_discount_config') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ff_discount_config' AND column_name = 'merchant_id') THEN
      CREATE INDEX IF NOT EXISTS idx_ff_config_merchant ON ff_discount_config(merchant_id);
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ff_config indexes: %', SQLERRM;
END $$;

-- Índices para Code Usage
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ff_code_usage') THEN
    CREATE INDEX IF NOT EXISTS idx_ff_code_usage_group ON ff_code_usage(group_id);
    CREATE INDEX IF NOT EXISTS idx_ff_code_usage_code ON ff_code_usage(invite_code);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ff_code_usage indexes: %', SQLERRM;
END $$;

