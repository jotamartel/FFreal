-- Migration: Add Users Table and Update Group Members for Authentication
-- STANDALONE VERSION - Safe to run even if main schema has issues
-- This version only creates the users table and adds columns safely

-- ============================================
-- USER AUTHENTICATION SYSTEM
-- ============================================

-- Tabla de usuarios (para autenticación)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  shopify_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at en users (con manejo de errores)
DO $$ 
BEGIN
  -- Eliminar trigger si existe
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  
  -- Crear trigger
  CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, solo loguear (no detener la ejecución)
    RAISE NOTICE 'Could not create trigger: %', SQLERRM;
END $$;

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_shopify_customer ON users(shopify_customer_id);

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES (Safe)
-- ============================================

-- Agregar user_id a ff_group_members (solo si la tabla existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_group_members'
  ) THEN
    -- Agregar columna si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ff_group_members' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE ff_group_members 
      ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
      
      -- Crear índice
      CREATE INDEX IF NOT EXISTS idx_ff_members_user ON ff_group_members(user_id);
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add user_id to ff_group_members: %', SQLERRM;
END $$;

-- Agregar owner_user_id a ff_groups (solo si la tabla existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_groups'
  ) THEN
    -- Agregar columna si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ff_groups' 
      AND column_name = 'owner_user_id'
    ) THEN
      ALTER TABLE ff_groups 
      ADD COLUMN owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add owner_user_id to ff_groups: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verificar que la tabla users fue creada
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    RAISE NOTICE '✅ Table "users" created successfully';
  ELSE
    RAISE WARNING '❌ Table "users" was not created';
  END IF;
END $$;

