import { PenTool, Type, Calendar, Mail, User, Building, RadioIcon, Check, Minus } from 'lucide-react'

// Field types configuration matching OpenSign
export const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: PenTool, color: 'bg-blue-500' },
  { type: 'initial', label: 'Initials', icon: Type, color: 'bg-green-500' },
  { type: 'name', label: 'Name', icon: User, color: 'bg-purple-500' },
  { type: 'email', label: 'Email', icon: Mail, color: 'bg-red-500' },
  { type: 'date', label: 'Date', icon: Calendar, color: 'bg-yellow-500' },
  { type: 'company', label: 'Company', icon: Building, color: 'bg-indigo-500' },
  { type: 'text', label: 'Text Input', icon: Type, color: 'bg-gray-500' },
  { type: 'checkbox', label: 'Checkbox', icon: Check, color: 'bg-green-600' },
  { type: 'radio', label: 'Radio Button', icon: RadioIcon, color: 'bg-orange-500' },
  { type: 'dropdown', label: 'Dropdown', icon: Minus, color: 'bg-teal-500' }
]

export const getFieldTypeConfig = (type: string) => {
  const configs = {
    signature: { bgColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', textColor: '#1d4ed8' },
    initial: { bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', textColor: '#15803d' },
    name: { bgColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7', textColor: '#7c3aed' },
    email: { bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', textColor: '#dc2626' },
    date: { bgColor: 'rgba(234, 179, 8, 0.1)', borderColor: '#eab308', textColor: '#ca8a04' },
    company: { bgColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', textColor: '#4f46e5' },
    text: { bgColor: 'rgba(107, 114, 128, 0.1)', borderColor: '#6b7280', textColor: '#374151' },
    checkbox: { bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', textColor: '#15803d' },
    radio: { bgColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316', textColor: '#ea580c' },
    dropdown: { bgColor: 'rgba(20, 184, 166, 0.1)', borderColor: '#14b8a6', textColor: '#0f766e' }
  }
  return configs[type as keyof typeof configs] || configs.text
}