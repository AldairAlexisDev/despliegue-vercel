-- Script para migrar datos existentes de productos a la nueva estructura de marcas
-- Ejecutar DESPUÉS de ejecutar database_setup.sql

-- 1. Migrar marcas existentes de productos a la tabla brands
INSERT INTO brands (name)
SELECT DISTINCT brand 
FROM products 
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT (name) DO NOTHING;

-- 2. Actualizar la columna brand_id en productos con las marcas migradas
UPDATE products 
SET brand_id = (
    SELECT id 
    FROM brands 
    WHERE brands.name = products.brand
)
WHERE brand IS NOT NULL AND brand != '';

-- 3. Verificar la migración
SELECT 
    'Productos migrados' as status,
    COUNT(*) as total_products,
    COUNT(brand_id) as products_with_brand_id,
    COUNT(*) - COUNT(brand_id) as products_without_brand_id
FROM products;

-- 4. Mostrar marcas creadas
SELECT 
    'Marcas disponibles' as status,
    COUNT(*) as total_brands,
    STRING_AGG(name, ', ') as brand_names
FROM brands;

-- 5. Mostrar algunos productos de ejemplo con sus marcas
SELECT 
    p.name as producto,
    p.brand as marca_original,
    b.name as marca_nueva,
    p.brand_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 10;

-- 6. Función para limpiar marcas duplicadas (opcional)
CREATE OR REPLACE FUNCTION cleanup_duplicate_brands()
RETURNS void AS $$
DECLARE
    brand_record RECORD;
    duplicate_count INTEGER;
BEGIN
    -- Encontrar marcas duplicadas
    FOR brand_record IN 
        SELECT name, COUNT(*) as count
        FROM brands
        GROUP BY name
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Marca duplicada encontrada: % (count: %)', brand_record.name, brand_record.count;
        
        -- Mantener solo la primera ocurrencia y eliminar las demás
        DELETE FROM brands 
        WHERE name = brand_record.name 
        AND id NOT IN (
            SELECT id FROM brands 
            WHERE name = brand_record.name 
            ORDER BY created_at 
            LIMIT 1
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Ejecutar limpieza de duplicados (opcional)
-- SELECT cleanup_duplicate_brands();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Migración de datos completada.';
    RAISE NOTICE 'Verifica los resultados de las consultas anteriores.';
    RAISE NOTICE 'Si todo está correcto, puedes continuar usando la aplicación.';
END $$; 