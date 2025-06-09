import React from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <label className={`flex items-center space-x-2 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
          checked 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-300 hover:border-blue-400'
        }`}>
          {checked && (
            <CheckIcon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>
      <span className="text-sm text-gray-600 select-none">{label}</span>
    </label>
  )
}

export default Checkbox
