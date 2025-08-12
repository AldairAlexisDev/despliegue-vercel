-- Script para insertar clientes de ejemplo
-- Ejecutar después de crear la tabla partners

INSERT INTO partners (id, name, type, contact) VALUES
  (gen_random_uuid(), 'Saga Falabella', 'retail', 'contacto@sagafalabella.com'),
  (gen_random_uuid(), 'Ripley', 'retail', 'contacto@ripley.com'),
  (gen_random_uuid(), 'Plaza Vea', 'retail', 'contacto@plazavea.com'),
  (gen_random_uuid(), 'Wong', 'retail', 'contacto@wong.com'),
  (gen_random_uuid(), 'Metro', 'retail', 'contacto@metro.com'),
  (gen_random_uuid(), 'Tottus', 'retail', 'contacto@tottus.com');

-- Verificar que se insertaron correctamente
SELECT id, name, type, contact FROM partners ORDER BY name; 