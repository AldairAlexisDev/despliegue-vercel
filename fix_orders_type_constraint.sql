-- Script para actualizar la restricción de la tabla orders
-- para permitir el tipo 'devolucion' además de los tipos existentes

-- Primero, eliminar la restricción existente
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check;

-- Luego, agregar la nueva restricción que incluye 'devolucion'
ALTER TABLE orders ADD CONSTRAINT orders_type_check 
CHECK (type IN ('venta', 'compra', 'prestamo', 'devolucion'));

-- Verificar que la restricción se aplicó correctamente
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'orders_type_check';

-- Verificar los valores permitidos actuales
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'type'; 