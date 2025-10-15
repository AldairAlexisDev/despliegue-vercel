-- Consulta completa para buscar TODOS los registros relacionados con el modelo "nn-sb34hm"
-- Incluye: ventas, compras, préstamos, pases, devoluciones, ediciones, eliminaciones

-- 1. PRIMERO: Buscar el producto por modelo (exacto o similar)
SELECT 
    'PRODUCTO ENCONTRADO' as tipo_registro,
    id,
    name,
    brand,
    model,
    stock as stock_actual,
    created_at as fecha_creacion,
    'ACTIVO' as estado
FROM products 
WHERE LOWER(model) LIKE '%nn-sb34hm%'
ORDER BY created_at DESC;

-- 2. BUSCAR EN NOTAS DE PEDIDO (ORDERS) - Todas las transacciones
WITH producto_info AS (
    SELECT id, name, brand, model, stock
    FROM products 
    WHERE LOWER(model) LIKE '%nn-sb34hm%'
)
SELECT 
    'TRANSACCIÓN EN NOTA DE PEDIDO' as tipo_registro,
    o.id as order_id,
    o.numero_pedido,
    o.type as tipo_transaccion,
    o.prestamo_tipo,
    o.devolucion_tipo,
    o.pase_tipo,
    o.fecha_pedido,
    o.created_at as fecha_creacion_nota,
    oi.quantity as cantidad,
    oi.unit_price as precio_unitario,
    oi.total_price as total_item,
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
    p.name as partner_name,
    p.type as partner_type,
    u.email as usuario_creador
FROM producto_info pi
JOIN order_items oi ON pi.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN auth.users u ON o.created_by = u.id
ORDER BY o.fecha_pedido DESC, o.created_at DESC;

-- 3. RESUMEN POR TIPO DE TRANSACCIÓN
WITH producto_info AS (
    SELECT id, name, brand, model, stock
    FROM products 
    WHERE LOWER(model) LIKE '%nn-sb34hm%'
),
movimientos AS (
    SELECT 
        o.type as tipo_transaccion,
        o.prestamo_tipo,
        o.devolucion_tipo,
        o.pase_tipo,
        o.numero_pedido,
        o.fecha_pedido,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
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
    'RESUMEN POR TIPO' as tipo_registro,
    tipo_transaccion,
    prestamo_tipo,
    devolucion_tipo,
    pase_tipo,
    COUNT(*) as total_transacciones,
    SUM(quantity) as total_cantidad_movida,
    SUM(movimiento_stock) as total_movimiento_stock,
    SUM(CASE WHEN movimiento_stock > 0 THEN movimiento_stock ELSE 0 END) as entradas_stock,
    SUM(CASE WHEN movimiento_stock < 0 THEN ABS(movimiento_stock) ELSE 0 END) as salidas_stock,
    SUM(total_price) as total_valor_transacciones,
    AVG(unit_price) as precio_promedio
FROM movimientos
GROUP BY tipo_transaccion, prestamo_tipo, devolucion_tipo, pase_tipo
ORDER BY tipo_transaccion;

-- 4. DETALLE CRONOLÓGICO DE TODAS LAS TRANSACCIONES
WITH producto_info AS (
    SELECT id, name, brand, model, stock
    FROM products 
    WHERE LOWER(model) LIKE '%nn-sb34hm%'
)
SELECT 
    'DETALLE CRONOLÓGICO' as tipo_registro,
    o.numero_pedido,
    o.type as tipo_transaccion,
    CASE 
        WHEN o.type = 'prestamo' THEN 
            CASE WHEN o.prestamo_tipo = 'yo_presto' THEN 'Yo Presto' ELSE 'Me Prestan' END
        WHEN o.type = 'devolucion' THEN 
            CASE WHEN o.devolucion_tipo = 'yo_devuelvo' THEN 'Yo Devuelvo' ELSE 'Me Devuelven' END
        WHEN o.type = 'pase' THEN 
            CASE WHEN o.pase_tipo = 'yo_pase' THEN 'Yo Pase' ELSE 'Me Pasen' END
        ELSE UPPER(o.type)
    END as descripcion_tipo,
    o.fecha_pedido,
    o.created_at as fecha_creacion,
    oi.quantity as cantidad,
    oi.unit_price as precio_unitario,
    oi.total_price as total_item,
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
    p.name as partner_cliente,
    p.type as tipo_partner,
    u.email as usuario_responsable
FROM producto_info pi
JOIN order_items oi ON pi.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN auth.users u ON o.created_by = u.id
ORDER BY o.fecha_pedido DESC, o.created_at DESC;

-- 5. BÚSQUEDA ALTERNATIVA: Si no encuentra con "nn-sb34hm", buscar variaciones
SELECT 
    'BÚSQUEDA ALTERNATIVA' as tipo_registro,
    id,
    name,
    brand,
    model,
    stock,
    created_at,
    CASE 
        WHEN LOWER(model) LIKE '%nn%' AND LOWER(model) LIKE '%sb%' AND LOWER(model) LIKE '%34%' THEN 'POSIBLE COINCIDENCIA'
        WHEN LOWER(model) LIKE '%nn-sb%' THEN 'COINCIDENCIA PARCIAL'
        ELSE 'NO COINCIDE'
    END as nivel_coincidencia
FROM products 
WHERE LOWER(model) LIKE '%nn%' 
   OR LOWER(model) LIKE '%sb%'
   OR LOWER(model) LIKE '%34%'
   OR LOWER(model) LIKE '%hm%'
ORDER BY 
    CASE 
        WHEN LOWER(model) LIKE '%nn-sb34hm%' THEN 1
        WHEN LOWER(model) LIKE '%nn-sb%' THEN 2
        WHEN LOWER(model) LIKE '%nn%' AND LOWER(model) LIKE '%sb%' THEN 3
        ELSE 4
    END,
    created_at DESC;
