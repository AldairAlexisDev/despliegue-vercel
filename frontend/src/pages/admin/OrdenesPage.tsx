// src/pages/admin/NotasPedidoPage.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Loader2, Plus, Search, Edit, Trash2, X, Save, Wallet, ShoppingCart, Package, AlertCircle, ArrowUpDown, FileText } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'

type NotaPedido = {
  id: string
  type: 'venta' | 'compra' | 'prestamo' | 'devolucion' | 'pase'
  created_by: string
  approved_by?: string
  partner_id?: string
  created_at: string
  fecha_pedido?: string // Fecha personalizada del pedido
  items: NotaPedidoItem[]
  total: number
  estado: 'registrada' | 'confirmada' | 'anulada'
  numero_pedido?: number // Número secuencial para mostrar
  prestamo_tipo?: 'yo_presto' | 'me_prestan' // Solo para préstamos
  devolucion_tipo?: 'yo_devuelvo' | 'me_devuelven' // Solo para devoluciones
  pase_tipo?: 'yo_pase' | 'me_pasen' // Solo para pases
}

type NotaPedidoItem = {
  id: string
  nota_pedido_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

type NotaPedidoForm = {
  type: 'venta' | 'compra' | 'prestamo' | 'devolucion' | 'pase'
  prestamo_tipo?: 'yo_presto' | 'me_prestan' // Solo para préstamos
  devolucion_tipo?: 'yo_devuelvo' | 'me_devuelven' // Solo para devoluciones
  pase_tipo?: 'yo_pase' | 'me_pasen' // Solo para pases
  partner_id?: string
  items: NotaPedidoItem[]
  fecha_pedido: string // Nueva fecha personalizada para el pedido
  numero_pedido?: string // Número de pedido manual del usuario
}

type Producto = {
  id: string
  name: string
  stock: number
  brand: string
  model: string
}

type Partner = {
  id: string
  name: string
  type: string
  contact: string
}

export default function NotasPedidoPage() {
  const toast = useToast()
  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaPedido | null>(null)
  const [formData, setFormData] = useState<NotaPedidoForm>({
    type: 'venta',
    partner_id: '',
    items: [],
    fecha_pedido: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }), // Fecha actual en zona horaria de Lima
    numero_pedido: '' // Número de pedido manual
  })

  // Diálogo de confirmación eliminar
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notaToDelete, setNotaToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Estado para manejar la creación rápida de clientes
  const [quickClientName, setQuickClientName] = useState('')
  const [isCreatingQuickClient, setIsCreatingQuickClient] = useState(false)
  
  

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalNotas: 0,
    ventas: 0,
    compras: 0,
    prestamos: 0,
    devoluciones: 0,
    pases: 0,
    registradas: 0
  })

  // Función helper para manejar fechas en zona horaria de Lima
  const formatDateForLima = (dateString: string) => {
    if (!dateString || dateString === '') {
      return 'Sin fecha'
    }
    
    try {
      // Crear fecha en zona horaria de Lima (UTC-5)
      let date: Date
      
      if (dateString.includes('T')) {
        // Si ya tiene formato ISO, parsear directamente
        date = new Date(dateString)
      } else {
        // Si es solo fecha (YYYY-MM-DD), crear en zona horaria de Lima
        // Esto asegura que la fecha se interprete en hora local de Perú
        date = new Date(dateString + 'T00:00:00-05:00')
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida'
      }
      
      // Formatear en español con zona horaria de Lima
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Lima'
      })
    } catch (error) {
      console.error('Error formateando fecha:', error, dateString)
      return 'Error fecha'
    }
  }

  useEffect(() => {
    fetchNotasPedido()
    fetchProductos()
    fetchPartners()
  }, [])

  

  async function fetchNotasPedido() {
    try {
      setLoading(true)
      setError('')
      
                           const { data, error: err } = await supabase
          .from('orders')
                    .select(`
             id,
             type,
             created_by,
             approved_by,
             partner_id,
             created_at,
             fecha_pedido,
             numero_pedido,
             prestamo_tipo,
             devolucion_tipo,
             pase_tipo,
             order_items (
               id,
               order_id,
               product_id,
               quantity,
               unit_price,
               total_price,
               products (
                 name
               )
             )
           `)
          .order('created_at', { ascending: false })

      if (err) {
        console.error('Error fetching notas de pedido:', err)
        setError(`Error al cargar notas de pedido: ${err.message}`)
        return
      }

      if (data) {
        const notasFormateadas: NotaPedido[] = data.map((nota: any, index: number) => {
          const items: NotaPedidoItem[] = (nota.order_items || []).map((item: any) => ({
            id: item.id,
            nota_pedido_id: item.order_id,
            product_id: item.product_id,
            product_name: item.products?.name || 'Producto no encontrado',
            quantity: item.quantity ?? 0,
            unit_price: item.unit_price ?? 0,
            total_price: item.total_price ?? ((item.quantity ?? 0) * (item.unit_price ?? 0))
          }))

                     return {
             id: nota.id,
             type: nota.type,
             created_by: nota.created_by,
             approved_by: nota.approved_by,
             partner_id: nota.partner_id,
             created_at: nota.created_at,
             fecha_pedido: nota.fecha_pedido,
             prestamo_tipo: nota.prestamo_tipo,
             devolucion_tipo: nota.devolucion_tipo,
             pase_tipo: nota.pase_tipo,
             items,
             total: items.reduce((sum, it) => sum + (it.total_price || 0), 0),
             estado: nota.approved_by ? 'confirmada' : 'registrada',
             numero_pedido: nota.numero_pedido || (data.length - index).toString() // Usar el número manual o generar uno automático como fallback
           }
        })

        setNotasPedido(notasFormateadas)
        calcularEstadisticas(notasFormateadas)
      } else {
        setNotasPedido([])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado al cargar las notas de pedido')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductos() {
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('id, name, stock, brand, model')
        .order('name', { ascending: true })

      if (err) {
        console.error('Error fetching productos:', err)
        return
      }

      if (data) {
        setProductos(data)
      }
    } catch (error) {
      console.error('Unexpected error fetching productos:', error)
    }
  }

  async function fetchPartners() {
    try {
      console.log('🔍 Fetching partners...')
      const { data, error: err } = await supabase
        .from('partners')
        .select('id, name, type, contact')
        .order('name', { ascending: true })

      if (err) {
        console.error('Error fetching partners:', err)
        return
      }

      if (data) {
        console.log('✅ Partners fetched:', data)
        console.log('📊 Partners by type:', {
          clientes: data.filter(p => p.type === 'cliente').length,
          proveedores: data.filter(p => p.type === 'proveedor').length,
          total: data.length
        })
        setPartners(data)
      } else {
        console.log('⚠️ No partners data received')
      }
    } catch (error) {
      console.error('Unexpected error fetching partners:', error)
    }
  }

  function calcularEstadisticas(notasData: NotaPedido[]) {
    const ventas = notasData.filter(n => n.type === 'venta').length
    const compras = notasData.filter(n => n.type === 'compra').length
    const prestamos = notasData.filter(n => n.type === 'prestamo').length
    const devoluciones = notasData.filter(n => n.type === 'devolucion').length
    const pases = notasData.filter(n => n.type === 'pase').length

    setStats({
      totalNotas: notasData.length,
      ventas,
      compras,
      prestamos,
      devoluciones,
      pases,
      registradas: 0 // Ya no se usa estado
    })
  }

  // Determina el signo del ajuste de stock según el tipo de nota
  function getStockDeltaSign(
    type: NotaPedido['type'],
    prestamo?: NotaPedido['prestamo_tipo'],
    devolucion?: NotaPedido['devolucion_tipo'],
    pase?: NotaPedido['pase_tipo']
  ): 1 | -1 | 0 {
    switch (type) {
      case 'compra':
        return 1
      case 'venta':
        return -1
      case 'pase':
        return pase === 'yo_pase' ? -1 : 1
      case 'prestamo':
        return prestamo === 'yo_presto' ? -1 : 1
      case 'devolucion':
        return devolucion === 'yo_devuelvo' ? -1 : 1
      default:
        return 0
    }
  }

  // Ajusta el stock para una colección de items con un signo dado
  async function applyStockAdjustment(
    items: Pick<NotaPedidoItem, 'product_id' | 'quantity'>[],
    sign: 1 | -1
  ) {
    for (const it of items) {
      // Leer stock actual y actualizar de forma simple (suficiente para este escenario)
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', it.product_id)
        .maybeSingle()
      const current = prod?.stock ?? 0
      const newStock = current + sign * (it.quantity || 0)
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', it.product_id)
    }
  }

  const filteredNotas = notasPedido.filter(nota => {
    const matchesSearch = 
      (nota.numero_pedido && nota.numero_pedido.toString().includes(searchTerm)) ||
      nota.items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'todos' || nota.type === filterType
    
    return matchesSearch && matchesType
  })

  const resetForm = () => {
    setFormData({
      type: 'venta',
      partner_id: '',
      prestamo_tipo: undefined,
      devolucion_tipo: undefined,
      pase_tipo: undefined,
      items: [],
      fecha_pedido: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }), // Fecha actual en zona horaria de Lima
      numero_pedido: '' // Limpiar número de pedido
    })
    setEditingNota(null)
    setShowForm(false)
    setError('') // Limpiar errores también
    setQuickClientName('') // Limpiar también el cliente rápido
  }

  const agregarItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: Date.now().toString(),
          nota_pedido_id: '',
          product_id: '',
          product_name: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0
        }
      ]
    })
  }

  const actualizarItem = (index: number, field: keyof NotaPedidoItem, value: any) => {
    const itemsActualizados = [...formData.items]
    
    // Asegurar que el valor no sea null o undefined
    const safeValue = value || ''
    
    itemsActualizados[index] = { ...itemsActualizados[index], [field]: safeValue }
    
    // Calcular total_price
    if (field === 'quantity' || field === 'unit_price') {
      itemsActualizados[index].total_price = 
        (itemsActualizados[index].quantity || 0) * (itemsActualizados[index].unit_price || 0)
    }
    
    // Actualizar nombre del producto si se seleccionó uno
    if (field === 'product_id') {
      const producto = productos.find(p => p.id === safeValue)
      if (producto) {
        itemsActualizados[index].product_name = producto.name || ''
      }
    }
    
    // Solo limpiar el ID del producto si se está escribiendo manualmente el nombre
    // y NO si ya hay un producto seleccionado
    if (field === 'product_name' && !itemsActualizados[index].product_id) {
      // Solo limpiar si no hay un producto seleccionado previamente
      itemsActualizados[index].product_id = ''
    }
    
    setFormData({
      ...formData,
      items: itemsActualizados
    })
  }

  const eliminarItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const calcularTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0)
  }

  // Función para crear cliente/partner rápidamente
  const crearClienteRapido = async (nombrePartner: string) => {
    if (!nombrePartner.trim()) {
      alert('Por favor ingresa un nombre')
      return
    }

    setIsCreatingQuickClient(true)
    
    try {
      // Determinar el tipo según el contexto
      let partnerType = 'cliente'
      if (formData.type === 'prestamo' && formData.prestamo_tipo === 'me_prestan') {
        partnerType = 'cliente' // Para "me prestan" también usamos cliente
      }
      if (formData.type === 'devolucion' && formData.devolucion_tipo === 'me_devuelven') {
        partnerType = 'cliente' // Para "me devuelven" también usamos cliente
      }
      if (formData.type === 'pase' && formData.pase_tipo === 'me_pasen') {
        partnerType = 'cliente' // Para "me pasen" también usamos cliente
      }

      const { data, error } = await supabase
        .from('partners')
        .insert([{
          name: nombrePartner.trim(),
          type: partnerType,
          contact: ''
        }])
        .select()

      if (error) {
        console.error('Error creating quick partner:', error)
        alert(`Error al crear partner: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        const nuevoPartner = data[0]
        
        // Actualizar la lista de partners
        setPartners([...partners, nuevoPartner])
        
        // Seleccionar automáticamente el nuevo partner
        setFormData({
          ...formData,
          partner_id: nuevoPartner.id
        })
        
        setQuickClientName('')
        const tipoTexto = formData.type === 'prestamo' ? 
          (formData.prestamo_tipo === 'yo_presto' ? 'cliente' : 'partner') : 'cliente'
        alert(`${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} "${nombrePartner}" creado y seleccionado exitosamente`)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Error inesperado al crear el partner')
    } finally {
      setIsCreatingQuickClient(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'venta': return 'bg-green-100 text-green-800'
      case 'compra': return 'bg-blue-100 text-blue-800'
      case 'prestamo': return 'bg-yellow-100 text-yellow-800'
      case 'devolucion': return 'bg-red-100 text-red-800'
      case 'pase': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'venta': return <ShoppingCart size={16} />
      case 'compra': return <Package size={16} />
              case 'prestamo': return <Wallet size={16} />
      case 'devolucion': return <ArrowUpDown size={16} />
      case 'pase': return <FileText size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const getTypeLabel = (type: string, prestamoTipo?: string, devolucionTipo?: string, paseTipo?: string) => {
    switch (type) {
      case 'venta': return 'Venta'
      case 'compra': return 'Compra'
      case 'prestamo': return prestamoTipo === 'yo_presto' ? 'Yo Presto' : prestamoTipo === 'me_prestan' ? 'Me Prestan' : 'Préstamo'
      case 'devolucion': return devolucionTipo === 'yo_devuelvo' ? 'Yo Devuelvo' : devolucionTipo === 'me_devuelven' ? 'Me Devuelven' : 'Devolución'
      case 'pase': return paseTipo === 'yo_pase' ? 'Yo Pase' : paseTipo === 'me_pasen' ? 'Me Pasen' : 'Pase'
      default: return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
         if (formData.items.length === 0) {
       alert('Por favor agrega al menos un producto')
       return
     }

     // Validar que se haya ingresado un número de pedido
     if (!formData.numero_pedido || formData.numero_pedido.trim() === '') {
       alert('Por favor ingresa un número de pedido')
       return
     }

    // Validación diferente para préstamos y devoluciones (sin precio) vs otros tipos (con precio)
    if (formData.type === 'prestamo' || formData.type === 'devolucion') {
      if (formData.items.some(item => !item.product_id || item.quantity <= 0)) {
        alert('Por favor completa todos los productos correctamente (producto y cantidad)')
        return
      }
    } else { // Venta, Compra, Pase
      if (formData.items.some(item => !item.product_id || item.quantity <= 0 || item.unit_price <= 0)) {
        alert('Por favor completa todos los productos correctamente (producto, cantidad y precio unitario)')
        return
      }
    }
    
    // Verificar que todos los productos tengan un ID válido (seleccionados del buscador)
    if (formData.items.some(item => !item.product_id)) {
      alert('Por favor selecciona todos los productos de la lista de sugerencias. Asegúrate de hacer clic en una sugerencia para seleccionarla.')
      return
    }
    
    // Verificar que los IDs de productos sean válidos
    for (const item of formData.items) {
      const producto = productos.find(p => p.id === item.product_id)
      if (!producto) {
        alert(`El producto "${item.product_name}" no se encontró en la base de datos. Por favor selecciónalo nuevamente.`)
        return
      }
    }
    
    // Debug: mostrar información de validación
    console.log('🔍 Validación de productos:', formData.items.map(item => ({
      product_name: item.product_name,
      product_id: item.product_id,
      valid: !!item.product_id
    })))

    // Validar que se seleccione un partner según el tipo de transacción
    if (formData.type === 'venta' && !formData.partner_id && !quickClientName.trim()) {
      alert('Por favor selecciona un cliente existente o crea uno nuevo para la venta')
      return
    }

    if (formData.type === 'compra' && !formData.partner_id && !quickClientName.trim()) {
      alert('Por favor selecciona un proveedor existente o crea uno nuevo para la compra')
      return
    }

    if (formData.type === 'prestamo') {
      if (!formData.prestamo_tipo) {
        alert('Por favor selecciona el tipo de préstamo (Yo presto / Me prestan)')
        return
      }
      if (!formData.partner_id && !quickClientName.trim()) {
        alert(`Por favor selecciona ${formData.prestamo_tipo === 'yo_presto' ? 'a quién prestas' : 'quién te presta'} o crea uno nuevo`)
        return
      }
    }

    if (formData.type === 'devolucion') {
      if (!formData.devolucion_tipo) {
        alert('Por favor selecciona el tipo de devolución (Yo devuelvo / Me devuelven)')
        return
      }
      if (!formData.partner_id && !quickClientName.trim()) {
        alert(`Por favor selecciona ${formData.devolucion_tipo === 'yo_devuelvo' ? 'a quién devuelves' : 'quién te devuelve'} o crea uno nuevo`)
        return
      }
    }

    if (formData.type === 'pase') {
      if (!formData.pase_tipo) {
        alert('Por favor selecciona el tipo de pase (Yo pase / Me pasen)')
        return
      }
      if (!formData.partner_id && !quickClientName.trim()) {
        alert(`Por favor selecciona ${formData.pase_tipo === 'yo_pase' ? 'a quién pasas' : 'quién te pasa'} o crea uno nuevo`)
        return
      }
    }



    try {
                     // Si es una venta, compra, pase, préstamo o devolución y se está escribiendo un nuevo cliente/partner, crearlo primero
        if ((formData.type === 'venta' || formData.type === 'compra' || formData.type === 'pase' || formData.type === 'prestamo' || formData.type === 'devolucion') && !formData.partner_id && quickClientName.trim()) {
          await crearClienteRapido(quickClientName)
          // La función crearClienteRapido ya actualiza formData.partner_id
          // Continuar con la creación de la nota de pedido
        }

      if (editingNota) {
        // Actualizar nota de pedido existente
        // 1) Revertir stock de los items anteriores
        const prevSign = getStockDeltaSign(
          editingNota.type,
          editingNota.prestamo_tipo,
          editingNota.devolucion_tipo,
          editingNota.pase_tipo
        )
        const { data: prevItems } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', editingNota.id)
        if (prevItems && prevSign !== 0) {
          await applyStockAdjustment(prevItems as any, (prevSign === 1 ? -1 : 1) as 1 | -1)
        }

                 const { error } = await supabase
            .from('orders')
                        .update({
               type: formData.type,
               partner_id: formData.partner_id || null,
               prestamo_tipo: formData.type === 'prestamo' ? formData.prestamo_tipo : null,
               devolucion_tipo: formData.type === 'devolucion' ? formData.devolucion_tipo : null,
               pase_tipo: formData.type === 'pase' ? formData.pase_tipo : null,
               fecha_pedido: formData.fecha_pedido ? 
                 new Date(formData.fecha_pedido + 'T00:00:00-05:00').toISOString() : // Fecha en zona horaria de Lima (UTC-5)
                 null,
               numero_pedido: formData.numero_pedido.trim() // Actualizar número de pedido manual
             })
            .eq('id', editingNota.id)

        if (error) {
          console.error('Error updating nota de pedido:', error)
          alert(`Error al actualizar: ${error.message}`)
          return
        }

        // 2) Actualizar items de la nota de pedido
        // Primero eliminar items existentes
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', editingNota.id)

                 // Luego insertar los nuevos items
         for (const item of formData.items) {
           await supabase
             .from('order_items')
             .insert({
               order_id: editingNota.id,
               product_id: item.product_id,
               quantity: item.quantity,
               unit_price: item.unit_price
             })
         }

        // 3) Aplicar ajuste de stock para los nuevos items
        const newSign = getStockDeltaSign(
          formData.type,
          formData.prestamo_tipo,
          formData.devolucion_tipo,
          formData.pase_tipo
        )
        if (newSign !== 0) {
          await applyStockAdjustment(
            formData.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            newSign
          )
        }

                 // Actualizar lista local
         setNotasPedido(notasPedido.map(n => 
           n.id === editingNota.id 
             ? { ...n, ...formData, total: calcularTotal(), numero_pedido: formData.numero_pedido.trim() }
             : n
         ))
      } else {
                 // Crear nueva nota de pedido
                                    const { data: notaData, error } = await supabase
             .from('orders')
                         .insert([{
                type: formData.type,
                created_by: (await supabase.auth.getUser()).data.user?.id || null,
                partner_id: formData.partner_id || null,
                prestamo_tipo: formData.type === 'prestamo' ? formData.prestamo_tipo : null,
                devolucion_tipo: formData.type === 'devolucion' ? formData.devolucion_tipo : null,
                pase_tipo: formData.type === 'pase' ? formData.pase_tipo : null,
                fecha_pedido: formData.fecha_pedido ? 
                  new Date(formData.fecha_pedido + 'T00:00:00-05:00').toISOString() : // Fecha en zona horaria de Lima (UTC-5)
                  new Date().toISOString(),
                numero_pedido: formData.numero_pedido.trim() // Número de pedido manual del usuario
              }])
             .select()

        if (error) {
          console.error('Error creating nota de pedido:', error)
          alert(`Error al crear: ${error.message}`)
          return
        }

        if (notaData && notaData.length > 0) {
                     // Insertar items de la nota de pedido
           for (const item of formData.items) {
             const { error: itemError } = await supabase
               .from('order_items')
               .insert({
                 order_id: notaData[0].id,
                 product_id: item.product_id,
                 quantity: item.quantity,
                 unit_price: item.unit_price
               })

            if (itemError) {
              console.error('Error inserting order item:', itemError)
              alert(`Error al crear item: ${itemError.message}`)
              return
            }
          }

          // Ajuste de stock según reglas
          const sign = getStockDeltaSign(
            formData.type,
            formData.prestamo_tipo,
            formData.devolucion_tipo,
            formData.pase_tipo
          )
          if (sign !== 0) {
            await applyStockAdjustment(
              formData.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
              sign
            )
          }

                                           // Crear la nueva nota con los items
            const nuevaNota = {
              ...notaData[0],
              items: formData.items,
              total: calcularTotal(),
              estado: 'registrada', // Estado por defecto
              numero_pedido: formData.numero_pedido.trim() // Usar el número de pedido manual del usuario
            }
           
           setNotasPedido([nuevaNota, ...notasPedido])
        }
      }

      resetForm()
      fetchNotasPedido() // Recargar para actualizar estadísticas
      toast.show(editingNota ? 'Nota de pedido actualizada exitosamente' : 'Nota de pedido creada exitosamente', 'success', 'Éxito')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.show('Error inesperado al guardar la nota de pedido', 'error', 'Error')
    }
  }

  const handleEdit = (nota: NotaPedido) => {
    setEditingNota(nota)
    setFormData({
      type: nota.type,
      partner_id: nota.partner_id || '',
      prestamo_tipo: nota.type === 'prestamo' ? nota.prestamo_tipo : undefined,
      devolucion_tipo: nota.type === 'devolucion' ? nota.devolucion_tipo : undefined,
      pase_tipo: nota.type === 'pase' ? nota.pase_tipo : undefined,
      items: nota.items.map(item => ({
        ...item,
        product_name: item.product_name || 'Producto no encontrado'
      })),
      fecha_pedido: nota.fecha_pedido ? new Date(nota.fecha_pedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      numero_pedido: nota.numero_pedido ? nota.numero_pedido.toString() : ''
    })
    setShowForm(true)
  }

  const openDeleteDialog = (id: string) => {
    setNotaToDelete(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!notaToDelete) return
    try {
      setDeleting(true)
      
      // IMPORTANTE: Revertir el ajuste de stock ANTES de eliminar
      const notaAEliminar = notasPedido.find(n => n.id === notaToDelete)
      if (notaAEliminar) {
        // Obtener el signo del ajuste de stock que se hizo al crear la nota
        const sign = getStockDeltaSign(
          notaAEliminar.type,
          notaAEliminar.prestamo_tipo,
          notaAEliminar.devolucion_tipo,
          notaAEliminar.pase_tipo
        )
        
        // Si hay ajuste de stock, revertirlo (cambiar el signo)
        if (sign !== 0) {
          console.log(`🔄 Revertiendo stock para nota ${notaAEliminar.numero_pedido}:`, {
            type: notaAEliminar.type,
            sign: sign,
            reverseSign: sign === 1 ? -1 : 1,
            items: notaAEliminar.items
          })
          
          // Revertir el ajuste de stock (cambiar el signo)
          await applyStockAdjustment(
            notaAEliminar.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            sign === 1 ? -1 : 1 // Invertir el signo
          )
        }
      }
      
      // Ahora sí eliminar items y orden
      await supabase.from('order_items').delete().eq('order_id', notaToDelete)
      const { error } = await supabase.from('orders').delete().eq('id', notaToDelete)
      if (error) throw error
      
      setNotasPedido(prev => prev.filter(n => n.id !== notaToDelete))
      fetchNotasPedido()
      
      toast.show('Nota de pedido eliminada y stock restaurado correctamente', 'success', 'Éxito')
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.show('Error inesperado al eliminar la nota de pedido', 'error', 'Error')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setNotaToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={48} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={fetchNotasPedido}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Debug: mostrar el estado de partners
  console.log('🔍 Estado actual de partners:', partners)
  console.log('🔍 Estado actual de formData.type:', formData.type)
  
  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      {/* Header mejorado */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Registro de Notas de Pedido
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Gestiona todas las transacciones de tu negocio de manera eficiente
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus size={24} />
            <span className="font-semibold text-lg">Nueva Nota de Pedido</span>
          </button>
        </div>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm border border-blue-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Notas</p>
              <p className="text-3xl font-bold text-blue-800">{stats.totalNotas}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-sm border border-green-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Ventas</p>
              <p className="text-3xl font-bold text-green-800">{stats.ventas}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl">
              <ShoppingCart className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700 mb-1">Compras</p>
              <p className="text-3xl font-bold text-indigo-800">{stats.compras}</p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-xl">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl shadow-sm border border-amber-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">Préstamos</p>
              <p className="text-3xl font-bold text-amber-800">{stats.prestamos}</p>
            </div>
            <div className="p-3 bg-amber-500 rounded-xl">
              <Wallet className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Devoluciones</p>
              <p className="text-3xl font-bold text-red-800">{stats.devoluciones}</p>
            </div>
            <div className="p-3 bg-red-500 rounded-xl">
              <ArrowUpDown className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-sm border border-purple-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Pases</p>
              <p className="text-3xl font-bold text-purple-800">{stats.pases}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario mejorado */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingNota ? 'Editar Nota de Pedido' : 'Nueva Nota de Pedido'}
            </h2>
            <button 
              onClick={resetForm}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Transacción *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as any
                    setFormData({
                      ...formData, 
                      type: newType,
                      partner_id: '',
                      prestamo_tipo: newType === 'prestamo' ? formData.prestamo_tipo : undefined,
                      devolucion_tipo: newType === 'devolucion' ? formData.devolucion_tipo : undefined,
                      pase_tipo: newType === 'pase' ? formData.pase_tipo : undefined
                    })
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  required
                >
                  <option value="venta">Venta</option>
                  <option value="pase">Pase</option>
                  <option value="compra">Compra</option>
                  <option value="prestamo">Préstamo</option>
                  <option value="devolucion">Devolución</option>
                </select>
              </div>

                             <div className="space-y-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   {formData.type === 'venta' ? 'Cliente' : 
                    formData.type === 'pase' ? 'Tipo de Pase' :
                    formData.type === 'compra' ? 'Proveedor' : 
                    formData.type === 'prestamo' ? 'Tipo de Préstamo' :
                    'Partner/Cliente'}
                 </label>
                
                {formData.type === 'prestamo' ? (
                  <div className="space-y-3">
                    <select
                      value={formData.prestamo_tipo || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          prestamo_tipo: e.target.value as 'yo_presto' | 'me_prestan',
                          partner_id: ''
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                    >
                      <option value="">Seleccionar tipo de préstamo</option>
                      <option value="yo_presto">Yo presto</option>
                      <option value="me_prestan">Me prestan</option>
                    </select>
                    
                    {formData.prestamo_tipo && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {formData.prestamo_tipo === 'yo_presto' ? 'A quién presto' : 'Quién me presta'}
                        </label>
                        <div className="flex gap-3">
                          <select
                            value={formData.partner_id}
                            onChange={(e) => {
                              setFormData({...formData, partner_id: e.target.value})
                              setQuickClientName('')
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          >
                            <option value="">Seleccionar {formData.prestamo_tipo === 'yo_presto' ? 'cliente' : 'partner'} existente</option>
                            {partners
                              .filter(partner => partner.type !== 'proveedor')
                              .map((partner) => (
                                <option key={partner.id} value={partner.id}>
                                  {partner.name} ({partner.type})
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={quickClientName}
                            onChange={(e) => {
                              setQuickClientName(e.target.value)
                              setFormData({...formData, partner_id: ''})
                            }}
                            placeholder={`O escribir nombre de ${formData.prestamo_tipo === 'yo_presto' ? 'cliente' : 'partner'} nuevo`}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => crearClienteRapido(quickClientName)}
                            disabled={!quickClientName.trim() || isCreatingQuickClient}
                            className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {isCreatingQuickClient ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              'Crear'
                            )}
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                          💡 Puedes seleccionar un {formData.prestamo_tipo === 'yo_presto' ? 'cliente' : 'partner'} existente o escribir para crear uno nuevo
                        </p>
                      </div>
                    )}
                  </div>
                ) : formData.type === 'devolucion' ? (
                  <div className="space-y-3">
                    <select
                      value={formData.devolucion_tipo || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          devolucion_tipo: e.target.value as 'yo_devuelvo' | 'me_devuelven',
                          partner_id: ''
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                    >
                      <option value="">Seleccionar tipo de devolución</option>
                      <option value="yo_devuelvo">Yo devuelvo</option>
                      <option value="me_devuelven">Me devuelven</option>
                    </select>
                    
                    {formData.devolucion_tipo && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {formData.devolucion_tipo === 'yo_devuelvo' ? 'A quién devuelvo' : 'Quién me devuelve'}
                        </label>
                        <div className="flex gap-3">
                          <select
                            value={formData.partner_id}
                            onChange={(e) => {
                              setFormData({...formData, partner_id: e.target.value})
                              setQuickClientName('')
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          >
                            <option value="">Seleccionar {formData.devolucion_tipo === 'yo_devuelvo' ? 'cliente' : 'partner'} existente</option>
                            {partners
                              .filter(partner => partner.type !== 'proveedor')
                              .map((partner) => (
                                <option key={partner.id} value={partner.id}>
                                  {partner.name} ({partner.type})
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={quickClientName}
                            onChange={(e) => {
                              setQuickClientName(e.target.value)
                              setFormData({...formData, partner_id: ''})
                            }}
                            placeholder={`O escribir nombre de ${formData.devolucion_tipo === 'yo_devuelvo' ? 'cliente' : 'partner'} nuevo`}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => crearClienteRapido(quickClientName)}
                            disabled={!quickClientName.trim() || isCreatingQuickClient}
                            className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {isCreatingQuickClient ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              'Crear'
                            )}
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                          💡 Puedes seleccionar un {formData.devolucion_tipo === 'yo_devuelvo' ? 'cliente' : 'partner'} existente o escribir para crear uno nuevo
                        </p>
                      </div>
                    )}
                  </div>
                ) : formData.type === 'pase' ? (
                  <div className="space-y-3">
                    <select
                      value={formData.pase_tipo || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          pase_tipo: e.target.value as 'yo_pase' | 'me_pasen',
                          partner_id: ''
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                    >
                      <option value="">Seleccionar tipo de pase</option>
                      <option value="yo_pase">Yo pase</option>
                      <option value="me_pasen">Me pasen</option>
                    </select>
                    
                    {formData.pase_tipo && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {formData.pase_tipo === 'yo_pase' ? 'A quién paso' : 'Quién me pasa'}
                        </label>
                        <div className="flex gap-3">
                          <select
                            value={formData.partner_id}
                            onChange={(e) => {
                              setFormData({...formData, partner_id: e.target.value})
                              setQuickClientName('')
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          >
                            <option value="">Seleccionar {formData.pase_tipo === 'yo_pase' ? 'cliente' : 'partner'} existente</option>
                            {partners
                              .filter(partner => partner.type !== 'proveedor')
                              .map((partner) => (
                                <option key={partner.id} value={partner.id}>
                                  {partner.name} ({partner.type})
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={quickClientName}
                            onChange={(e) => {
                              setQuickClientName(e.target.value)
                              setFormData({...formData, partner_id: ''})
                            }}
                            placeholder={`O escribir nombre de ${formData.pase_tipo === 'yo_pase' ? 'cliente' : 'partner'} nuevo`}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => crearClienteRapido(quickClientName)}
                            disabled={!quickClientName.trim() || isCreatingQuickClient}
                            className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {isCreatingQuickClient ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              'Crear'
                            )}
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                          💡 Puedes seleccionar un {formData.pase_tipo === 'yo_pase' ? 'cliente' : 'partner'} existente o escribir para crear uno nuevo
                        </p>
                      </div>
                    )}
                  </div>
                ) : formData.type === 'venta' ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={formData.partner_id}
                        onChange={(e) => {
                          setFormData({...formData, partner_id: e.target.value})
                          setQuickClientName('')
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="">Seleccionar cliente existente</option>
                        {partners
                          .filter(partner => partner.type === 'cliente')
                          .map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={quickClientName}
                        onChange={(e) => {
                          setQuickClientName(e.target.value)
                          setFormData({...formData, partner_id: ''})
                        }}
                        placeholder="O escribir nombre de nuevo cliente"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => crearClienteRapido(quickClientName)}
                        disabled={!quickClientName.trim() || isCreatingQuickClient}
                        className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isCreatingQuickClient ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Crear'
                        )}
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      💡 Puedes seleccionar un cliente existente o escribir para crear uno nuevo
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">
                      {formData.type === 'compra' ? 'Seleccionar proveedor' : 
                       'Seleccionar partner'}
                    </option>
                    {partners
                      .filter(partner => {
                        if (formData.type === 'compra') {
                          return partner.type === 'proveedor'
                        } else {
                          return true
                        }
                      })
                      .map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} ({partner.type})
                        </option>
                      ))}
                  </select>
                )}
                
                {formData.type === 'compra' && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-2">
                    💡 Solo se muestran proveedores para transacciones de compra
                  </p>
                )}
              </div>
            </div>

                         {/* Campo de Fecha */}
             <div className="space-y-2">
               <label className="block text-sm font-semibold text-gray-700 mb-2">
                 Fecha del Pedido *
               </label>
               <div className="flex items-center gap-3">
                 <div className="flex-1 relative">
                   <input
                     type="date"
                     value={formData.fecha_pedido}
                     onChange={(e) => setFormData({...formData, fecha_pedido: e.target.value})}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white cursor-pointer"
                     required
                   />
                   <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                     <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                       <span className="text-white text-sm">📅</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex-shrink-0">
                   <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 min-w-[200px]">
                     <div className="text-center">
                       <div className="text-xs text-blue-600 font-medium mb-1">Fecha seleccionada</div>
                                              <div className="text-sm text-blue-800 font-semibold">
                         {formData.fecha_pedido && formData.fecha_pedido.trim() !== '' ? 
                           formatDateForLima(formData.fecha_pedido)
                         : 
                           'Hoy'
                         }
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Campo de Número de Pedido */}
             <div className="space-y-2">
               <label className="block text-sm font-semibold text-gray-700 mb-2">
                 Número de Pedido *
               </label>
               <div className="flex items-center gap-3">
                 <div className="flex-1 relative">
                   <input
                     type="text"
                     value={formData.numero_pedido || ''}
                     onChange={(e) => setFormData({...formData, numero_pedido: e.target.value})}
                     placeholder="Ej: PED-001, VENT-2024-001, etc."
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                     required
                   />
                   <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                     <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                       <span className="text-white text-sm">🔢</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex-shrink-0">
                   <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 min-w-[200px]">
                     <div className="text-center">
                       <div className="text-xs text-purple-600 font-medium mb-1">Formato sugerido</div>
                       <div className="text-sm text-purple-800 font-semibold">
                         {formData.type.toUpperCase()}-{new Date().getFullYear()}-001
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                 💡 Ingresa un número de pedido único para identificar fácilmente esta transacción
               </p>
             </div>

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-lg font-semibold text-gray-700">
                  Productos
                </label>
                <button
                  type="button"
                  onClick={agregarItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <Plus size={16} />
                  Agregar Producto
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <Package size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Producto *
                          </label>
                          
                                                     <div className="relative">
                             <select
                               value={item.product_id || ''}
                               onChange={(e) => {
                                 const selectedProductId = e.target.value
                                 if (selectedProductId) {
                                   const producto = productos.find(p => p.id === selectedProductId)
                                   if (producto) {
                                     const itemsActualizados = [...formData.items]
                                     itemsActualizados[index] = { 
                                       ...itemsActualizados[index], 
                                       product_id: producto.id,
                                       product_name: producto.name || ''
                                     }
                                     
                                     // Calcular total_price si es necesario
                                     if (itemsActualizados[index].quantity && itemsActualizados[index].unit_price) {
                                       itemsActualizados[index].total_price = 
                                         itemsActualizados[index].quantity * itemsActualizados[index].unit_price
                                     }
                                     
                                     setFormData({
                                       ...formData,
                                       items: itemsActualizados
                                     })
                                   }
                                 } else {
                                   // Si se selecciona "Seleccionar producto", limpiar los campos
                                   const itemsActualizados = [...formData.items]
                                   itemsActualizados[index] = { 
                                     ...itemsActualizados[index], 
                                     product_id: '',
                                     product_name: ''
                                   }
                                   setFormData({
                                     ...formData,
                                     items: itemsActualizados
                                   })
                                 }
                               }}
                               className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white ${
                                 item.product_id ? 'border-green-300 bg-green-50' : 'border-gray-300'
                               }`}
                               required
                             >
                               <option value="">Seleccionar producto del inventario</option>
                               {productos.map((producto) => (
                                 <option key={producto.id} value={producto.id}>
                                   {producto.name} - {producto.brand} {producto.model} (Stock: {producto.stock})
                                 </option>
                               ))}
                             </select>
                             
                             {/* Indicador de producto seleccionado */}
                             {item.product_id && (
                               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                 <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                   <span className="text-white text-xs">✓</span>
                                 </div>
                               </div>
                             )}
                             
                             {/* Mensaje de producto seleccionado */}
                             {item.product_id && (
                               <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200 flex items-center justify-between">
                                 <span>✓ Producto seleccionado correctamente</span>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     const itemsActualizados = [...formData.items]
                                     itemsActualizados[index] = { 
                                       ...itemsActualizados[index], 
                                       product_id: '',
                                       product_name: ''
                                     }
                                     setFormData({
                                       ...formData,
                                       items: itemsActualizados
                                     })
                                   }}
                                   className="text-red-500 hover:text-red-700 text-xs font-medium"
                                 >
                                   Cambiar
                                 </button>
                               </div>
                             )}
                           </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => actualizarItem(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio Unitario (S/.) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => actualizarItem(index, 'unit_price', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total (S/.)
                            </label>
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-center font-semibold text-gray-800">
                              S/. {item.total_price.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarItem(index)}
                            className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total - Solo mostrar si no es préstamo ni devolución */}
            {formData.type !== 'prestamo' && formData.type !== 'devolucion' && (
              <div className="text-right bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-2xl font-bold text-blue-800">
                  Total: S/. {calcularTotal().toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Save size={20} />
                {editingNota ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros y búsqueda mejorados */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por N° de pedido o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
          
          <div className="lg:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="todos">Todos los tipos</option>
              <option value="venta">Ventas</option>
              <option value="pase">Pases</option>
              <option value="compra">Compras</option>
              <option value="prestamo">Préstamos</option>
              <option value="devolucion">Devoluciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de órdenes mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">N° Pedido</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Tipo</th>
                <th className="text-left p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Cliente/Proveedor</th>
                <th className="text-left p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Productos</th>
                <th className="text-right p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Fecha</th>
                <th className="text-center p-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText size={48} className="text-gray-400 mb-3" />
                      <p className="text-lg font-medium">
                        {searchTerm || filterType !== 'todos' ? 'No se encontraron notas de pedido que coincidan con los filtros' : 'No hay notas de pedido registradas'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm || filterType !== 'todos' ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza creando tu primera nota de pedido'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-gray-50 transition-all duration-200 group">
                                         <td className="p-6 text-center">
                       <span className="text-blue-800 font-bold text-lg">
                         #{nota.numero_pedido || 'N/A'}
                       </span>
                     </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getTypeColor(nota.type)}`}>
                        {getTypeIcon(nota.type)}
                        {getTypeLabel(nota.type, nota.prestamo_tipo, nota.devolucion_tipo, nota.pase_tipo)}
                      </span>
                    </td>
                    <td className="p-6">
                      {nota.partner_id ? (
                        (() => {
                          const partner = partners.find(p => p.id === nota.partner_id)
                          return partner ? (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="font-semibold text-gray-800">{partner.name}</div>
                              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full inline-block mt-1">
                                {partner.type}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Partner no encontrado</span>
                          )
                        })()
                      ) : (
                        <span className="text-gray-400">Sin partner</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                        {nota.items.map((item, index) => (
                          <div key={index} className="text-sm bg-white p-2 rounded-lg border border-gray-200">
                            <span className="font-medium">{item.product_name}</span>
                            <span className="text-gray-500 ml-2">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {nota.type === 'prestamo' || nota.type === 'devolucion' ? (
                        <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">Sin precio</span>
                      ) : (
                        <span className="text-xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                          S/. {nota.total.toFixed(2)}
                        </span>
                      )}
                    </td>
                                         <td className="p-6 text-center">
                       <div className="bg-gray-50 p-3 rounded-lg">
                         <div className="text-sm font-medium text-gray-800">
                           {nota.fecha_pedido && nota.fecha_pedido.trim() !== '' ? 
                             formatDateForLima(nota.fecha_pedido) :
                             (() => {
                               try {
                                 const createdDate = new Date(nota.created_at)
                                 if (isNaN(createdDate.getTime())) {
                                   return 'Fecha inválida'
                                 }
                                 return createdDate.toLocaleDateString('es-ES', { 
                                   year: 'numeric', 
                                   month: 'short', 
                                   day: 'numeric' 
                                 })
                               } catch (error) {
                                 return 'Error fecha'
                               }
                             })()
                           }
                         </div>
                       </div>
                     </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110"
                          onClick={() => handleEdit(nota)}
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                          onClick={() => openDeleteDialog(nota.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogo Confirmación Eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar nota de pedido"
        description="Esta acción no se puede deshacer. Se eliminará la nota y todos sus items."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) { setConfirmOpen(false); setNotaToDelete(null) } }}
      />

      {/* Información adicional mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <FileText size={20} />
          <span className="font-medium">
            Mostrando {filteredNotas.length} de {notasPedido.length} notas de pedido
          </span>
        </div>
      </div>
    </div>
  )
} 