# Configuración de la Sección de Clientes

## 📋 Descripción

La sección de Clientes permite gestionar todos los partners, clientes y proveedores del sistema. Incluye funcionalidades CRUD completas con búsqueda y filtrado.

## 🗄️ Estructura de la Base de Datos

### Tabla `partners`

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('retail', 'distribuidor', 'cliente_final', 'proveedor')),
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tipos de Clientes

- **retail**: Tiendas minoristas (Saga Falabella, Ripley, Plaza Vea)
- **distribuidor**: Distribuidores mayoristas
- **cliente_final**: Clientes individuales
- **proveedor**: Proveedores de productos

## 🔧 Configuración

### 1. Ejecutar Scripts SQL

```bash
# 1. Configurar RLS para partners
psql -d tu_base_de_datos -f partners_rls_setup.sql

# 2. Insertar clientes de ejemplo
psql -d tu_base_de_datos -f insert_sample_clients.sql
```

### 2. Verificar la Configuración

```sql
-- Verificar que la tabla existe
SELECT * FROM partners LIMIT 5;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'partners';
```

## 🚀 Funcionalidades

### ✅ Implementadas

- **Crear Cliente**: Formulario con validación
- **Editar Cliente**: Modificar datos existentes
- **Eliminar Cliente**: Con confirmación
- **Búsqueda**: Por nombre, tipo o contacto
- **Filtros**: Por tipo de cliente
- **Validación**: Campos obligatorios
- **Feedback**: Mensajes de éxito/error

### 🎨 Características de la UI

- **Diseño Responsivo**: Adaptable a diferentes pantallas
- **Badges de Colores**: Para diferentes tipos de cliente
- **Iconos Intuitivos**: Lucide React icons
- **Estados de Carga**: Spinners y mensajes de error
- **Confirmaciones**: Antes de eliminar

## 📱 Navegación

La sección de Clientes está disponible en:
- **Ruta**: `/admin/clientes`
- **Menú**: Entre "Marcas" e "Inventario"
- **Icono**: Users (personas)

## 🔐 Seguridad

### Políticas RLS

- **Admin**: Acceso completo (CRUD)
- **Vendedor**: Sin acceso (solo pueden ver inventario)

### Validaciones

- Nombre obligatorio
- Tipo obligatorio
- Contacto opcional
- Sanitización de datos

## 📊 Datos de Ejemplo

### Retail
- Saga Falabella
- Ripley
- Plaza Vea
- Wong
- Metro
- Tottus

### Distribuidores
- Distribuidora ABC
- ElectroPro

### Clientes Finales
- Juan Pérez
- María García

### Proveedores
- Samsung
- LG
- Sony

## 🛠️ Desarrollo

### Archivos Principales

- `frontend/src/pages/admin/ClientesPage.tsx`: Componente principal
- `frontend/src/App.tsx`: Configuración de rutas
- `frontend/src/components/layout/Sidebar.tsx`: Navegación

### Dependencias

- React + TypeScript
- Supabase Client
- Lucide React (iconos)
- Tailwind CSS (estilos)

## 🔄 Próximos Pasos

1. **Integración con Notas de Pedido**: Los clientes aparecerán en el dropdown
2. **Estadísticas**: Contadores por tipo de cliente
3. **Exportación**: CSV/PDF de clientes
4. **Importación**: Carga masiva desde archivo
5. **Historial**: Cambios en datos de clientes

## 🐛 Solución de Problemas

### Error: "No se pueden cargar clientes"
- Verificar conexión a Supabase
- Verificar permisos RLS
- Verificar que la tabla `partners` existe

### Error: "No se puede crear cliente"
- Verificar campos obligatorios
- Verificar permisos de escritura
- Verificar validaciones del formulario

### Cliente no aparece en Notas de Pedido
- Verificar que el cliente esté activo
- Verificar permisos de lectura
- Recargar la página de Notas de Pedido 