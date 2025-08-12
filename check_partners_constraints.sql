-- Script para verificar las restricciones de la tabla partners
-- Ejecutar para ver qué valores están permitidos para la columna type

-- Verificar la estructura de la tabla partners
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partners' 
ORDER BY ordinal_position;

-- Verificar las restricciones de verificación
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'partners'::regclass 
  AND contype = 'c';

-- Verificar si hay algún enum o dominio para la columna type
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
  SELECT udt_name 
  FROM information_schema.columns 
  WHERE table_name = 'partners' AND column_name = 'type'
);

-- Verificar los valores actuales en la tabla partners
SELECT DISTINCT type FROM partners ORDER BY type; 