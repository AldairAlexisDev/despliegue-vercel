-- Script para agregar la columna fecha_pedido a la tabla orders
-- Esta columna permitirá a los usuarios seleccionar una fecha personalizada para sus pedidos

-- Agregar la columna fecha_pedido a la tabla orders
ALTER TABLE orders 
ADD COLUMN fecha_pedido TIMESTAMP WITH TIME ZONE;

-- Crear un índice para mejorar el rendimiento de las consultas por fecha
CREATE INDEX idx_orders_fecha_pedido ON orders(fecha_pedido);

-- Comentario sobre la nueva columna
COMMENT ON COLUMN orders.fecha_pedido IS 'Fecha personalizada seleccionada por el usuario para el pedido. Si es NULL, se usa created_at como fecha por defecto.';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'fecha_pedido';
