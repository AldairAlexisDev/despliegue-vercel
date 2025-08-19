// src/pages/admin/ProductosPage.tsx (cards UI)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Search, X, Save, Package, Grid, List, ChevronDown, Filter } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'

type Producto = {
  id: string
  name: string
  stock: number
  brand: string
  brand_id?: string
  model: string
  created_at?: string
}

type ProductoForm = {
  name: string
  stock: number
  brand_id: string
  model: string
}

export default function ProductosPage() {
  const toast = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState<ProductoForm>({ name: '', stock: 0, brand_id: '', model: '' })

  useEffect(() => {
    fetchProductos()
    fetchMarcas()

    // Realtime: refrescar cards ante cambios
    const channel = supabase
      .channel('products-cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProductos())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchProductos() {
    try {
      setLoading(true)
      setError('')
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let query = supabase
        .from('products')
        .select('id, name, stock, brand, brand_id, model, created_at', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      const term = committedSearch.trim()
      if (term) {
        // Buscar por nombre, marca o modelo (case-insensitive)
        query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%`)
      }
      
      // Filtro por marca seleccionada
      if (selectedBrand) {
        query = query.eq('brand_id', selectedBrand)
      }

      const { data, error, count } = await query
      if (error) throw error
      setProductos(data || [])
      setTotal(count || 0)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  async function fetchMarcas() {
    try {
      const { data, error } = await supabase.from('brands').select('id, name').order('name', { ascending: true })
      if (error) throw error
      setMarcas(data || [])
    } catch (err: any) {
      console.error('Error al cargar marcas:', err)
    }
  }

  function handleSearch() {
    setCommittedSearch(searchTerm)
    setPage(1)
  }

  function handleBrandFilter(brandId: string) {
    setSelectedBrand(brandId)
    setPage(1)
  }

  function clearFilters() {
    setSelectedBrand('')
    setSearchTerm('')
    setCommittedSearch('')
    setPage(1)
  }

  function handleEdit(producto: Producto) {
    setEditingProduct(producto)
    setFormData({
      name: producto.name,
      stock: producto.stock,
      brand_id: producto.brand_id || '',
      model: producto.model
    })
    setShowForm(true)
  }

  function askDelete(id: string) {
    setProductToDelete(id)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!productToDelete) return
    try {
      setDeleting(true)
      const { error } = await supabase.from('products').delete().eq('id', productToDelete)
      if (error) throw error
      
      toast.show('Producto eliminado correctamente', 'success')
      setProductos(prev => prev.filter(p => p.id !== productToDelete))
      setTotal(prev => prev - 1)
    } catch (err: any) {
      toast.show('Error al eliminar el producto', 'error')
      console.error(err)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setProductToDelete(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            stock: formData.stock,
            brand_id: formData.brand_id,
            model: formData.model
          })
          .eq('id', editingProduct.id)
        
        if (error) throw error
        toast.show('Producto actualizado correctamente', 'success')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            stock: formData.stock,
            brand_id: formData.brand_id,
            model: formData.model
          }])
        
        if (error) throw error
        toast.show('Producto creado correctamente', 'success')
      }
      
      resetForm()
      fetchProductos()
    } catch (err: any) {
      toast.show(editingProduct ? 'Error al actualizar el producto' : 'Error al crear el producto', 'error')
      console.error(err)
    }
  }

  function resetForm() {
    setFormData({ name: '', stock: 0, brand_id: '', model: '' })
    setEditingProduct(null)
    setShowForm(false)
  }

  // Ordenar productos por nombre
  const ordered = useMemo(() => {
    return [...productos].sort((a, b) => a.name.localeCompare(b.name))
  }, [productos])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-sm">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <button onClick={fetchProductos} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header principal - Optimizado para móviles */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          {/* Título y descripción */}
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800 mb-2">
              Gestión de Productos
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              Administra tu catálogo de productos • {total} items disponibles
            </p>
          </div>
          
          {/* Botón nuevo producto - Ancho completo en móviles */}
          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros - Optimizada para móviles */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Búsqueda principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base placeholder-gray-400"
            />
          </div>

          {/* Controles de filtros y vista */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
            >
              <Filter size={16} />
              <span>Filtros</span>
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Toggle de vista */}
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-md text-sm transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-md text-sm transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todas las marcas</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                {(selectedBrand || committedSearch) && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium border border-red-200"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de productos - Optimizado para móviles */}
      {ordered.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <Package size={24} className="text-blue-600 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No hay productos</h3>
            <p className="text-gray-600 text-sm sm:text-base">Crea tu primer producto para comenzar</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {ordered.map((prod) => (
            <div key={prod.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200">
              {/* Header del producto */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-blue-200">
                  <Package size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight mb-2 sm:mb-3 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
                  {prod.name}
                </h3>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                  {prod.created_at ? new Date(prod.created_at).toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '-'}
                </div>
              </div>
              
              {/* Información del producto */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="text-center">
                  <span className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {prod.brand || 'Sin marca'}
                  </span>
                </div>
                
                <div className="text-center">
                  <span className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    Modelo: {prod.model}
                  </span>
                </div>
              </div>
              
              {/* Acciones - Botones apilados en móviles */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button 
                  onClick={() => handleEdit(prod)} 
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Editar
                </button>
                <button 
                  onClick={() => askDelete(prod.id)} 
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-2.5 bg-white text-red-600 rounded-lg text-xs sm:text-sm font-medium border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación - Optimizada para móviles */}
      {total > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Información de resultados */}
            <div className="text-center sm:text-left">
              <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 inline-block">
                Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total} productos
              </div>
            </div>
            
            {/* Controles de paginación */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
              >
                ← Anterior
              </button>
              <span className="px-3 py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm">
                {page}/{Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize) || 1, p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario - Optimizado para móviles */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button 
                onClick={resetForm} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nombre del producto *</label>
                  <input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base" 
                    placeholder="Ej: Televisor Samsung 65 pulgadas"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Marca *</label>
                  <select 
                    value={formData.brand_id} 
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })} 
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base" 
                    required
                  >
                    <option value="">Seleccionar marca</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Modelo *</label>
                  <input 
                    value={formData.model} 
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base" 
                    placeholder="Ej: UN65TU8000FXZX"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Stock inicial</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={formData.stock} 
                    onChange={(e) => setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value) || 0) })} 
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base" 
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Botones del formulario - Apilados en móviles */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 sm:pt-6">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
                >
                  <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer. Se eliminará el producto del inventario."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false)
            setProductToDelete(null)
          }
        }}
      />
    </div>
  )
}