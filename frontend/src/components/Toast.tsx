import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
type Toast = { id: number; title?: string; message: string; kind: ToastKind; duration?: number }

type ToastContextType = {
  show: (message: string, kind?: ToastKind, title?: string, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = (message: string, kind: ToastKind = 'info', title?: string, durationMs = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, kind, title, duration: durationMs }])
    setTimeout(() => dismiss(id), durationMs)
  }

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const value = useMemo(() => ({ show }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`max-w-sm w-full transform transition-all duration-300 ease-in-out ${
              t.kind === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : t.kind === 'error'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            } rounded-2xl shadow-2xl p-4`}
          >
            <div className="flex items-center gap-3">
              {t.kind === 'success' ? (
                <CheckCircle2 size={20} />
              ) : t.kind === 'error' ? (
                <TriangleAlert size={20} />
              ) : (
                <Info size={20} />
              )}
              <div className="flex-1">
                {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                <div className="text-sm font-medium">{t.message}</div>
              </div>
              <button 
                className="text-white/80 hover:text-white transition-colors duration-200" 
                onClick={() => dismiss(t.id)} 
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}


