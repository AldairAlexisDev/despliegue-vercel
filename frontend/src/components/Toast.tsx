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

  const show = (message: string, kind: ToastKind = 'info', title?: string, durationMs = 3500) => {
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
            className={`relative flex items-start gap-3 rounded-xl shadow-lg border p-4 w-[320px] backdrop-blur bg-white/95
              ${t.kind === 'success' ? 'border-green-200' : t.kind === 'error' ? 'border-red-200' : 'border-blue-200'}`}
          >
            <div className={`mt-0.5 ${t.kind === 'success' ? 'text-green-600' : t.kind === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
              {t.kind === 'success' ? <CheckCircle2 size={20} /> : t.kind === 'error' ? <TriangleAlert size={20} /> : <Info size={20} />}
            </div>
            <div className="flex-1">
              {t.title && <div className="text-sm font-semibold text-gray-800">{t.title}</div>}
              <div className="text-sm text-gray-700">{t.message}</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}


