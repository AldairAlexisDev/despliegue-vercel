// src/components/ClientSearchInput.tsx
import { useState, useRef, useEffect } from 'react'
import { Search, User, Plus, X, Save, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from './Toast'

type Partner = {
  id: string
  name: string
  type: string
  contact: string
}

interface ClientSearchInputProps {
  partners: Partner[]
  selectedPartnerId: string | undefined
  onPartnerSelect: (partnerId: string) => void
  onPartnerCreated?: (partner: Partner) => void
  placeholder?: string
  label?: string
  filterType?: 'cliente' | 'proveedor' | 'all'
}

export default function ClientSearchInput({
  partners,
  selectedPartnerId,
  onPartnerSelect,
  onPartnerCreated,
  placeholder = "Buscar cliente...",
  label = "Cliente",
  filterType = 'cliente'
}: ClientSearchInputProps) {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerContact, setNewPartnerContact] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrar partners según el tipo y término de búsqueda
  const filteredPartners = partners.filter(partner => {
    const matchesType = filterType === 'all' || partner.type === filterType
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contact.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  // Obtener el partner seleccionado
  const selectedPartner = selectedPartnerId ? partners.find(p => p.id === selectedPartnerId) : undefined

  // Manejar selección de partner
  const handlePartnerSelect = (partner: Partner) => {
    onPartnerSelect(partner.id)
    setSearchTerm(partner.name)
    setShowDropdown(false)
  }

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowDropdown(value.length > 0)
    
    // Si hay texto y no hay partner seleccionado, limpiar selección
    if (value.length > 0 && selectedPartnerId) {
      onPartnerSelect('')
    }
  }

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('')
    setShowDropdown(false)
    onPartnerSelect('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Crear nuevo partner
  const createPartner = async () => {
    if (!newPartnerName.trim()) {
      toast.show('Por favor ingresa un nombre', 'error', 'Error')
      return
    }

    setIsCreating(true)
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([{
          name: newPartnerName.trim(),
          type: filterType === 'proveedor' ? 'proveedor' : (filterType === 'all' ? 'cliente' : filterType),
          contact: newPartnerContact.trim()
        }])
        .select()

      if (error) {
        console.error('Error creating partner:', error)
        toast.show(`Error al crear ${filterType === 'cliente' ? 'cliente' : filterType === 'proveedor' ? 'proveedor' : 'partner'}: ${error.message}`, 'error', 'Error')
        return
      }

      if (data && data.length > 0) {
        const nuevoPartner = data[0]
        
        // Notificar al componente padre
        if (onPartnerCreated) {
          onPartnerCreated(nuevoPartner)
        }
        
        // Seleccionar automáticamente el nuevo partner
        onPartnerSelect(nuevoPartner.id)
        setSearchTerm(nuevoPartner.name)
        
        // Cerrar formulario y limpiar
        setShowCreateForm(false)
        setNewPartnerName('')
        setNewPartnerContact('')
        setShowDropdown(false)
        
        // Mostrar toast de éxito
        toast.show(
          `${filterType === 'cliente' ? 'Cliente' : filterType === 'proveedor' ? 'Proveedor' : 'Partner'} "${nuevoPartner.name}" creado y seleccionado exitosamente`,
          'success',
          '¡Éxito!'
        )
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.show('Error inesperado al crear el partner', 'error', 'Error')
    } finally {
      setIsCreating(false)
    }
  }

  // Cancelar creación
  const cancelCreate = () => {
    setShowCreateForm(false)
    setNewPartnerName('')
    setNewPartnerContact('')
    setShowDropdown(false)
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sincronizar searchTerm con el partner seleccionado
  useEffect(() => {
    if (selectedPartner) {
      setSearchTerm(selectedPartner.name)
    } else if (!selectedPartnerId) {
      setSearchTerm('')
    }
  }, [selectedPartner, selectedPartnerId])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} *
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Input de búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchTerm.length > 0) {
                setShowDropdown(true)
              }
            }}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {!showCreateForm ? (
              <>
                {filteredPartners.length > 0 ? (
                  filteredPartners.slice(0, 8).map((partner) => (
                    <div
                      key={partner.id}
                      onClick={() => handlePartnerSelect(partner)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {partner.name}
                          </div>
                          {partner.contact && (
                            <div className="text-sm text-gray-500 truncate">
                              {partner.contact}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 uppercase font-medium bg-gray-100 px-2 py-1 rounded">
                          {partner.type}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <User size={24} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm mb-4">No se encontraron {filterType === 'cliente' ? 'clientes' : filterType === 'proveedor' ? 'proveedores' : 'resultados'}</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <Plus size={16} />
                      Crear nuevo {filterType === 'cliente' ? 'cliente' : filterType === 'proveedor' ? 'proveedor' : 'partner'}
                    </button>
                  </div>
                )}
                
                {/* Botón para crear nuevo cuando hay resultados */}
                {filteredPartners.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full px-4 py-4 text-left hover:bg-green-50 transition-all duration-200 flex items-center gap-3 text-green-600 hover:text-green-700"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus size={18} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">
                          Crear nuevo {filterType === 'cliente' ? 'cliente' : filterType === 'proveedor' ? 'proveedor' : 'partner'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Agregar {filterType === 'cliente' ? 'un cliente' : filterType === 'proveedor' ? 'un proveedor' : 'un partner'} nuevo al sistema
                        </div>
                      </div>
                      <div className="text-green-500">
                        <Plus size={16} />
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Formulario de creación */
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800">
                        Crear nuevo {filterType === 'cliente' ? 'cliente' : filterType === 'proveedor' ? 'proveedor' : 'partner'}
                      </h4>
                    </div>
                    <button
                      onClick={cancelCreate}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del {filterType === 'cliente' ? 'cliente' : filterType === 'proveedor' ? 'proveedor' : 'partner'} *
                        </label>
                        <input
                          type="text"
                          value={newPartnerName}
                          onChange={(e) => setNewPartnerName(e.target.value)}
                          placeholder={`Ej: ${filterType === 'cliente' ? 'Juan Pérez' : filterType === 'proveedor' ? 'Distribuidora ABC' : 'Partner XYZ'}`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white text-gray-700"
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contacto (opcional)
                        </label>
                        <input
                          type="text"
                          value={newPartnerContact}
                          onChange={(e) => setNewPartnerContact(e.target.value)}
                          placeholder="Teléfono, email, dirección, etc."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={createPartner}
                      disabled={isCreating || !newPartnerName.trim()}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 font-semibold text-sm ${
                        isCreating || !newPartnerName.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md transform hover:scale-105'
                      }`}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Crear y seleccionar
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelCreate}
                      disabled={isCreating}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint simplificado */}
      <p className="text-xs text-gray-500">
        💡 Escribe para buscar {filterType === 'cliente' ? 'un cliente' : filterType === 'proveedor' ? 'un proveedor' : 'un partner'} existente o crea uno nuevo desde el menú desplegable
      </p>
    </div>
  )
}
