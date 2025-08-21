// src/pages/admin/InventarioPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Search, Package, FileSpreadsheet } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

type Producto = {
  id: string
  name: string
  stock: number
  brand: string
  brand_id?: string
  model: string
  created_at?: string
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchProductos()

         // Suscripción en tiempo real a cambios en products
     const channel = supabase
       .channel('products-realtime')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => {
         // Para productos nuevos, simplemente recargar todo (más eficiente)
         fetchProductos()
       })
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, () => {
         // Para productos actualizados, simplemente recargar todo (más eficiente)
         fetchProductos()
       })
       .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload: any) => {
         setProductos(prev => prev.filter(p => p.id !== payload.old.id))
       })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
         // Recargar productos cuando cambien las marcas para actualizar nombres
         fetchProductos()
       })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchProductos() {
    try {
      setLoading(true)
      setError('')
      
      // Usamos un JOIN directo para obtener productos con marcas en una sola consulta
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          stock, 
          brand_id, 
          model, 
          created_at,
          brands!left(name)
        `)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching productos:', error)
        setError(`Error al cargar productos: ${error.message}`)
        return
      }

      if (data) {
        // Transformar los datos para mantener compatibilidad
        const productsWithBrands = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          stock: product.stock,
          brand_id: product.brand_id,
          model: product.model,
          created_at: product.created_at,
          brand: product.brands?.name || 'Sin marca'
        }))
        
        setProductos(productsWithBrands)
      } else {
        setProductos([])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return productos.filter(producto =>
      producto.name.toLowerCase().includes(q) ||
      producto.brand.toLowerCase().includes(q) ||
      producto.model.toLowerCase().includes(q)
    )
  }, [productos, searchTerm])

  // Función para exportar a Excel con estilos profesionales
  const exportToExcel = async () => {
    try {
      setExporting(true)
      
      // Crear un nuevo workbook
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Inventario')
      
      // Definir las columnas con estilos
      worksheet.columns = [
        { header: 'N°', key: 'numero', width: 8 },
        { header: 'Nombre del Producto', key: 'nombre', width: 35 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Stock Actual', key: 'stock', width: 15 }
      ]
      
      // Estilo para el header
      const headerRow = worksheet.getRow(1)
      headerRow.height = 30
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E40AF' } // Azul oscuro
        }
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' }, // Blanco
          size: 12
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF3B82F6' } },
          bottom: { style: 'thin', color: { argb: 'FF3B82F6' } },
          left: { style: 'thin', color: { argb: 'FF3B82F6' } },
          right: { style: 'thin', color: { argb: 'FF3B82F6' } }
        }
      })
      
      // Agregar datos con estilos
      productos.forEach((producto, index) => {
        const row = worksheet.addRow({
          numero: index + 1,
          nombre: producto.name,
          marca: producto.brand,
          modelo: producto.model,
          stock: producto.stock
        })
        
        // Estilos para cada fila
        row.height = 25
        row.eachCell((cell, colNumber) => {
          // Bordes para todas las celdas
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          }
          
          // Estilos específicos por columna
          if (colNumber === 1) { // Número
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            cell.font = { bold: true, color: { argb: 'FF1E40AF' } }
          } else if (colNumber === 5) { // Stock
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            cell.font = { bold: true }
            if (producto.stock > 2) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } } // Verde claro
              cell.font.color = { argb: 'FF166534' } // Verde oscuro
            } else if (producto.stock > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } } // Amarillo claro
              cell.font.color = { argb: 'FF92400E' } // Amarillo oscuro
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } // Rojo claro
              cell.font.color = { argb: 'FF991B1B' } // Rojo oscuro
            }
          } else {
            cell.alignment = { vertical: 'middle' }
          }
        })
      })
      
      // Agregar título principal
      const titleRow = worksheet.addRow(['INVENTARIO DE PRODUCTOS - NUEVA ERA'])
      titleRow.height = 40
      const titleCell = titleRow.getCell(1)
      titleCell.font = {
        bold: true,
        size: 16,
        color: { argb: 'FF1E40AF' }
      }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Agregar información de exportación
      const infoRow = worksheet.addRow([`Exportado el: ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} • Total de productos: ${productos.length}`])
      infoRow.height = 25
      const infoCell = infoRow.getCell(1)
      infoCell.font = {
        italic: true,
        size: 10,
        color: { argb: 'FF6B7280' }
      }
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Ajustar el header para que esté en la fila 3
      const newHeaderRow = worksheet.getRow(3)
      newHeaderRow.height = 30
      newHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E40AF' }
        }
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 12
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF3B82F6' } },
          bottom: { style: 'thin', color: { argb: 'FF3B82F6' } },
          left: { style: 'thin', color: { argb: 'FF3B82F6' } },
          right: { style: 'thin', color: { argb: 'FF3B82F6' } }
        }
      })
      
      // Generar el archivo Excel
      const buffer = await workbook.xlsx.writeBuffer()
      const data = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Generar nombre del archivo con fecha
      const today = new Date()
      const fileName = `Inventario_NuevaEra_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}_${String(today.getHours()).padStart(2, '0')}-${String(today.getMinutes()).padStart(2, '0')}.xlsx`
      
      // Descargar el archivo
      saveAs(data, fileName)
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(`✅ Inventario exportado exitosamente a "${fileName}"`)
      }, 100)
      
    } catch (error) {
      console.error('Error exportando a Excel:', error)
      alert('❌ Error al exportar el inventario. Por favor, inténtalo de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-sm">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <button 
            onClick={fetchProductos}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-8">
      {/* Header elegante y moderno */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
              Control de Inventario
            </h1>
            <p className="text-slate-600 text-lg">
              Monitorea y gestiona el stock de tus productos • {productos.length} productos en total
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{productos.length}</div>
              <div className="text-sm text-slate-600">Total Productos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {productos.filter(p => p.stock > 2).length}
              </div>
              <div className="text-sm text-slate-600">Stock Alto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {productos.filter(p => p.stock > 0 && p.stock <= 2).length}
              </div>
              <div className="text-sm text-slate-600">Stock Bajo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {productos.filter(p => p.stock === 0).length}
              </div>
              <div className="text-sm text-slate-600">Sin Stock</div>
            </div>
            
            {/* Botón de Exportación a Excel */}
            <div className="flex-shrink-0">
              <button
                onClick={exportToExcel}
                disabled={exporting || productos.length === 0}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                title="Exportar inventario a Excel"
              >
                {exporting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={20} />
                )}
                <span className="font-semibold">
                  {exporting ? 'Exportando...' : 'Exportar a Excel'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

             {/* Búsqueda */}
       <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
         <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
           <div className="relative w-full md:w-96">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
             <input
               type="text"
               placeholder="Buscar por nombre, marca o modelo..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-slate-700 text-base placeholder-slate-400"
             />
           </div>
         </div>
        
        
      </div>

      {/* Tabla de productos moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Nombre</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Marca</th>
                <th className="text-left p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Modelo</th>
                <th className="text-right p-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                        <Package size={32} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {searchTerm ? 'No se encontraron productos' : 'No hay productos en el inventario'}
                      </h3>
                      <p className="text-slate-600 text-lg">
                        {searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Los productos aparecerán aquí cuando sean creados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProductos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-all duration-200 group">
                    <td className="p-6">
                      <div className="font-semibold text-slate-800 text-lg">{prod.name}</div>
                      {prod.created_at && (
                        <div className="text-sm text-slate-500 mt-1">
                          Creado: {new Date(prod.created_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <span className="inline-flex px-4 py-2 rounded-xl bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200">
                        {prod.brand}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <span className="font-medium text-slate-800">{prod.model}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold ${
                        prod.stock > 2 ? 'bg-green-100 text-green-700 border border-green-200' :
                        prod.stock > 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {prod.stock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional moderna */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <span className="text-slate-600 font-medium text-sm">
            Mostrando {filteredProductos.length} de {productos.length} productos
          </span>
        </div>
      </div>
    </div>
  )
}
