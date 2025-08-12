// src/pages/admin/MarcasPage.tsx
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Search, Edit, Trash2, X, Save, Tag } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

type Marca = {
  id: string
  name: string
  created_at?: string
}

type MarcaForm = {
  name: string
}

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
  const [formData, setFormData] = useState<MarcaForm>({
    name: ''
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMarcas()
  }, [])

  async function fetchMarcas() {
    try {
      setLoading(true)
      setError('')
      
      const { data, error: err } = await supabase
        .from('brands')
        .select('id, name, created_at')
        .order('name', { ascending: true })

      if (err) {
        console.error('Error fetching marcas:', err)
        setError(`Error al cargar marcas: ${err.message}`)
        return
      }

      if (data) {
        setMarcas(data)
      } else {
        setMarcas([])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado al cargar las marcas')
    } finally {
      setLoading(false)
    }
  }

  const filteredMarcas = marcas.filter(marca =>
    marca.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ordered = useMemo(() => filteredMarcas, [filteredMarcas])

  const resetForm = () => {
    setFormData({
      name: ''
    })
    setEditingMarca(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Por favor ingresa el nombre de la marca')
      return
    }

    try {
      if (editingMarca) {
        // Actualizar marca existente
        const { error } = await supabase
          .from('brands')
          .update({
            name: formData.name.trim()
          })
          .eq('id', editingMarca.id)

        if (error) {
          console.error('Error updating marca:', error)
          alert(`Error al actualizar: ${error.message}`)
          return
        }

        // Actualizar lista local
        setMarcas(marcas.map(m => 
          m.id === editingMarca.id 
            ? { ...m, name: formData.name.trim() }
            : m
        ))
      } else {
        // Crear nueva marca
        const { data, error } = await supabase
          .from('brands')
          .insert([{
            name: formData.name.trim()
          }])
          .select()

        if (error) {
          console.error('Error creating marca:', error)
          alert(`Error al crear: ${error.message}`)
          return
        }

        if (data) {
          setMarcas([...marcas, data[0]])
        }
      }

      resetForm()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Error inesperado al guardar la marca')
    }
  }

  const handleEdit = (marca: Marca) => {
    setEditingMarca(marca)
    setFormData({
      name: marca.name
    })
    setShowForm(true)
  }

  const askDelete = (id: string) => { setBrandToDelete(id); setConfirmOpen(true) }
  const confirmDelete = async () => {
    if (!brandToDelete) return
    try {
      setDeleting(true)
      const { error } = await supabase.from('brands').delete().eq('id', brandToDelete)
      if (error) throw error
      setMarcas(prev => prev.filter(m => m.id !== brandToDelete))
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Error inesperado al eliminar la marca')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setBrandToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-sm">Cargando marcas...</p>
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
            onClick={fetchMarcas}
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
              Gestión de Marcas
            </h1>
            <p className="text-slate-600 text-lg">
              Administra las marcas de tus productos • {marcas.length} marcas disponibles
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda moderna y elegante */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar marcas por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-slate-700 text-base placeholder-slate-400"
          />
        </div>
      </div>

      {/* Grid de cards de marcas mejorado */}
      {ordered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
              <Tag size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchTerm ? 'No se encontraron marcas' : 'No hay marcas registradas'}
            </h3>
            <p className="text-slate-600 text-lg">
              {searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Comienza creando tu primera marca'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ordered.map((marca) => (
            <div key={marca.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-300 group">
              {/* Header elegante */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <Tag size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base leading-tight mb-3 min-h-[3rem] flex items-center justify-center">
                  {marca.name}
                </h3>
                <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
                  {marca.created_at ? new Date(marca.created_at).toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '-'}
                </div>
              </div>
              
              {/* Acciones */}
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit(marca)} 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Editar marca"
                >
                  Editar
                </button>
                <button 
                  onClick={() => askDelete(marca.id)} 
                  className="flex-1 px-4 py-2.5 bg-white text-red-600 rounded-xl text-sm font-medium border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  title="Eliminar marca"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Tag size={20} className="text-blue-600" />
          </div>
          <span className="text-slate-600 font-medium text-sm">
            Mostrando {ordered.length} de {marcas.length} marcas
          </span>
        </div>
      </div>

      {/* Modal moderno */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMarca ? 'Editar marca' : 'Nueva marca'}
              </h3>
              <button 
                onClick={resetForm} 
                className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Nombre de la marca *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                  placeholder="Ej: Samsung, Apple, HP..."
                  required
                />
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
                  <Save size={18} /> {editingMarca ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar marca"
        description="Esta acción no se puede deshacer. Se eliminará la marca seleccionada."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) { setConfirmOpen(false); setBrandToDelete(null) } }}
      />
    </div>
  )
} 