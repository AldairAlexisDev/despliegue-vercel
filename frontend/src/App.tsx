// src/App.tsx
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import VendorLayout from './layouts/VendorLayout'

import AdminDashboard from './pages/admin/AdminDashboard'
import InventarioPage from './pages/admin/InventarioPage'
import ProductosPage from './pages/admin/ProductosPage'
import MarcasPage from './pages/admin/MarcasPage'
import NotasPedidoPage from './pages/admin/OrdenesPage'
import ClientesPage from './pages/admin/ClientesPage'
import UsuariosPage from './pages/admin/UsuariosPage'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
