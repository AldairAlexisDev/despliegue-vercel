import type { ReactNode } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { LogOut, Box } from 'lucide-react'
import { useEffect } from 'react'
import useAuthKeepAlive from '../hooks/useAuthKeepAlive'

export default function VendorLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  useAuthKeepAlive()

  useEffect(() => {
    const ensureVendor = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        navigate('/')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle()
      const role = (data?.role as any) ?? null
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      }
    }
    ensureVendor()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      navigate('/')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <Box size={20} className="text-blue-600" /> Inventario
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}


