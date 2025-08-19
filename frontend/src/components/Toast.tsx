import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info' | 'warning'
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
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Componente individual de Toast
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Esperar a que termine la animación
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.duration, onDismiss])

  const iconMap = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />,
    warning: <AlertTriangle size={20} className="text-yellow-500" />
  }

  const bgColorMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }

  return (
    <div className={`transform transition-smooth ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className={`${bgColorMap[toast.kind]} border rounded-lg shadow-mobile-lg p-4 flex items-start gap-3 max-w-sm`}>
        <div className="flex-shrink-0 mt-0.5">
          {iconMap[toast.kind]}
        </div>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className={`text-sm font-semibold ${textColorMap[toast.kind]} mb-1`}>
              {toast.title}
            </div>
          )}
          <p className={`text-sm font-medium ${textColorMap[toast.kind]}`}>
            {toast.message}
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onDismiss, 300)
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white hover:bg-opacity-50 transition-smooth touch-target"
        >
          <X size={16} className={textColorMap[toast.kind]} />
        </button>
      </div>
    </div>
  )
}

// Componente Toast simple para uso directo (opcional)
export default function Toast({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  show = true 
}: {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
  show?: boolean
}) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const iconMap = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />,
    warning: <AlertTriangle size={20} className="text-yellow-500" />
  }

  const bgColorMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }

  if (!isVisible) return null

  return (
    <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 transition-smooth ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className={`${bgColorMap[type]} border rounded-lg shadow-mobile-lg p-4 flex items-start gap-3`}>
        <div className="flex-shrink-0 mt-0.5">
          {iconMap[type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColorMap[type]}`}>
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white hover:bg-opacity-50 transition-smooth touch-target"
        >
          <X size={16} className={textColorMap[type]} />
        </button>
      </div>
    </div>
  )
}


