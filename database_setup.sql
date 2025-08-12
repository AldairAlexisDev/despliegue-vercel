-- Script para crear la tabla de marcas y modificar la tabla de productos
-- Ejecutar este script en tu base de datos Supabase

-- 1. Crear la tabla brands (marcas)
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar comentarios a la tabla brands
COMMENT ON TABLE brands IS 'Tabla para almacenar las marcas de productos';
COMMENT ON COLUMN brands.id IS 'Identificador único de la marca';
COMMENT ON COLUMN brands.name IS 'Nombre de la marca';
COMMENT ON COLUMN brands.created_at IS 'Fecha de creación del registro';

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);

-- 4. Agregar algunas marcas de ejemplo
INSERT INTO brands (name) VALUES 
    ('Samsung'),
    ('Apple'),
    ('HP'),
    ('Dell'),
    ('Lenovo'),
    ('Asus'),
    ('Acer'),
    ('Microsoft'),
    ('Sony'),
    ('LG')
ON CONFLICT (name) DO NOTHING;

-- 5. Crear la nueva columna brand_id en la tabla products
-- (Mantener la columna brand original por compatibilidad durante la migración)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- 6. Crear índice para la nueva columna brand_id
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- 6.1. Políticas de seguridad para la tabla products
-- Habilitar RLS en la tabla products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados (admin y vendedor)
CREATE POLICY "Permitir lectura de productos a todos los usuarios" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción SOLO a administradores
CREATE POLICY "Permitir inserción de productos solo a administradores" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir actualización SOLO a administradores
CREATE POLICY "Permitir actualización de productos solo a administradores" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir eliminación SOLO a administradores
CREATE POLICY "Permitir eliminación de productos solo a administradores" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 7. Función para migrar datos existentes (opcional)
-- Esta función migra las marcas existentes en la columna 'brand' a la nueva estructura
CREATE OR REPLACE FUNCTION migrate_brands()
RETURNS void AS $$
DECLARE
    product_record RECORD;
    brand_record RECORD;
BEGIN
    -- Para cada producto con marca existente
    FOR product_record IN 
        SELECT DISTINCT brand 
        FROM products 
        WHERE brand IS NOT NULL AND brand != ''
    LOOP
        -- Buscar si la marca ya existe en brands
        SELECT * INTO brand_record 
        FROM brands 
        WHERE name = product_record.brand;
        
        -- Si no existe, crearla
        IF brand_record IS NULL THEN
            INSERT INTO brands (name) 
            VALUES (product_record.brand) 
            RETURNING * INTO brand_record;
        END IF;
        
        -- Actualizar los productos con la nueva brand_id
        UPDATE products 
        SET brand_id = brand_record.id 
        WHERE brand = product_record.brand;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Ejecutar la migración (descomenta la línea siguiente si quieres migrar datos existentes)
-- SELECT migrate_brands();

-- 9. Políticas de seguridad RLS (Row Level Security) para Supabase
-- Habilitar RLS en la tabla brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados (admin y vendedor)
CREATE POLICY "Permitir lectura de marcas a todos los usuarios" ON brands
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción SOLO a administradores
CREATE POLICY "Permitir inserción de marcas solo a administradores" ON brands
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir actualización SOLO a administradores
CREATE POLICY "Permitir actualización de marcas solo a administradores" ON brands
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir eliminación SOLO a administradores
CREATE POLICY "Permitir eliminación de marcas solo a administradores" ON brands
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 10. Función para obtener el nombre de la marca desde brand_id
CREATE OR REPLACE FUNCTION get_brand_name(brand_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT name FROM brands WHERE id = brand_uuid);
END;
$$ LANGUAGE plpgsql;

-- 10.1. Función para verificar si el usuario actual es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.2. Función para verificar si el usuario actual es vendedor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'vendedor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vista para productos con información de marca
CREATE OR REPLACE VIEW products_with_brands AS
SELECT 
    p.id,
    p.name,
    p.has_series,
    p.stock,
    p.brand,
    p.model,
    p.created_at,
    p.brand_id,
    b.name as brand_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id;

-- Comentarios finales
COMMENT ON FUNCTION migrate_brands() IS 'Función para migrar marcas existentes de la columna brand a la nueva estructura con brand_id';
COMMENT ON FUNCTION get_brand_name(UUID) IS 'Función para obtener el nombre de una marca por su ID';
COMMENT ON FUNCTION is_admin() IS 'Función para verificar si el usuario actual es administrador';
COMMENT ON FUNCTION is_vendor() IS 'Función para verificar si el usuario actual es vendedor';
COMMENT ON VIEW products_with_brands IS 'Vista que combina productos con información de marcas';

-- Comentarios sobre las políticas de seguridad
COMMENT ON POLICY "Permitir lectura de marcas a todos los usuarios" ON brands IS 'Permite a admin y vendedor ver las marcas';
COMMENT ON POLICY "Permitir inserción de marcas solo a administradores" ON brands IS 'Solo admin puede crear marcas';
COMMENT ON POLICY "Permitir actualización de marcas solo a administradores" ON brands IS 'Solo admin puede editar marcas';
COMMENT ON POLICY "Permitir eliminación de marcas solo a administradores" ON brands IS 'Solo admin puede eliminar marcas';

COMMENT ON POLICY "Permitir lectura de productos a todos los usuarios" ON products IS 'Permite a admin y vendedor ver productos (inventario)';
COMMENT ON POLICY "Permitir inserción de productos solo a administradores" ON products IS 'Solo admin puede crear productos';
COMMENT ON POLICY "Permitir actualización de productos solo a administradores" ON products IS 'Solo admin puede editar productos';
COMMENT ON POLICY "Permitir eliminación de productos solo a administradores" ON products IS 'Solo admin puede eliminar productos';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script ejecutado exitosamente. Tabla brands creada y configurada.';
    RAISE NOTICE 'Para migrar datos existentes, ejecuta: SELECT migrate_brands();';
END $$; 