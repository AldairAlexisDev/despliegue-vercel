// src/pages/admin/InventarioPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Search, Package } from 'lucide-react'

type Producto = {
  id: string
  name: string
  stock: number
  brand: string
  model: string
  created_at?: string
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProductos()

    // Suscripción en tiempo real a cambios en products
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload: any) => {
        setProductos(prev => [payload.new as Producto, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload: any) => {
        setProductos(prev => prev.map(p => (p.id === payload.new.id ? { ...(payload.new as Producto) } : p)).sort((a, b) => a.name.localeCompare(b.name)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload: any) => {
        setProductos(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchProductos() {
    try {
      setLoading(true)
      setError('')
      
      const { data, error: err } = await supabase
        .from('products')
        .select('id, name, stock, brand, model, created_at')
        .order('name', { ascending: true })

      if (err) {
        console.error('Error fetching productos:', err)
        setError(`Error al cargar productos: ${err.message}`)
        return
      }

      if (data) {
        setProductos(data)
      } else {
        setProductos([])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return productos.filter(producto =>
      producto.name.toLowerCase().includes(q) ||
      producto.brand.toLowerCase().includes(q) ||
      producto.model.toLowerCase().includes(q)
    )
  }, [productos, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-sm">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <button 
            onClick={fetchProductos}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-8">
      {/* Header elegante y moderno */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
              Control de Inventario
            </h1>
            <p className="text-slate-600 text-lg">
              Monitorea y gestiona el stock de tus productos • {productos.length} productos en total
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{productos.length}</div>
              <div className="text-sm text-slate-600">Total Productos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {productos.filter(p => p.stock > 10).length}
              </div>
              <div className="text-sm text-slate-600">Stock Alto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {productos.filter(p => p.stock > 0 && p.stock <= 10).length}
              </div>
              <div className="text-sm text-slate-600">Stock Bajo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {productos.filter(p => p.stock === 0).length}
              </div>
              <div className="text-sm text-slate-600">Sin Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda moderna y elegante */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-slate-700 text-base placeholder-slate-400"
          />
        </div>
      </div>

      {/* Tabla de productos moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Nombre</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Marca</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Modelo</th>
                <th className="text-right p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                        <Package size={32} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {searchTerm ? 'No se encontraron productos' : 'No hay productos en el inventario'}
                      </h3>
                      <p className="text-slate-600 text-lg">
                        {searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Los productos aparecerán aquí cuando sean creados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProductos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-all duration-200 group">
                    <td className="p-6">
                      <div className="font-semibold text-slate-800 text-lg">{prod.name}</div>
                      {prod.created_at && (
                        <div className="text-sm text-slate-500 mt-1">
                          Creado: {new Date(prod.created_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <span className="inline-flex px-4 py-2 rounded-xl bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200">
                        {prod.brand}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <span className="font-medium text-slate-800">{prod.model}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold ${
                        prod.stock > 10 ? 'bg-green-100 text-green-700 border border-green-200' :
                        prod.stock > 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {prod.stock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <span className="text-slate-600 font-medium text-sm">
            Mostrando {filteredProductos.length} de {productos.length} productos
          </span>
        </div>
      </div>
    </div>
  )
}
