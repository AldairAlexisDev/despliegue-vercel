-- Script para insertar usuarios de prueba en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

-- Primero, asegúrate de que la tabla users existe
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar usuario vendedor
INSERT INTO users (email, username, role) 
VALUES ('vendedor@nuevaera.com', 'vendedorAldair', 'vendedor')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Insertar usuario admin
INSERT INTO users (email, username, role) 
VALUES ('admin@nuevaera.com', 'adminNuevaEra', 'admin')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Verificar que se insertaron correctamente
SELECT * FROM users;
