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
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Cerrar menú móvil al navegar
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Botón de menú móvil - solo visible en móviles */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-mobile-lg border border-gray-200 touch-target transition-smooth"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para móviles */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-smooth"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar principal */}
      <aside className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-smooth fixed lg:relative z-40 sidebar-mobile ${
        collapsed ? 'w-16' : 'w-64'
      } ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && <h1 className="text-xl font-bold text-gray-800">Nueva Era</h1>}
          <button
            className="p-1 rounded hover:bg-gray-100 hidden lg:block touch-target transition-smooth"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </button>
          {/* Botón de cerrar para móviles */}
          <button
            className="p-1 rounded hover:bg-gray-100 lg:hidden touch-target transition-smooth"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto scrollbar-thin">
          <ul className="space-y-1 px-2 py-4">
            {links.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-smooth touch-target ${
                      isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                    }`
                  }
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span className="ml-3 truncate">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout} 
            className="w-full text-left flex items-center p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-smooth touch-target"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="ml-3">Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
