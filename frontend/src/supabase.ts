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

//Aqui creamos el cliente de Supabase y
//luego exportamos la constante supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
