-- Script para agregar la columna pase_tipo a la tabla orders
-- Esta columna almacenará 'yo_pase' o 'me_pasen' para transacciones de pase

-- Agregar la columna pase_tipo
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pase_tipo TEXT CHECK (pase_tipo IN ('yo_pase', 'me_pasen'));

-- Agregar comentario a la columna
COMMENT ON COLUMN orders.pase_tipo IS 'Tipo de pase: yo_pase (disminuye stock) o me_pasen (aumenta stock)';

-- Crear índice para mejorar consultas por tipo de pase
CREATE INDEX IF NOT EXISTS idx_orders_pase_tipo ON orders(pase_tipo) WHERE pase_tipo IS NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'pase_tipo'; 