// src/pages/admin/ProductosPage.tsx (cards UI)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Search, X, Save, Package, Grid, List, ChevronDown } from 'lucide-react'
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

// Orden fijo por nombre ascendente; sin filtros adicionales

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
      if (!error && data) setMarcas(data)
    } catch (err) {
      console.error(err)
    }
  }

  const ordered = useMemo(() => productos, [productos])

  // Refetch al cambiar de página, término confirmado o marca seleccionada
  useEffect(() => { fetchProductos() }, [committedSearch, page, selectedBrand])

  const handleSearch = () => {
    setPage(1)
    setCommittedSearch(searchTerm)
  }

  const handleBrandFilter = (brandId: string) => {
    setPage(1)
    setSelectedBrand(brandId)
  }

  const clearFilters = () => {
    setPage(1)
    setSelectedBrand('')
    setCommittedSearch('')
    setSearchTerm('')
  }

  const resetForm = () => {
    setFormData({ name: '', stock: 0, brand_id: '', model: '' })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.brand_id || !formData.model) {
      toast.show('Completa nombre, marca y modelo', 'error', 'Validación')
      return
    }
    if (formData.stock < 0) {
      toast.show('El stock no puede ser negativo', 'error', 'Validación')
      return
    }

    try {
      const marca = marcas.find((m) => m.id === formData.brand_id)
      const brandName = marca ? marca.name : ''
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({ name: formData.name, stock: formData.stock, brand: brandName, brand_id: formData.brand_id, model: formData.model })
          .eq('id', editingProduct.id)
        if (error) throw error
        toast.show('Producto actualizado', 'success', 'Éxito')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ name: formData.name, stock: formData.stock, brand: brandName, brand_id: formData.brand_id, model: formData.model }])
        if (error) throw error
        toast.show('Producto creado', 'success', 'Éxito')
      }
      resetForm()
      fetchProductos()
    } catch (err: any) {
      console.error(err)
      toast.show(err.message || 'No se pudo guardar', 'error', 'Error')
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({ name: producto.name, stock: producto.stock, brand_id: producto.brand_id || '', model: producto.model })
    setShowForm(true)
  }

  const askDelete = (id: string) => {
    setProductToDelete(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    try {
      setDeleting(true)
      const { error } = await supabase.from('products').delete().eq('id', productToDelete)
      if (error) throw error
      toast.show('Producto eliminado', 'success', 'Éxito')
      setProductos((prev) => prev.filter((p) => p.id !== productToDelete))
    } catch (err: any) {
      console.error(err)
      toast.show(err.message || 'No se pudo eliminar', 'error', 'Error')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setProductToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-sm">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <button onClick={fetchProductos} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
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
              Gestión de Productos
            </h1>
            <p className="text-slate-600 text-lg">
              Administra tu catálogo de productos • {total} items disponibles
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filtros modernos y elegantes */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar productos por nombre, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-slate-700 text-base placeholder-slate-400"
            />
          </div>
          
                     {/* Filtros adicionales */}
           <div className="flex items-center gap-4">
             <div className="relative">
               <select
                 value={selectedBrand}
                 onChange={(e) => handleBrandFilter(e.target.value)}
                 className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm font-medium border border-slate-200 pr-10 cursor-pointer appearance-none"
               >
                 <option value="">Todas las marcas</option>
                 {marcas.map((marca) => (
                   <option key={marca.id} value={marca.id}>
                     {marca.name}
                   </option>
                 ))}
               </select>
               <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
             </div>
             
             {(selectedBrand || committedSearch) && (
               <button
                 onClick={clearFilters}
                 className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-200 text-sm font-medium border border-red-200"
               >
                 Limpiar filtros
               </button>
             )}
            
            {/* Toggle de vista */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de cards mejorado */}
      {/* Estado vacío elegante */}
      {ordered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
              <Package size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay productos</h3>
            <p className="text-slate-600 text-lg">Crea tu primer producto para comenzar a gestionar tu inventario</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {ordered.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-300 group">
              {/* Header elegante */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <Package size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base leading-tight mb-3 min-h-[3rem] flex items-center justify-center">
                  {prod.name}
                </h3>
                <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
                  {prod.created_at ? new Date(prod.created_at).toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '-'}
                </div>
              </div>
              
              {/* Información del producto */}
              <div className="space-y-3 mb-6">
                <div className="text-center">
                  <span className="inline-flex px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {prod.brand || 'Sin marca'}
                  </span>
                </div>
                
                {/* Modelo del producto */}
                <div className="text-center">
                  <span className="inline-flex px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Modelo: {prod.model}
                  </span>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit(prod)} 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Editar producto"
                >
                  Editar
                </button>
                <button 
                  onClick={() => askDelete(prod.id)} 
                  className="flex-1 px-4 py-2.5 bg-white text-red-600 rounded-xl text-sm font-medium border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  title="Eliminar producto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            {total > 0 ? (
              <>Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total} productos</>
            ) : (
              <>Sin resultados</>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all duration-200 font-medium border border-slate-200"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-md">
              {page} / {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize) || 1, p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all duration-200 font-medium border border-slate-200"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* Modal moderno */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button 
                onClick={resetForm} 
                className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Nombre del producto *</label>
                  <input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                    placeholder="Ej: Televisor Samsung 65 pulgadas"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Marca *</label>
                  <select 
                    value={formData.brand_id} 
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
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
                  <label className="block text-sm font-semibold text-slate-700">Modelo *</label>
                  <input 
                    value={formData.model} 
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                    placeholder="Ej: UN65TU8000FXZX"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Stock inicial</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={formData.stock} 
                    onChange={(e) => setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value) || 0) })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 justify-end pt-6">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  <Save size={18} /> {editingProduct ? 'Actualizar' : 'Crear'}
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