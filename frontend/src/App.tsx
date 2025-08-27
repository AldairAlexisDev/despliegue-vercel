// src/App.tsx
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Componentes que siempre se cargan
import { ToastProvider } from './components/Toast'

// Lazy loading para todos los componentes pesados
const Login = lazy(() => import('./pages/Login'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const VendorLayout = lazy(() => import('./layouts/VendorLayout'))

// Páginas admin con lazy loading
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const InventarioPage = lazy(() => import('./pages/admin/InventarioPage'))
const ProductosPage = lazy(() => import('./pages/admin/ProductosPage'))
const MarcasPage = lazy(() => import('./pages/admin/MarcasPage'))
const NotasPedidoPage = lazy(() => import('./pages/admin/OrdenesPage'))
const ClientesPage = lazy(() => import('./pages/admin/ClientesPage'))
const UsuariosPage = lazy(() => import('./pages/admin/UsuariosPage'))

// Componente de Loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg font-medium">Cargando...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/" element={<Login />} />

            {/* Rutas protegidas - Admin */}
            <Route element={<AdminLayout />}>
              <Route path="admin" index element={<AdminDashboard />} />
              <Route path="admin/productos" element={<ProductosPage />} />
              <Route path="admin/marcas" element={<MarcasPage />} />
              <Route path="admin/clientes" element={<ClientesPage />} />
              <Route path="admin/notas-pedido" element={<NotasPedidoPage />} />
              <Route path="admin/usuarios" element={<UsuariosPage />} />
              <Route path="admin/inventario" element={<InventarioPage />} />
            </Route>

            {/* Rutas protegidas - Vendedor */}
            <Route element={<VendorLayout />}>
              <Route path="inventario" element={<InventarioPage />} />
            </Route>

            {/* Redirigir cualquier otra ruta al login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}
