import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Home,
  Package,
  Users,
  Box,
  Tag,
  FileText,
  LogOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'vendedor' | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchRole = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const id = auth.user?.id
      if (!id) return
      const { data } = await supabase.from('users').select('role').eq('id', id).maybeSingle()
      if (isMounted) setRole((data?.role as any) ?? null)
    }
    fetchRole()
    // También actualizar cuando cambie la sesión
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchRole()
    })
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // opcional: podrías mostrar un toast
      console.error('Error al cerrar sesión', err);
    } finally {
      navigate('/');
    }
  };

  const allLinks = [
    { to: '/admin', label: 'Panel principal', icon: Home, roles: ['admin'] as const },
    { to: '/admin/productos', label: 'Productos', icon: Package, roles: ['admin'] as const },
    { to: '/admin/marcas', label: 'Marcas', icon: Tag, roles: ['admin'] as const },
    { to: '/admin/clientes', label: 'Clientes', icon: Users, roles: ['admin'] as const },
    { to: '/admin/inventario', label: 'Inventario', icon: Box, roles: ['admin', 'vendedor'] as const },
    { to: '/admin/notas-pedido', label: 'Notas de Pedido', icon: FileText, roles: ['admin'] as const },
    { to: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] as const },
  ]
  const links = allLinks.filter(l => (role ? (l.roles as readonly string[]).includes(role) : true))

  return (
    <aside className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && <h1 className="text-xl font-bold">Nueva Era</h1>}
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto">
        <ul className="space-y-2 px-2">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700 ${
                    isActive ? 'bg-blue-100 text-blue-600' : ''
                  }`
                }
              >
                <Icon size={20} />
                {!collapsed && <span className="ml-3">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button onClick={handleLogout} className="w-full text-left flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
          <LogOut size={20} />
          {!collapsed && <span className="ml-3">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
