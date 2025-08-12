-- Script para actualizar políticas RLS y restringir acceso de vendedores
-- Los vendedores solo deben tener acceso al inventario (products)

-- 1. Eliminar políticas existentes para vendedores en otras tablas
DROP POLICY IF EXISTS "Vendor can view all brands" ON brands;
DROP POLICY IF EXISTS "Vendor can view all partners" ON partners;
DROP POLICY IF EXISTS "Vendor can view all orders" ON orders;
DROP POLICY IF EXISTS "Vendor can view all order_items" ON order_items;

-- 2. Verificar que solo existe la política de inventario para vendedores
-- Los vendedores solo deben tener acceso a products (inventario)

-- 3. Crear políticas específicas para cada tabla
-- Solo admin tiene acceso completo a todas las tablas

-- Brands: Solo admin
CREATE POLICY "Admin can manage all brands" ON brands
  FOR ALL USING (is_admin());

-- Partners: Solo admin  
CREATE POLICY "Admin can manage all partners" ON partners
  FOR ALL USING (is_admin());

-- Orders: Solo admin
CREATE POLICY "Admin can manage all orders" ON orders
  FOR ALL USING (is_admin());

-- Order_items: Solo admin
CREATE POLICY "Admin can manage all order_items" ON order_items
  FOR ALL USING (is_admin());

-- Products: Admin tiene acceso completo, vendedor solo lectura
-- (Esta política ya debe existir, pero la verificamos)
CREATE POLICY IF NOT EXISTS "Admin can manage all products" ON products
  FOR ALL USING (is_admin());

CREATE POLICY IF NOT EXISTS "Vendor can view products" ON products
  FOR SELECT USING (is_vendor());

-- 4. Verificar las políticas existentes
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
ORDER BY tablename, policyname;

-- 5. Comentarios para documentación
COMMENT ON TABLE brands IS 'Solo admin puede gestionar marcas';
COMMENT ON TABLE partners IS 'Solo admin puede gestionar clientes/partners';
COMMENT ON TABLE orders IS 'Solo admin puede gestionar órdenes/notas de pedido';
COMMENT ON TABLE order_items IS 'Solo admin puede gestionar items de órdenes';
COMMENT ON TABLE products IS 'Admin: CRUD completo, Vendedor: Solo lectura (inventario)'; 