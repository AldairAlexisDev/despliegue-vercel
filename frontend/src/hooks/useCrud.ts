// src/hooks/useCrud.ts
import { useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useErrorHandler } from './useErrorHandler'
import { useToast } from '../components/Toast'

export function useCrud<T = any>(tableName: string) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { handleSupabaseError } = useErrorHandler()
  const toast = useToast()

  // Crear registro
  const create = useCallback(async (data: Partial<T>, successMessage?: string): Promise<T | null> => {
    setSaving(true)
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, `Error al crear ${tableName}`)
        return null
      }

      if (successMessage) {
        toast.show(successMessage, 'success', 'Éxito')
      }
      
      return result as T
    } catch (error) {
      handleSupabaseError(error, `Error al crear ${tableName}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [tableName, handleSupabaseError, toast])

  // Actualizar registro
  const update = useCallback(async (
    id: string, 
    data: Partial<T>, 
    successMessage?: string
  ): Promise<T | null> => {
    setSaving(true)
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, `Error al actualizar ${tableName}`)
        return null
      }

      if (successMessage) {
        toast.show(successMessage, 'success', 'Éxito')
      }
      
      return result as T
    } catch (error) {
      handleSupabaseError(error, `Error al actualizar ${tableName}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [tableName, handleSupabaseError, toast])

  // Eliminar registro
  const remove = useCallback(async (id: string, successMessage?: string): Promise<boolean> => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) {
        handleSupabaseError(error, `Error al eliminar ${tableName}`)
        return false
      }

      if (successMessage) {
        toast.show(successMessage, 'success', 'Éxito')
      }
      
      return true
    } catch (error) {
      handleSupabaseError(error, `Error al eliminar ${tableName}`)
      return false
    } finally {
      setDeleting(false)
    }
  }, [tableName, handleSupabaseError, toast])

  // Cargar registros con filtros opcionales
  const load = useCallback(async (
    options?: {
      select?: string
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
    }
  ): Promise<T[] | null> => {
    setLoading(true)
    try {
      let query = supabase.from(tableName)

      // Seleccionar campos específicos
      if (options?.select) {
        query = query.select(options.select)
      } else {
        query = query.select('*')
      }

      // Aplicar filtros
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Ordenamiento
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
      }

      // Límite
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, `Error al cargar ${tableName}`)
        return null
      }

      return data as T[]
    } catch (error) {
      handleSupabaseError(error, `Error al cargar ${tableName}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [tableName, handleSupabaseError])

  // Cargar un solo registro por ID
  const loadById = useCallback(async (
    id: string, 
    select?: string
  ): Promise<T | null> => {
    setLoading(true)
    try {
      let query = supabase.from(tableName)
      
      if (select) {
        query = query.select(select)
      } else {
        query = query.select('*')
      }

      const { data, error } = await query
        .eq('id', id)
        .single()

      if (error) {
        handleSupabaseError(error, `Error al cargar ${tableName}`)
        return null
      }

      return data as T
    } catch (error) {
      handleSupabaseError(error, `Error al cargar ${tableName}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [tableName, handleSupabaseError])

  return {
    // Estados
    loading,
    saving,
    deleting,
    
    // Operaciones CRUD
    create,
    update,
    remove,
    load,
    loadById
  }
}

// Hook especializado para productos
export function useProducts() {
  return useCrud<{
    id: string
    name: string
    stock: number
    brand_id: string
    model: string
    created_at?: string
  }>('products')
}

// Hook especializado para marcas
export function useBrands() {
  return useCrud<{
    id: string
    name: string
    created_at?: string
  }>('brands')
}

// Hook especializado para partners/clientes
export function usePartners() {
  return useCrud<{
    id: string
    name: string
    type: string
    contact: string
    created_at?: string
  }>('partners')
}
