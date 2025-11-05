-- Migration: Add Users Table and Update Group Members for Authentication
-- Execute this in Supabase SQL Editor after the main schema
-- IMPORTANT: This assumes the main schema.sql has already been executed

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

-- Agregar user_id a ff_group_members (si la tabla existe y la columna no existe)
DO $$ 
BEGIN
  -- Verificar que la tabla existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ff_group_members'
  ) THEN
    -- Agregar columna si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ff_group_members' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE ff_group_members 
      ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Agregar owner_user_id a ff_groups (si la tabla existe y la columna no existe)
DO $$ 
BEGIN
  -- Verificar que la tabla existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ff_groups'
  ) THEN
    -- Agregar columna si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ff_groups' AND column_name = 'owner_user_id'
    ) THEN
      ALTER TABLE ff_groups 
      ADD COLUMN owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_shopify_customer ON users(shopify_customer_id);

-- Índice para user_id en group_members (solo si la tabla existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ff_group_members'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ff_members_user ON ff_group_members(user_id);
  END IF;
END $$;

-- Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at en users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

