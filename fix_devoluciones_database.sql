-- Script completo para arreglar las devoluciones en la base de datos
-- Este script actualiza la restricción de tipos y agrega la columna devolucion_tipo

-- 1. Actualizar la restricción de tipos para permitir 'devolucion'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check;

ALTER TABLE orders ADD CONSTRAINT orders_type_check 
CHECK (type IN ('venta', 'compra', 'prestamo', 'devolucion', 'pase'));

-- 2. Agregar la columna devolucion_tipo
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS devolucion_tipo TEXT CHECK (devolucion_tipo IN ('yo_devuelvo', 'me_devuelven'));

-- 3. Agregar comentario a la columna
COMMENT ON COLUMN orders.devolucion_tipo IS 'Tipo de devolución: yo_devuelvo (aumenta stock) o me_devuelven (disminuye stock)';

-- 4. Crear índice para mejorar consultas por tipo de devolución
CREATE INDEX IF NOT EXISTS idx_orders_devolucion_tipo ON orders(devolucion_tipo) WHERE devolucion_tipo IS NOT NULL;

-- 5. Verificar que todo se aplicó correctamente
SELECT 
    'orders_type_check' as constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'orders_type_check'

UNION ALL

SELECT 
    'devolucion_tipo column' as constraint_name,
    'Column added successfully' as check_clause
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'devolucion_tipo';

-- 6. Mostrar los valores permitidos actuales para el tipo
SELECT 
    'Allowed types' as info,
    'venta, compra, prestamo, devolucion, pase' as values; 