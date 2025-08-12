import { useEffect } from 'react'
import { supabase } from '../supabase'

// Mantiene viva la sesión refrescando el token periódicamente
export default function useAuthKeepAlive(intervalMs: number = 5 * 60 * 1000) {
  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        await supabase.auth.refreshSession()
      } catch {
        // ignorar errores esporádicos de red
      }
    }

    // Intervalo periódico
    const timer = setInterval(() => {
      if (!cancelled) refresh()
    }, intervalMs)

    // Al volver a foco/online, refrescar
    const onFocus = () => refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const onOnline = () => refresh()

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    // Primer refresco al montar
    refresh()

    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [intervalMs])
}


