-- Script para corregir la marca que tiene UUID como nombre
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar la marca problemática
SELECT 
    'Marca problemática' as status,
    id,
    name
FROM brands 
WHERE name = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 2. Verificar si ya existe LG con nombre correcto
SELECT 
    'Marcas LG existentes' as status,
    id,
    name
FROM brands 
WHERE name = 'LG';

-- 3. Corregir el nombre de la marca problemática
UPDATE brands 
SET name = 'LG'
WHERE name = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 4. Verificar el resultado
SELECT 
    'Marcas después de la corrección' as status,
    id,
    name
FROM brands 
WHERE name = 'LG';

-- 5. Verificar productos después de la corrección
SELECT 
    p.name as producto,
    p.brand,
    p.brand_id,
    b.name as marca_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.name = 'Televisor LG 50" 50UA7300';

-- 6. Verificar que no queden marcas con UUID como nombre
SELECT 
    'Marcas con UUID como nombre' as status,
    COUNT(*) as total
FROM brands 
WHERE name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 7. Mostrar todas las marcas para verificar
SELECT 
    'Todas las marcas' as status,
    id,
    name
FROM brands 
ORDER BY name; 