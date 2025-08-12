-- Script para verificar y corregir los datos de marcas
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar el estado actual de los datos
SELECT 
    'Estado actual de productos' as status,
    COUNT(*) as total_products,
    COUNT(brand_id) as products_with_brand_id,
    COUNT(*) - COUNT(brand_id) as products_without_brand_id
FROM products;

-- 2. Verificar marcas existentes
SELECT 
    'Marcas disponibles' as status,
    COUNT(*) as total_brands,
    STRING_AGG(name, ', ') as brand_names
FROM brands;

-- 3. Mostrar productos con sus marcas actuales
SELECT 
    p.name as producto,
    p.brand as marca_original,
    p.brand_id,
    b.name as marca_nueva
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 10;

-- 4. Corregir productos que no tienen brand_id asignado
-- Primero, migrar marcas que no existen en la tabla brands
INSERT INTO brands (name)
SELECT DISTINCT brand 
FROM products 
WHERE brand IS NOT NULL 
  AND brand != '' 
  AND brand_id IS NULL
  AND brand NOT IN (SELECT name FROM brands)
ON CONFLICT (name) DO NOTHING;

-- 5. Actualizar brand_id para productos que no lo tienen
UPDATE products 
SET brand_id = (
    SELECT id 
    FROM brands 
    WHERE brands.name = products.brand
)
WHERE brand IS NOT NULL 
  AND brand != '' 
  AND brand_id IS NULL;

-- 6. Verificar el resultado después de la corrección
SELECT 
    'Estado después de corrección' as status,
    COUNT(*) as total_products,
    COUNT(brand_id) as products_with_brand_id,
    COUNT(*) - COUNT(brand_id) as products_without_brand_id
FROM products;

-- 7. Mostrar productos corregidos
SELECT 
    p.name as producto,
    p.brand as marca_original,
    p.brand_id,
    b.name as marca_nueva
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 10;

-- 8. Función para obtener el nombre de marca de un producto
CREATE OR REPLACE FUNCTION get_product_brand_name(product_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT b.name 
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = product_id
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Ejemplo de uso de la función
SELECT 
    p.name as producto,
    get_product_brand_name(p.id) as nombre_marca
FROM products p
LIMIT 5; 