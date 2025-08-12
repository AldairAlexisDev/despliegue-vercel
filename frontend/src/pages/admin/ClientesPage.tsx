// src/pages/admin/ClientesPage.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Search, Edit, Trash2, X, Save, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

type Cliente = {
  id: string
  name: string
  type: string
  contact: string
}

type ClienteForm = {
  name: string
  type: string
  contact: string
}

const PROVEEDORES_PREDEFINIDOS = [
  'Saga Falabella',
  'Ripley', 
  'Plaza Vea',
  'Wong',
  'Metro',
  'Tottus',
  'Sodimac',
  'LaCuracao',
  'Hiraoka',
  'Rubi',
  'Sima Hogar'
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState<ClienteForm>({
    name: '',
    type: '',
    contact: ''
  })
  
  // Estados para operaciones modernas
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    show: boolean
  }>({ type: 'info', message: '', show: false })

  useEffect(() => {
    fetchClientes()
  }, [page, committedSearch])

  async function fetchClientes() {
    try {
      setLoading(true)
      setError('')
      
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      let query = supabase
        .from('partners')
        .select('id, name, type, contact', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      const term = committedSearch.trim()
      if (term) {
        query = query.or(`name.ilike.%${term}%,type.ilike.%${term}%,contact.ilike.%${term}%`)
      }

      const { data, error: err, count } = await query

      if (err) {
        console.error('Error fetching clientes:', err)
        setError(`Error al cargar clientes: ${err.message}`)
        return
      }

      if (data) {
        setClientes(data)
        setTotal(count || 0)
      } else {
        setClientes([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  // Resetear a página 1 cuando cambie la búsqueda
  useEffect(() => {
    setPage(1)
  }, [committedSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCommittedSearch(searchTerm)
  }

  // Ya no necesitamos filtrado local porque se hace en la base de datos
  const filteredClientes = clientes

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      contact: ''
    })
    setEditingCliente(null)
    setShowForm(false)
    setError('')
  }

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.type.trim()) {
      showNotification('error', 'Por favor completa todos los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    
    try {
      if (editingCliente) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from('partners')
          .update({
            name: formData.name.trim(),
            type: formData.type.trim(),
            contact: formData.contact.trim()
          })
          .eq('id', editingCliente.id)

        if (error) {
          console.error('Error updating cliente:', error)
          showNotification('error', `Error al actualizar: ${error.message}`)
          return
        }

        // Refrescar la lista y resetear a página 1 si es necesario
        await fetchClientes()
        if (page > 1 && total <= (page - 1) * pageSize) {
          setPage(page - 1)
        }
        showNotification('success', 'Cliente actualizado exitosamente')
      } else {
        // Crear nuevo cliente
        const { error } = await supabase
          .from('partners')
          .insert([{
            name: formData.name.trim(),
            type: formData.type.trim(),
            contact: formData.contact.trim()
          }])

        if (error) {
          console.error('Error creating cliente:', error)
          showNotification('error', `Error al crear: ${error.message}`)
          return
        }

        showNotification('success', 'Cliente creado exitosamente')
        // Refrescar la lista y ir a la última página
        await fetchClientes()
        const lastPage = Math.ceil((total + 1) / pageSize)
        if (lastPage > page) {
          setPage(lastPage)
        }
      }

      resetForm()
    } catch (error) {
      console.error('Unexpected error:', error)
      showNotification('error', 'Error inesperado al guardar el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      name: cliente.name,
      type: cliente.type,
      contact: cliente.contact
    })
    setShowForm(true)
  }

  const handleDelete = async (cliente: Cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!clienteToDelete) return

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', clienteToDelete.id)

      if (error) {
        console.error('Error deleting cliente:', error)
        showNotification('error', `Error al eliminar: ${error.message}`)
        return
      }

      // Refrescar la lista y ajustar página si es necesario
      await fetchClientes()
      if (page > 1 && total <= (page - 1) * pageSize) {
        setPage(page - 1)
      }
      showNotification('success', 'Cliente eliminado exitosamente')
      setShowDeleteModal(false)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Unexpected error:', error)
      showNotification('error', 'Error inesperado al eliminar el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-sm">Cargando clientes...</p>
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
            onClick={fetchClientes}
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
              Gestión de Clientes
            </h1>
            <p className="text-slate-600 text-lg">
              Administra tu base de clientes y proveedores • {total} registros disponibles
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda moderna y elegante */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar clientes por nombre, tipo o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-slate-700 text-base placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Buscar
          </button>
          {committedSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setCommittedSearch('')
              }}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 font-semibold"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Formulario moderno */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button 
              onClick={resetForm}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({
                      ...formData, 
                      type: e.target.value,
                      name: (!editingCliente && e.target.value === 'proveedor') ? '' : formData.name
                    })
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nombre *
                </label>
                {formData.type === 'proveedor' ? (
                  <div className="space-y-3">
                    {editingCliente ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                        placeholder="Nombre del proveedor"
                        required
                      />
                    ) : (
                      <select
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                        required
                      >
                        <option value="">Seleccionar proveedor</option>
                        {PROVEEDORES_PREDEFINIDOS.map(proveedor => (
                          <option key={proveedor} value={proveedor}>
                            {proveedor}
                          </option>
                        ))}
                      </select>
                    )}
                    {editingCliente && (
                      <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200">
                        💡 Puedes modificar el nombre del proveedor libremente
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                    placeholder="Ej: Cliente Final - Juan Pérez"
                    required
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Contacto
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700" 
                placeholder={formData.type === 'proveedor' ? 'Email de contacto del proveedor' : 'Email, teléfono o dirección del cliente'}
              />
            </div>

            <div className="flex gap-4 justify-end pt-6">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {editingCliente ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de clientes moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Nombre</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Tipo</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Contacto</th>
                <th className="text-center p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                        <Users size={32} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {committedSearch ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                      </h3>
                      <p className="text-slate-600 text-lg">
                        {committedSearch ? 'Intenta ajustar los términos de búsqueda' : 'Comienza creando tu primer cliente'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50 transition-all duration-200 group">
                    <td className="p-6">
                      <div className="font-semibold text-slate-800 text-lg">{cliente.name}</div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-medium ${
                        cliente.type === 'cliente' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        cliente.type === 'proveedor' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {cliente.type}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-700">{cliente.contact || '-'}</span>
                      </div>
                    </td>
                                         <td className="p-6 text-center">
                       <div className="flex justify-center gap-2">
                         <button 
                           className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 border border-blue-200"
                           onClick={() => handleEdit(cliente)}
                           title="Editar"
                         >
                           <Edit size={18} />
                         </button>
                         <button 
                           className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 border border-red-200"
                           onClick={() => handleDelete(cliente)}
                           title="Eliminar"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            {total > 0 ? (
              <>Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total} clientes</>
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

      <ConfirmDialog
        open={showDeleteModal && !!clienteToDelete}
        title="Eliminar cliente"
        description={clienteToDelete ? `Se eliminará el cliente "${clienteToDelete.name}".` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isSubmitting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!isSubmitting) { setShowDeleteModal(false); setClienteToDelete(null) } }}
      />

      {/* Notificaciones Toast modernas */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : notification.type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
        } rounded-2xl shadow-2xl p-4 transform transition-all duration-300 ease-in-out`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : notification.type === 'error' ? (
              <AlertTriangle size={20} />
            ) : (
              <Users size={20} />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  )
} 