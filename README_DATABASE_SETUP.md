# Configuración de Base de Datos - Sistema de Marcas

## 📋 Descripción

Este script configura la tabla `brands` (marcas) en tu base de datos Supabase y modifica la tabla `products` para usar relaciones adecuadas.

## 🚀 Pasos de Instalación

### Paso 1: Ejecutar el Script Principal

1. **Ve a tu panel de Supabase**
   - Accede a tu proyecto en [supabase.com](https://supabase.com)
   - Ve a la sección "SQL Editor"

2. **Ejecuta el script `database_setup.sql`**
   - Copia y pega el contenido del archivo `database_setup.sql`
   - Haz clic en "Run" para ejecutar el script

### Paso 2: Migrar Datos Existentes (Opcional)

Si ya tienes productos con marcas en tu base de datos:

1. **Ejecuta el script `migrate_existing_data.sql`**
   - Copia y pega el contenido del archivo `migrate_existing_data.sql`
   - Haz clic en "Run" para ejecutar el script

### Paso 3: Verificar la Instalación

Ejecuta estas consultas para verificar que todo esté funcionando:

```sql
-- Verificar que la tabla brands existe
SELECT * FROM brands LIMIT 5;

-- Verificar que la columna brand_id existe en products
SELECT id, name, brand, brand_id FROM products LIMIT 5;

-- Verificar la vista de productos con marcas
SELECT * FROM products_with_brands LIMIT 5;
```

## 📊 Estructura Creada

### Tabla `brands`
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modificaciones a `products`
- Se agrega la columna `brand_id UUID REFERENCES brands(id)`
- Se mantiene la columna `brand` original por compatibilidad

### Funciones Útiles
- `migrate_brands()`: Migra marcas existentes
- `get_brand_name(UUID)`: Obtiene nombre de marca por ID
- `cleanup_duplicate_brands()`: Limpia marcas duplicadas

### Vista Útil
- `products_with_brands`: Combina productos con información de marcas

## 🔒 Seguridad y Roles de Usuario

El script incluye políticas de seguridad específicas para dos roles:

### 👨‍💼 **Administrador (admin)**
- ✅ **Acceso total** a todas las funcionalidades
- ✅ **Crear, editar, eliminar** marcas y productos
- ✅ **Gestionar inventario** completo
- ✅ **Acceso a todas las páginas** del sistema

### 👨‍💻 **Vendedor (vendedor)**
- ✅ **Solo visualización** del inventario en tiempo real
- ✅ **Ver marcas** para referencia
- ✅ **Acceso limitado** solo a páginas de consulta
- ❌ **NO puede** crear, editar o eliminar registros

### 🔐 **Políticas Implementadas**

**Para la tabla `brands`:**
- **Lectura**: Admin y vendedor pueden ver marcas
- **Inserción/Actualización/Eliminación**: Solo administradores

**Para la tabla `products`:**
- **Lectura**: Admin y vendedor pueden ver productos (inventario)
- **Inserción/Actualización/Eliminación**: Solo administradores

### 🛠️ **Funciones de Verificación**
- `is_admin()`: Verifica si el usuario es administrador
- `is_vendor()`: Verifica si el usuario es vendedor
- `get_brand_name(UUID)`: Obtiene nombre de marca por ID

## 🎯 Marcas Predefinidas

El script crea automáticamente estas marcas:
- Samsung
- Apple
- HP
- Dell
- Lenovo
- Asus
- Acer
- Microsoft
- Sony
- LG

## ⚠️ Notas Importantes

1. **Backup**: Antes de ejecutar, haz un backup de tu base de datos
2. **Compatibilidad**: La columna `brand` original se mantiene durante la migración
3. **Migración**: Los datos existentes se migran automáticamente
4. **Seguridad**: Solo usuarios autenticados pueden acceder a las marcas

## 🔧 Solución de Problemas

### Error: "relation brands does not exist"
- Verifica que ejecutaste `database_setup.sql` completo

### Error: "duplicate key value violates unique constraint"
- Ejecuta `SELECT cleanup_duplicate_brands();`

### Error: "column brand_id does not exist"
- Verifica que la columna se agregó correctamente en `products`

## 📞 Soporte

Si encuentras problemas:
1. Verifica los logs de Supabase
2. Ejecuta las consultas de verificación
3. Revisa que todos los scripts se ejecutaron en orden

## ✅ Verificación Final

Después de ejecutar los scripts, tu aplicación debería:
- ✅ Mostrar la página de Marcas en `/admin/marcas`
- ✅ Permitir crear/editar/eliminar marcas
- ✅ Mostrar dropdown de marcas en el formulario de productos
- ✅ Funcionar correctamente con la nueva estructura de datos 