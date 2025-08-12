-- Script para actualizar la restricción orders_type_check para incluir 'pase'
-- Este script elimina la restricción existente y crea una nueva que incluye 'pase'

-- Primero, eliminamos la restricción existente
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_type_check;

-- Luego, creamos la nueva restricción que incluye 'pase'
ALTER TABLE orders 
ADD CONSTRAINT orders_type_check 
CHECK (type IN ('venta', 'compra', 'prestamo', 'devolucion', 'pase'));

-- Verificamos que la restricción se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'orders_type_check'; 