// src/pages/Login.tsx
import AuthLayout from '../layouts/AuthLayout'

import useLogin from '../hooks/useLogin'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const {
    identifier,      // antes era email
    password,
    loading,
    error,
    setIdentifier,   // antes era setEmail
    setPassword,
    handleLogin,
  } = useLogin()

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        {/* Header elegante y moderno */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200">
            <LogIn size={32} className="text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-slate-600 text-lg">
            Accede a tu panel de administración
          </p>
        </div>

        {/* Formulario moderno */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Correo o usuario *
              </label>
              <input
                type="text"
                placeholder="ejemplo@correo.com o tuUsuario"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700 placeholder-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-700 placeholder-slate-400"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Información adicional */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Sistema de Gestión Nueva Era
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
