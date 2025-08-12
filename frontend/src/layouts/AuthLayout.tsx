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
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#121212] to-[#1f1f1f] text-white p-6">
        <div className="text-center max-w-sm">
          
        </div>
      </div>
    </div>
  )
}
