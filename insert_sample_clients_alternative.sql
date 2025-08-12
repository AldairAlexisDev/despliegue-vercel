-- Script para insertar proveedores predefinidos
-- Ejecutar después de crear la tabla partners

INSERT INTO partners (id, name, type, contact) VALUES
  (gen_random_uuid(), 'Saga Falabella', 'proveedor', 'contacto@sagafalabella.com'),
  (gen_random_uuid(), 'Ripley', 'proveedor', 'contacto@ripley.com'),
  (gen_random_uuid(), 'Plaza Vea', 'proveedor', 'contacto@plazavea.com'),
  (gen_random_uuid(), 'Wong', 'proveedor', 'contacto@wong.com'),
  (gen_random_uuid(), 'Metro', 'proveedor', 'contacto@metro.com'),
  (gen_random_uuid(), 'Tottus', 'proveedor', 'contacto@tottus.com'),
  (gen_random_uuid(), 'Sodimac', 'proveedor', 'contacto@sodimac.com'),
  (gen_random_uuid(), 'LaCuracao', 'proveedor', 'contacto@lacuracao.com'),
  (gen_random_uuid(), 'Hiraoka', 'proveedor', 'contacto@hiraoka.com'),
  (gen_random_uuid(), 'Rubi', 'proveedor', 'contacto@rubi.com'),
  (gen_random_uuid(), 'Sima Hogar', 'proveedor', 'contacto@simahogar.com');

-- Verificar que se insertaron correctamente
SELECT id, name, type, contact FROM partners ORDER BY name; 