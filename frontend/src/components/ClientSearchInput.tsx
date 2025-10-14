// src/components/ClientSearchInput.tsx
import { useState, useRef, useEffect } from 'react'
import { Search, User } from 'lucide-react'

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
  placeholder?: string
  label?: string
  filterType?: 'cliente' | 'proveedor' | 'all'
}

export default function ClientSearchInput({
  partners,
  selectedPartnerId,
  onPartnerSelect,
  placeholder = "Buscar cliente...",
  label = "Cliente",
  filterType = 'cliente'
}: ClientSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
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
                <User size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No se encontraron {filterType === 'cliente' ? 'clientes' : filterType === 'proveedor' ? 'proveedores' : 'resultados'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint simplificado */}
      <p className="text-xs text-gray-500">
        💡 Escribe para buscar {filterType === 'cliente' ? 'un cliente' : filterType === 'proveedor' ? 'un proveedor' : 'un partner'} existente
      </p>
    </div>
  )
}
