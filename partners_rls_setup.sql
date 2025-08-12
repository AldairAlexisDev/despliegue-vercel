-- Configuración de RLS para la tabla partners
-- Ejecutar después de crear la tabla partners

-- Habilitar RLS en la tabla partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Política para administradores (acceso completo)
CREATE POLICY "Admin can manage all partners" ON partners
  FOR ALL USING (is_admin());

-- Los vendedores NO tienen acceso a partners (solo inventario)
-- No se crea política para vendedores en esta tabla

-- Comentarios para documentación
COMMENT ON TABLE partners IS 'Tabla para almacenar información de clientes/partners';
COMMENT ON COLUMN partners.id IS 'Identificador único del partner';
COMMENT ON COLUMN partners.name IS 'Nombre del partner/cliente';
COMMENT ON COLUMN partners.type IS 'Tipo de partner: retail, distribuidor, cliente_final, proveedor';
COMMENT ON COLUMN partners.contact IS 'Información de contacto (email, teléfono, dirección)';

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_partners_name ON partners(name);
CREATE INDEX idx_partners_type ON partners(type); 