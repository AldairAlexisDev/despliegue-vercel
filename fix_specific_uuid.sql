-- Script para corregir específicamente el UUID problemático
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar si el UUID existe en brands
SELECT 
    'Verificando UUID en brands' as status,
    id,
    name
FROM brands 
WHERE id = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 2. Ver el producto problemático completo
SELECT 
    p.id,
    p.name as producto,
    p.brand as marca_actual,
    p.brand_id,
    p.model,
    p.stock
FROM products p
WHERE p.brand = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 3. Si el UUID no existe en brands, crear la marca LG
INSERT INTO brands (id, name) 
VALUES ('16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1', 'LG')
ON CONFLICT (id) DO NOTHING;

-- 4. Corregir el producto específico
UPDATE products 
SET brand = 'LG'
WHERE brand = '16e1c1ba-6ae4-4009-b8b9-5e0ab3e94eb1';

-- 5. Verificar el resultado
SELECT 
    p.name as producto,
    p.brand as marca_corregida,
    p.brand_id,
    b.name as marca_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.name = 'Televisor LG 50" 50UA7300';

-- 6. Verificar que no queden productos con UUID
SELECT 
    'Productos restantes con UUID' as status,
    COUNT(*) as total
FROM products 
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; 