-- Script para investigar el producto problemático específico
-- Ejecutar este script en Supabase SQL Editor

-- 1. Ver el producto problemático específico
SELECT 
    p.id,
    p.name as producto,
    p.brand as marca_actual,
    p.brand_id,
    b.name as marca_en_brands,
    b.id as brand_id_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Verificar si el brand_id existe en la tabla brands
SELECT 
    'Verificando brand_id en brands' as status,
    COUNT(*) as existe_en_brands
FROM brands 
WHERE id = (
    SELECT brand_id 
    FROM products 
    WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 1
);

-- 3. Ver todas las marcas disponibles
SELECT 
    'Marcas disponibles' as status,
    id,
    name
FROM brands 
ORDER BY name;

-- 4. Intentar corregir manualmente el producto problemático
UPDATE products 
SET brand = (
    SELECT b.name 
    FROM brands b 
    WHERE b.id = products.brand_id
)
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND brand_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM brands b WHERE b.id = products.brand_id
  );

-- 5. Verificar el resultado después de la corrección manual
SELECT 
    p.name as producto,
    p.brand as marca_corregida,
    p.brand_id,
    b.name as marca_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 6. Si aún hay problemas, mostrar el UUID específico
SELECT 
    'UUID problemático' as status,
    brand as uuid_problematico
FROM products 
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; 