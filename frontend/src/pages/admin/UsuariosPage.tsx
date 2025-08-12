import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Save, Search, Shield, UserPlus, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

type AppUser = {
  id: string
  email: string
  name: string
  username: string
  role: 'admin' | 'vendedor'
  created_at?: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    role: 'vendedor' as 'admin' | 'vendedor'
  })

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    show: boolean
  }>({ type: 'info', message: '', show: false })

  useEffect(() => {
    fetchUsers()
  }, [])

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ email: '', name: '', username: '', password: '', role: 'vendedor' })
    showNotification('info', 'Formulario cerrado')
  }

  const clearSearch = () => {
    setSearch('')
    showNotification('info', 'Búsqueda limpiada')
  }

  async function fetchUsers() {
    try {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, username, role, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data || []) as AppUser[])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(user: AppUser) {
    // evitar eliminarse a sí mismo
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user?.id === user.id) {
      showNotification('error', 'No puedes eliminar tu propia cuenta desde aquí.')
      return
    }

    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  function generatePassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+' // sin caracteres confusos
    let pwd = ''
    for (let i = 0; i < length; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)]
    }
    setForm({ ...form, password: pwd })
    showNotification('info', 'Contraseña generada automáticamente')
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim() || !form.username.trim() || !form.password || !form.name.trim()) {
      showNotification('error', 'Completa nombre, email, usuario y contraseña')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Guardar sesión del admin para restaurarla luego (signUp cambia la sesión actual)
      const { data: current } = await supabase.auth.getSession()
      const adminAccessToken = current.session?.access_token
      const adminRefreshToken = current.session?.refresh_token

      // 1) Crear usuario en Auth (requiere que el proyecto permita signUp desde el cliente)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { username: form.username, name: form.name, role: form.role },
        },
      })
      if (signUpErr) throw signUpErr

      const authUserId = signUpData.user?.id
      if (!authUserId) throw new Error('No se pudo obtener el ID del usuario creado.')

      // 2) Registrar fila en tabla application users (perfil/roles)
      const { error: insertErr } = await supabase
        .from('users')
        .insert([{ id: authUserId, email: form.email.trim(), name: form.name.trim(), username: form.username.trim(), role: form.role }])

      if (insertErr) throw insertErr

      setShowForm(false)
      setForm({ email: '', name: '', username: '', password: '', role: 'vendedor' })
      await fetchUsers()
      showNotification('success', 'Usuario creado correctamente.')

      // Restaurar sesión del admin si la perdimos por el signUp
      if (adminAccessToken && adminRefreshToken) {
        await supabase.auth.setSession({ access_token: adminAccessToken, refresh_token: adminRefreshToken })
      }
    } catch (err: any) {
      console.error(err)
      showNotification('error', err.message || 'Error al crear usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      {/* Header mejorado */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Shield size={32} className="text-blue-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Crea y administra los usuarios de la aplicación de manera segura</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <UserPlus size={24} />
            <span className="font-semibold text-lg">Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Alerta de error mejorada */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {/* Formulario de creación mejorado */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Registrar nuevo usuario</h2>
            <button 
              onClick={closeForm} 
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200 text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Nombre y apellidos"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="ej. jperez"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña *</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200 bg-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      aria-label="toggle-password"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => generatePassword()}
                    className="px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 font-medium"
                  >
                    Generar
                  </button>
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-2">
                  💡 Puedes generar una contraseña segura y compartirla al usuario.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'vendedor' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:opacity-60 disabled:transform-none"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Registrar
              </button>
              <button 
                type="button" 
                onClick={closeForm} 
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador mejorado */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="Buscar por email, usuario o rol"
            />
          </div>
          {search && (
            <button 
              onClick={clearSearch} 
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors duration-200 font-medium"
              title="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
          <button 
            onClick={fetchUsers} 
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <Plus size={18} /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabla/Lista de usuarios mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-left p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Usuario</th>
                <th className="text-left p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Email</th>
                <th className="text-left p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Nombre</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Rol</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Creado</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Shield size={32} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">No hay usuarios</p>
                      <p className="text-sm text-gray-400 mt-1">Comienza creando tu primer usuario</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-all duration-200 group">
                    <td className="p-6">
                      <div className="font-semibold text-gray-800 text-lg">{u.username}</div>
                    </td>
                    <td className="p-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-700">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-medium text-gray-800">{u.name}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                        u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={deletingId === u.id}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          {deletingId === u.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
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

      {/* Información adicional mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Shield size={20} />
          <span className="font-medium">
            Mostrando {filtered.length} de {users.length} usuarios
          </span>
        </div>
      </div>

             {/* Confirmación de eliminación */}
       <ConfirmDialog
         open={showDeleteModal}
         onConfirm={async () => {
           if (!userToDelete) return
           try {
             setDeletingId(userToDelete.id)
             const { error } = await supabase
               .from('users')
               .delete()
               .eq('id', userToDelete.id)

             if (error) throw error
             setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
             showNotification('success', `Usuario "${userToDelete.username}" eliminado correctamente.`)
           } catch (err: any) {
             console.error(err)
             showNotification('error', err.message || 'No se pudo eliminar el usuario')
           } finally {
             setDeletingId(null)
             setShowDeleteModal(false)
             setUserToDelete(null)
           }
         }}
         onCancel={() => {
           setShowDeleteModal(false)
           setUserToDelete(null)
         }}
         title="Confirmar eliminación"
         description={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.username}"? Esta acción no se puede deshacer.`}
         confirmText="Eliminar"
         cancelText="Cancelar"
         variant="danger"
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


