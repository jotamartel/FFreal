-- Script para agregar columna user_id a ff_group_members
-- Ejecuta esto en Supabase SQL Editor

-- Verificar y agregar user_id a ff_group_members si no existe
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
      
      RAISE NOTICE 'Columna user_id agregada a ff_group_members';
    ELSE
      RAISE NOTICE 'Columna user_id ya existe en ff_group_members';
    END IF;
  ELSE
    RAISE NOTICE 'Tabla ff_group_members no existe';
  END IF;
END $$;

-- Verificar y agregar owner_user_id a ff_groups si no existe
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
      
      RAISE NOTICE 'Columna owner_user_id agregada a ff_groups';
    ELSE
      RAISE NOTICE 'Columna owner_user_id ya existe en ff_groups';
    END IF;
  ELSE
    RAISE NOTICE 'Tabla ff_groups no existe';
  END IF;
END $$;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_ff_members_user ON ff_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ff_groups_owner_user ON ff_groups(owner_user_id);

-- Verificar resultado
SELECT 
  'ff_group_members' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ff_group_members' AND column_name IN ('user_id', 'customer_id')
UNION ALL
SELECT 
  'ff_groups' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ff_groups' AND column_name IN ('owner_user_id', 'owner_customer_id');

