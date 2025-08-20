-- Script para agregar la columna numero_pedido a la tabla orders
-- Ejecutar este script en tu base de datos Supabase

-- Agregar la columna numero_pedido a la tabla orders
ALTER TABLE orders 
ADD COLUMN numero_pedido VARCHAR(50);

-- Agregar un comentario descriptivo a la columna
COMMENT ON COLUMN orders.numero_pedido IS 'Número de pedido manual ingresado por el usuario';

-- Crear un índice para mejorar las búsquedas por número de pedido
CREATE INDEX idx_orders_numero_pedido ON orders(numero_pedido);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'numero_pedido';
