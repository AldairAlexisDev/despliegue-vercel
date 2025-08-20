-- Script para corregir stock negativo de productos
-- Ejecutar este script en tu base de datos Supabase para corregir productos con stock negativo

-- 1. Ver productos con stock negativo
SELECT 
    id,
    name,
    brand,
    model,
    stock,
    CASE 
        WHEN stock < 0 THEN 'STOCK NEGATIVO - REQUIERE CORRECCIÓN'
        WHEN stock = 0 THEN 'SIN STOCK'
        ELSE 'STOCK NORMAL'
    END as estado_stock
FROM products 
WHERE stock < 0
ORDER BY stock ASC;

-- 2. Corregir stock negativo (establecer en 0 o un valor positivo)
-- IMPORTANTE: Revisa cada producto y decide el stock correcto
UPDATE products 
SET stock = 0 
WHERE stock < 0;

-- 3. Verificar que se corrigió
SELECT 
    id,
    name,
    brand,
    model,
    stock,
    CASE 
        WHEN stock < 0 THEN 'STOCK NEGATIVO'
        WHEN stock = 0 THEN 'SIN STOCK'
        ELSE 'STOCK NORMAL'
    END as estado_stock
FROM products 
ORDER BY stock ASC;

-- 4. Crear un trigger para prevenir stock negativo en el futuro
-- (Opcional - solo si quieres prevenir futuros problemas)

-- Función para validar stock
CREATE OR REPLACE FUNCTION check_stock_positive()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock < 0 THEN
        RAISE EXCEPTION 'El stock no puede ser negativo. Producto: %', NEW.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar stock antes de insertar/actualizar
DROP TRIGGER IF EXISTS prevent_negative_stock ON products;
CREATE TRIGGER prevent_negative_stock
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_positive();
