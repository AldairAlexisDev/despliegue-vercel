// src/layouts/AdminLayout.tsx
import type { ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import useAuthKeepAlive from '../hooks/useAuthKeepAlive'

export default function AdminLayout({ children }: { children?: ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [, setRole] = useState<'admin' | 'vendedor' | null>(null)

    // Mantener viva la sesión mientras la app esté abierta
    useAuthKeepAlive()

    useEffect(() => {
      let isMounted = true
      const ensureAccess = async () => {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          navigate('/')
          return
        }
        const { data } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle()
        const r = (data?.role as any) ?? null
        if (isMounted) setRole(r)

        // Si es vendedor y está dentro de rutas admin, redirigir a /inventario
        if (r === 'vendedor' && location.pathname.startsWith('/admin')) {
          navigate('/inventario', { replace: true })
        }
      }
      ensureAccess()
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) return
        ensureAccess()
      })
      return () => { isMounted = false; sub.subscription.unsubscribe() }
    }, [location.pathname, navigate])

    return (
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 bg-gray-50 p-6 overflow-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    )
  }
