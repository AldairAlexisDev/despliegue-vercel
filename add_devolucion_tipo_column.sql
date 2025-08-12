-- Script para agregar la columna devolucion_tipo a la tabla orders
-- Esta columna almacenará 'yo_devuelvo' o 'me_devuelven' para transacciones de devolución

-- Agregar la columna devolucion_tipo
ALTER TABLE orders
ADD COLUMN devolucion_tipo TEXT CHECK (devolucion_tipo IN ('yo_devuelvo', 'me_devuelven'));

-- Agregar comentario a la columna
COMMENT ON COLUMN orders.devolucion_tipo IS 'Tipo de devolución: yo_devuelvo (aumenta stock) o me_devuelven (disminuye stock)';

-- Crear índice para mejorar consultas por tipo de devolución
CREATE INDEX idx_orders_devolucion_tipo ON orders(devolucion_tipo) WHERE devolucion_tipo IS NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'devolucion_tipo'; 