// src/layouts/AuthLayout.tsx
import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Sección izquierda: formulario centrado */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Sección derecha: imagen o info */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sistema Nueva Era</h2>
          <p className="text-slate-600">Gestión integral de productos, inventario y clientes</p>
        </div>
      </div>
    </div>
  )
}
