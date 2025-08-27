// src/hooks/useErrorHandler.ts
import { useCallback } from 'react'
import { useToast } from '../components/Toast'

type ErrorInfo = {
  message?: string
  context?: string
  shouldLog?: boolean
}

export function useErrorHandler() {
  const toast = useToast()

  const handleError = useCallback((error: unknown, info?: ErrorInfo) => {
    const { message, context = 'Error', shouldLog = true } = info || {}
    
    let errorMessage = message || 'Ha ocurrido un error inesperado'
    
    // Procesar diferentes tipos de errores
    if (error instanceof Error) {
      if (shouldLog) {
        console.error(`${context}:`, error)
      }
      
      // Mensajes específicos para errores conocidos
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'La operación tardó demasiado. Inténtalo de nuevo.'
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorMessage = 'No tienes permisos para realizar esta acción.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'El recurso solicitado no fue encontrado.'
      } else if (message) {
        // Si se proporciona un mensaje personalizado, usarlo
        errorMessage = message
      } else {
        // Usar el mensaje del error si no hay uno personalizado
        errorMessage = error.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
      if (shouldLog) {
        console.error(`${context}:`, error)
      }
    } else {
      if (shouldLog) {
        console.error(`${context}:`, error)
      }
    }

    // Mostrar toast de error
    toast.show(errorMessage, 'error', context)
  }, [toast])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    info?: ErrorInfo
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, info)
      return null
    }
  }, [handleError])

  const handleSupabaseError = useCallback((error: any, context: string) => {
    if (error) {
      let message = 'Error en la base de datos'
      
      // Mensajes específicos para errores de Supabase
      if (error.code === 'PGRST116') {
        message = 'No se encontraron datos'
      } else if (error.code === '23505') {
        message = 'Ya existe un registro con esos datos'
      } else if (error.code === '23503') {
        message = 'No se puede eliminar porque está siendo usado'
      } else if (error.message) {
        message = error.message
      }
      
      handleError(error, { message, context, shouldLog: true })
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
    handleSupabaseError
  }
}

// Hook para operaciones específicas de carga de datos
export function useDataLoader() {
  const { handleError } = useErrorHandler()

  const loadData = useCallback(async <T>(
    loader: () => Promise<T>,
    setData: (data: T) => void,
    setLoading: (loading: boolean) => void,
    context: string
  ) => {
    try {
      setLoading(true)
      const data = await loader()
      setData(data)
    } catch (error) {
      handleError(error, { context })
    } finally {
      setLoading(false)
    }
  }, [handleError])

  return { loadData }
}
