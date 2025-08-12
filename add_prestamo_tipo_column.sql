-- Script para agregar la columna prestamo_tipo a la tabla orders
-- Esta columna almacenará 'yo_presto' o 'me_prestan' para transacciones de préstamo

-- Agregar la columna prestamo_tipo
ALTER TABLE orders 
ADD COLUMN prestamo_tipo TEXT CHECK (prestamo_tipo IN ('yo_presto', 'me_prestan'));

-- Agregar comentario a la columna
COMMENT ON COLUMN orders.prestamo_tipo IS 'Tipo de préstamo: yo_presto (disminuye stock) o me_prestan (aumenta stock)';

-- Crear índice para mejorar consultas por tipo de préstamo
CREATE INDEX idx_orders_prestamo_tipo ON orders(prestamo_tipo) WHERE prestamo_tipo IS NOT NULL;

-- Actualizar RLS para incluir la nueva columna
-- (Las políticas existentes deberían funcionar automáticamente)

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'prestamo_tipo'; 