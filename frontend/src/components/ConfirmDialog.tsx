import { PropsWithChildren } from 'react'
import { X, Loader2 } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: PropsWithChildren<ConfirmDialogProps>) {
  if (!open) return null

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[95%] max-w-md rounded-xl bg-white shadow-xl border p-5 animate-[fadeIn_150ms_ease-out]"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button className="p-1 rounded hover:bg-gray-100" onClick={onCancel} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${confirmClasses} disabled:opacity-60`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple keyframes for fade-in, Tailwind can be extended but we keep inline for simplicity
declare global {
  interface CSSStyleDeclaration {
    // no-op to satisfy TS in some setups
  }
}


