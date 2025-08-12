-- Script para corregir la tabla brands
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar el problema en brands
SELECT 
    'Marcas problemáticas' as status,
    id,
    name
FROM brands 
WHERE id = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 2. Verificar si ya existe LG con un ID diferente
SELECT 
    'Marcas LG existentes' as status,
    id,
    name
FROM brands 
WHERE name = 'LG';

-- 3. Verificar productos que usan el UUID problemático
SELECT 
    p.name as producto,
    p.brand,
    p.brand_id
FROM products p
WHERE p.brand_id = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 4. Obtener el ID correcto de LG (si existe)
SELECT 
    'ID correcto de LG' as status,
    id as lg_id
FROM brands 
WHERE name = 'LG' 
  AND id != '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1'
LIMIT 1;

-- 5. Actualizar productos para usar el ID correcto de LG
UPDATE products 
SET brand_id = (
    SELECT id 
    FROM brands 
    WHERE name = 'LG' 
      AND id != '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1'
    LIMIT 1
)
WHERE brand_id = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 6. Eliminar la marca problemática
DELETE FROM brands 
WHERE id = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 7. Verificar el resultado
SELECT 
    'Marcas después de la corrección' as status,
    id,
    name
FROM brands 
ORDER BY name;

-- 8. Verificar productos después de la corrección
SELECT 
    p.name as producto,
    p.brand,
    p.brand_id,
    b.name as marca_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.name = 'Televisor LG 50" 50UA7300'; 