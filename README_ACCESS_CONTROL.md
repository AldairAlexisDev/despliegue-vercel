# Control de Acceso - Nueva Era

## 🔐 Políticas de Seguridad

### Roles del Sistema

#### 👑 **Administrador (Admin)**
- **Acceso completo** a todas las funcionalidades
- **CRUD completo** en todas las tablas
- **Gestión de usuarios** y configuraciones
- **Reportes** y estadísticas completas

#### 👤 **Vendedor**
- **Solo acceso al inventario** (tabla `products`)
- **Solo lectura** del inventario
- **Sin acceso** a otras secciones
- **Sin permisos** de escritura en ninguna tabla

## 📋 Detalle de Accesos por Tabla

### ✅ **Tabla `products` (Inventario)**
- **Admin**: CRUD completo (Crear, Leer, Actualizar, Eliminar)
- **Vendedor**: Solo lectura (SELECT)

### ❌ **Tabla `brands` (Marcas)**
- **Admin**: CRUD completo
- **Vendedor**: Sin acceso

### ❌ **Tabla `partners` (Clientes)**
- **Admin**: CRUD completo
- **Vendedor**: Sin acceso

### ❌ **Tabla `orders` (Notas de Pedido)**
- **Admin**: CRUD completo
- **Vendedor**: Sin acceso

### ❌ **Tabla `order_items` (Items de Notas)**
- **Admin**: CRUD completo
- **Vendedor**: Sin acceso

## 🛡️ Implementación de Seguridad

### Políticas RLS (Row Level Security)

```sql
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

-- Products: Admin completo, Vendedor solo lectura
CREATE POLICY "Admin can manage all products" ON products
  FOR ALL USING (is_admin());

CREATE POLICY "Vendor can view products" ON products
  FOR SELECT USING (is_vendor());
```

### Funciones de Verificación

```sql
-- Función para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si es vendedor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'vendedor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🚫 Restricciones de Vendedores

### Secciones Inaccesibles para Vendedores:

1. **Panel Principal** (`/admin`)
   - Estadísticas generales
   - Dashboard de administración

2. **Productos** (`/admin/productos`)
   - Gestión de productos
   - Crear/editar productos

3. **Marcas** (`/admin/marcas`)
   - Gestión de marcas
   - CRUD de marcas

4. **Clientes** (`/admin/clientes`)
   - Gestión de clientes
   - CRUD de partners

5. **Notas de Pedido** (`/admin/notas-pedido`)
   - Registro de transacciones
   - Gestión de órdenes

6. **Usuarios** (`/admin/usuarios`)
   - Gestión de usuarios
   - Configuración de roles

7. **Movimientos** (`/admin/movimientos`)
   - Reportes de movimientos
   - Estadísticas avanzadas

### ✅ Sección Accesible para Vendedores:

1. **Inventario** (`/admin/inventario`)
   - Solo visualización del stock
   - Sin permisos de edición
   - Búsqueda y filtrado permitido

## 🔧 Configuración

### Scripts de Configuración

```bash
# 1. Configurar políticas RLS básicas
psql -d tu_base_de_datos -f database_setup.sql

# 2. Actualizar políticas para vendedores
psql -d tu_base_de_datos -f update_rls_for_vendors.sql

# 3. Configurar clientes (solo admin)
psql -d tu_base_de_datos -f partners_rls_setup.sql
```

### Verificación de Políticas

```sql
-- Verificar todas las políticas existentes
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
```

## 🎯 Objetivos de Seguridad

### ✅ Implementado

- **Separación clara** de roles
- **Acceso restringido** para vendedores
- **Políticas RLS** en todas las tablas
- **Validación de roles** en funciones
- **Sin acceso** a datos sensibles para vendedores

### 🔄 Próximos Pasos

1. **Interfaz adaptativa**: Ocultar menús para vendedores
2. **Redirección automática**: Vendedores solo ven inventario
3. **Auditoría**: Log de accesos por rol
4. **Notificaciones**: Alertas de acceso no autorizado

## 🚨 Consideraciones Importantes

### Para Vendedores:
- **Solo pueden ver** el inventario actual
- **No pueden modificar** ningún dato
- **No tienen acceso** a información de clientes
- **No pueden crear** notas de pedido
- **No pueden gestionar** productos o marcas

### Para Administradores:
- **Acceso completo** a todas las funcionalidades
- **Responsabilidad** de gestionar datos sensibles
- **Capacidad** de crear y modificar cualquier registro
- **Acceso** a reportes y estadísticas completas

## 📞 Soporte

Si un vendedor necesita:
- **Crear una nota de pedido**: Contactar al administrador
- **Modificar inventario**: Contactar al administrador
- **Ver información de clientes**: Contactar al administrador
- **Acceder a reportes**: Contactar al administrador

**Los vendedores solo deben usar la sección de Inventario para consultar el stock disponible.** 