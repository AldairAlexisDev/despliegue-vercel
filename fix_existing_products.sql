-- Script para corregir productos existentes que tienen UUID en la columna brand
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar productos problemáticos
SELECT 
    'Productos con UUID en brand' as status,
    COUNT(*) as total_problematic
FROM products 
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Mostrar productos problemáticos
SELECT 
    p.name as producto,
    p.brand as marca_actual,
    p.brand_id,
    b.name as marca_correcta
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Corregir productos que tienen UUID en la columna brand
UPDATE products 
SET brand = (
    SELECT b.name 
    FROM brands b 
    WHERE b.id = products.brand_id
)
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND brand_id IS NOT NULL;

-- 4. Verificar el resultado
SELECT 
    'Productos corregidos' as status,
    COUNT(*) as total_corrected
FROM products 
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 5. Mostrar productos después de la corrección
SELECT 
    p.name as producto,
    p.brand as marca_corregida,
    p.brand_id,
    b.name as marca_en_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 10;

-- 6. Verificar que no queden productos con UUID en brand
SELECT 
    'Productos restantes con UUID en brand' as status,
    COUNT(*) as remaining_problematic
FROM products 
WHERE brand ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; 