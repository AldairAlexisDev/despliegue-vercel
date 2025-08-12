// src/hooks/useLogin.ts
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'  // o '../lib/supabaseClient'

export default function useLogin() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')  // email o username
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1) Resuelvo identifier → email
    let emailToUse = identifier.trim()
    const isEmail = emailToUse.includes('@')

    if (!isEmail) {
      // busco en users por username
      const { data: userByName, error: nameErr } = await supabase
        .from('users')
        .select('email')
        .eq('username', identifier.trim())
        .maybeSingle()

      if (nameErr || !userByName?.email) {
        setError('Usuario no encontrado')
        setLoading(false)
        return
      }
      emailToUse = userByName.email
    }

    // 2) Hago login en Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email:    emailToUse,
      password,
    })
    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('No se pudo obtener el ID del usuario.')
      setLoading(false)
      return
    }

    // 3) Busco rol en tabla users
    const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (userErr || !userData?.role) {
    setError('No tienes permisos asignados o el usuario no está registrado.')
    setLoading(false)
    return
  }
  
  if (userData.role === 'admin') {
    navigate('/admin')
  } else if (userData.role === 'vendedor') {
    navigate('/inventario')
  } else {
    setError('Tu cuenta no tiene permisos válidos.')
  }

    setLoading(false)
  }

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
  }
}
