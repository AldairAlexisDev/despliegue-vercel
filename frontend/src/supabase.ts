//Archivo de configuración de Supabase, donde
//se crea la conexion a la base de datos
//Desde aqui se podrá hacer las consultas a la base de datos

//Importamos la libreria de Supabase
import { createClient } from '@supabase/supabase-js'

//Estas dos constantes se obtienen desde el archivo .env
//VITE_SUPABASE_URL: URL de la base de datos
//VITE_SUPABASE_ANON_KEY: Clave de acceso a la base de datos
//usamos import.meta.env para obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de variables de entorno
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL no está definida')
  throw new Error('VITE_SUPABASE_URL es requerida')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está definida')
  throw new Error('VITE_SUPABASE_ANON_KEY es requerida')
}

console.log('✅ Variables de entorno de Supabase cargadas correctamente')
console.log('🔗 URL:', supabaseUrl)
console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...')

//Aqui creamos el cliente de Supabase y
//luego exportamos la constante supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
