-- Consulta para calcular el stock inicial aproximado del producto "nn-sb34hm"

-- 1. Obtener información actual del producto
SELECT 
    'INFORMACIÓN ACTUAL DEL PRODUCTO' as tipo_info,
    id,
    name,
    brand,
    model,
    stock as stock_actual,
    created_at as fecha_creacion
FROM products 
WHERE LOWER(model) LIKE '%nn-sb34hm%';

-- 2. Calcular movimientos totales
WITH producto_info AS (
    SELECT id, name, brand, model, stock
    FROM products 
    WHERE LOWER(model) LIKE '%nn-sb34hm%'
),
movimientos AS (
    SELECT 
        o.type as tipo_transaccion,
        oi.quantity,
        CASE 
            WHEN o.type = 'venta' THEN -oi.quantity
            WHEN o.type = 'compra' THEN oi.quantity
            WHEN o.type = 'prestamo' AND o.prestamo_tipo = 'yo_presto' THEN -oi.quantity
            WHEN o.type = 'prestamo' AND o.prestamo_tipo = 'me_prestan' THEN oi.quantity
            WHEN o.type = 'devolucion' AND o.devolucion_tipo = 'yo_devuelvo' THEN -oi.quantity
            WHEN o.type = 'devolucion' AND o.devolucion_tipo = 'me_devuelven' THEN oi.quantity
            WHEN o.type = 'pase' AND o.pase_tipo = 'yo_pase' THEN -oi.quantity
            WHEN o.type = 'pase' AND o.pase_tipo = 'me_pasen' THEN oi.quantity
            ELSE 0
        END as movimiento_stock
    FROM producto_info pi
    JOIN order_items oi ON pi.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
)
SELECT 
    'CÁLCULO DE STOCK INICIAL' as tipo_info,
    SUM(CASE WHEN movimiento_stock > 0 THEN movimiento_stock ELSE 0 END) as total_entradas,
    SUM(CASE WHEN movimiento_stock < 0 THEN ABS(movimiento_stock) ELSE 0 END) as total_salidas,
    SUM(movimiento_stock) as movimiento_neto,
    (SELECT stock FROM producto_info) as stock_actual,
    (SELECT stock FROM producto_info) - SUM(movimiento_stock) as stock_inicial_calculado
FROM movimientos;

-- 3. Detalle de todos los movimientos en orden cronológico
WITH producto_info AS (
    SELECT id, name, brand, model, stock
    FROM products 
    WHERE LOWER(model) LIKE '%nn-sb34hm%'
)
SELECT 
    'HISTORIAL CRONOLÓGICO' as tipo_info,
    o.numero_pedido,
    o.type as tipo_transaccion,
    o.fecha_pedido,
    oi.quantity as cantidad,
    CASE 
        WHEN o.type = 'venta' THEN -oi.quantity
        WHEN o.type = 'compra' THEN oi.quantity
        WHEN o.type = 'prestamo' AND o.prestamo_tipo = 'yo_presto' THEN -oi.quantity
        WHEN o.type = 'prestamo' AND o.prestamo_tipo = 'me_prestan' THEN oi.quantity
        WHEN o.type = 'devolucion' AND o.devolucion_tipo = 'yo_devuelvo' THEN -oi.quantity
        WHEN o.type = 'devolucion' AND o.devolucion_tipo = 'me_devuelven' THEN oi.quantity
        WHEN o.type = 'pase' AND o.pase_tipo = 'yo_pase' THEN -oi.quantity
        WHEN o.type = 'pase' AND o.pase_tipo = 'me_pasen' THEN oi.quantity
        ELSE 0
    END as movimiento_stock,
    oi.unit_price as precio_unitario,
    oi.total_price as total_item
FROM producto_info pi
JOIN order_items oi ON pi.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
ORDER BY o.fecha_pedido ASC, o.created_at ASC;
