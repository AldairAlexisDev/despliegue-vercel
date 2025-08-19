
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  inputSize?: 'sm' | 'md' | 'lg'
  error?: string
}

export default function Input({ 
  label, 
  inputSize = 'md', 
  error,
  className = '',
  ...props 
}: InputProps) {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-base",
    lg: "px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg"
  }

  const labelSizeClasses = {
    sm: "text-xs sm:text-sm",
    md: "text-sm",
    lg: "text-sm sm:text-base"
  }

  return (
    <div className="mb-3 sm:mb-4">
      {label && (
        <label className={`block mb-1 sm:mb-2 font-medium text-gray-700 ${labelSizeClasses[inputSize]}`}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${sizeClasses[inputSize]} ${error ? 'border-red-300 focus:ring-red-500' : ''} ${className}`}
      />
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
