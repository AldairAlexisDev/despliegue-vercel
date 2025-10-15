-- CONSULTA SIMPLE: Buscar todos los registros del modelo "nn-sb34hm"
-- Ejecutar cada sección por separado en Supabase SQL Editor

-- PASO 1: Buscar el producto
SELECT 
    id,
    name,
    brand,
    model,
    stock,
    created_at
FROM products 
WHERE LOWER(model) LIKE '%nn-sb34hm%';

-- PASO 2: Si encontraste el producto, usa su ID en esta consulta
-- (Reemplaza 'PRODUCTO_ID_AQUI' con el ID real del producto)
SELECT 
    o.numero_pedido,
    o.type as tipo,
    o.fecha_pedido,
    oi.quantity as cantidad,
    oi.unit_price as precio,
    oi.total_price as total,
    p.name as cliente_proveedor,
    p.type as tipo_partner
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN partners p ON o.partner_id = p.id
WHERE oi.product_id = 'PRODUCTO_ID_AQUI'
ORDER BY o.fecha_pedido DESC;

-- PASO 3: Resumen de movimientos
SELECT 
    o.type as tipo_transaccion,
    COUNT(*) as total_veces,
    SUM(oi.quantity) as total_cantidad,
    SUM(oi.total_price) as total_valor
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_id = 'PRODUCTO_ID_AQUI'
GROUP BY o.type
ORDER BY total_veces DESC;
