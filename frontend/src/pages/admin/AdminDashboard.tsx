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
    <div className="space-y-4 sm:space-y-6 min-h-screen">
      {/* Título principal simple */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
          Panel de Control
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Bienvenido al sistema de administración
        </p>
      </div>

      {/* Estadísticas principales - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 text-center">
          <div className="mb-3 sm:mb-4">
            <Users size={32} className="mx-auto text-blue-600 sm:w-12 sm:h-12 lg:w-12 lg:h-12" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            {stats.usuarios}
          </div>
          <div className="text-sm sm:text-base lg:text-lg text-gray-600">
            Usuarios Registrados
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 text-center">
          <div className="mb-3 sm:mb-4">
            <Package size={32} className="mx-auto text-green-600 sm:w-12 sm:h-12 lg:w-12 lg:h-12" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            {stats.productos}
          </div>
          <div className="text-sm sm:text-base lg:text-lg text-gray-600">
            Productos en Inventario
          </div>
        </div>
      </div>

      {/* Información del sistema - Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
          Estado del Sistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl text-center">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Estado del Servidor</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm sm:text-base lg:text-lg font-medium text-green-700">Funcionando</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl text-center">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Última Actualización</h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">
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
