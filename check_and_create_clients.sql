-- Script para verificar y crear clientes de ejemplo
-- Este script ayuda a diagnosticar por qué no aparecen clientes en el dropdown

-- 1. Verificar la estructura de la tabla partners
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partners' 
ORDER BY ordinal_position;

-- 2. Verificar si hay clientes en la tabla
SELECT 
    id,
    name,
    type,
    contact,
    created_at
FROM partners 
WHERE type = 'cliente'
ORDER BY name;

-- 3. Verificar el total de partners por tipo
SELECT 
    type,
    COUNT(*) as total
FROM partners 
GROUP BY type
ORDER BY type;

-- 4. Si no hay clientes, crear algunos de ejemplo
INSERT INTO partners (name, type, contact, created_at)
SELECT 
    'Cliente Ejemplo 1',
    'cliente',
    'cliente1@ejemplo.com',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM partners WHERE type = 'cliente' LIMIT 1
);

INSERT INTO partners (name, type, contact, created_at)
SELECT 
    'Cliente Ejemplo 2',
    'cliente',
    'cliente2@ejemplo.com',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM partners WHERE type = 'cliente' AND name = 'Cliente Ejemplo 2'
);

INSERT INTO partners (name, type, contact, created_at)
SELECT 
    'Cliente Ejemplo 3',
    'cliente',
    'cliente3@ejemplo.com',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM partners WHERE type = 'cliente' AND name = 'Cliente Ejemplo 3'
);

-- 5. Verificar permisos del usuario actual
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'partners';

-- 6. Verificar el resultado final
SELECT 
    'RESULTADO FINAL' as status,
    COUNT(*) as total_partners,
    COUNT(CASE WHEN type = 'cliente' THEN 1 END) as total_clientes,
    COUNT(CASE WHEN type = 'proveedor' THEN 1 END) as total_proveedores
FROM partners;
