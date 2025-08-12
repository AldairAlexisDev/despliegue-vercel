// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Users, Package, Calendar, CheckCircle } from 'lucide-react'

type Stats = { usuarios: number; productos: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ usuarios: 0, productos: 0 })

  useEffect(() => {
    async function fetchStats() {
      try {
        // Consultar usuarios
        const { count: uCount } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
        
        // Consultar productos - usar la tabla correcta
        const { count: pCount } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
        
        setStats({
          usuarios: uCount ?? 0,
          productos: pCount ?? 0,
        })
        
        console.log('Estadísticas cargadas:', { usuarios: uCount, productos: pCount })
      } catch (error) {
        console.error('Error al cargar estadísticas:', error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Título principal simple */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Panel de Control
        </h1>
        <p className="text-lg text-gray-600">
          Bienvenido al sistema de administración
        </p>
      </div>

      {/* Estadísticas principales - Solo 2 tarjetas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-4">
            <Users size={48} className="mx-auto text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {stats.usuarios}
          </div>
          <div className="text-lg text-gray-600">
            Usuarios Registrados
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-4">
            <Package size={48} className="mx-auto text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {stats.productos}
          </div>
          <div className="text-lg text-gray-600">
            Productos en Inventario
          </div>
        </div>
      </div>

      {/* Información del sistema - Solo 2 elementos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Estado del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-xl text-center">
            <h3 className="font-semibold text-gray-800 mb-3">Estado del Servidor</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-lg font-medium text-green-700">Funcionando</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl text-center">
            <h3 className="font-semibold text-gray-800 mb-3">Última Actualización</h3>
            <p className="text-lg text-gray-700">
              {new Date().toLocaleDateString('es-ES', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
