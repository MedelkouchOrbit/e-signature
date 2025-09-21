import { useState, useCallback } from 'react'

export type ValidationRule<T> = (value: T) => string | null

export type ValidationRules<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T
  errors: Record<keyof T, string>
  touched: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field: keyof T) => void
  clearErrors: () => void
  touch: (field: keyof T) => void
  touchAll: () => void
  reset: (newValues?: T) => void
  validate: (field?: keyof T) => boolean
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>
}

/**
 * Custom hook for form validation and state management
 * Provides validation rules, error handling, and form submission
 */
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrorsState] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: T[keyof T]): string => {
    const rules = validationRules[field]
    if (!rules) return ''

    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }
    return ''
  }, [validationRules])

  // Validate all fields or a specific field
  const validate = useCallback((field?: keyof T): boolean => {
    if (field) {
      const error = validateField(field, values[field])
      setErrorsState(prev => ({ ...prev, [field]: error }))
      return !error
    }

    const newErrors = {} as Record<keyof T, string>
    let isFormValid = true

    for (const [fieldName, value] of Object.entries(values)) {
      const error = validateField(fieldName as keyof T, value as T[keyof T])
      newErrors[fieldName as keyof T] = error
      if (error) isFormValid = false
    }

    setErrorsState(newErrors)
    return isFormValid
  }, [values, validateField])

  // Check if form is valid
  const isValid = Object.values(errors).every(error => !error)

  // Set a single field value
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    
    // Validate immediately if field has been touched
    if (touched[field]) {
      const error = validateField(field, value)
      setErrorsState(prev => ({ ...prev, [field]: error }))
    }
  }, [touched, validateField])

  // Set multiple field values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
  }, [])

  // Set error for a field
  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  // Clear error for a field
  const clearError = useCallback((field: keyof T) => {
    setErrorsState(prev => ({ ...prev, [field]: '' }))
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrorsState({} as Record<keyof T, string>)
  }, [])

  // Mark field as touched
  const touch = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }))
  }, [])

  // Mark all fields as touched
  const touchAll = useCallback(() => {
    const allTouched = {} as Record<keyof T, boolean>
    for (const field of Object.keys(values) as (keyof T)[]) {
      allTouched[field] = true
    }
    setTouchedState(allTouched)
  }, [values])

  // Reset form
  const reset = useCallback((newValues?: T) => {
    const resetValues = newValues || initialValues
    setValuesState(resetValues)
    setErrorsState({} as Record<keyof T, string>)
    setTouchedState({} as Record<keyof T, boolean>)
    setIsSubmitting(false)
  }, [initialValues])

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    touchAll()
    const isFormValid = validate()
    
    if (!isFormValid) return

    try {
      setIsSubmitting(true)
      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
      // Let the component handle the error
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, touchAll])

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    touch,
    touchAll,
    reset,
    validate,
    handleSubmit
  }
}

// Common validation rules
export const validationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => 
    (value) => {
      if (value === null || value === undefined || value === '') {
        return message
      }
      return null
    },

  email: (message = 'Please enter a valid email address'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : message
    },

  minLength: (min: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const defaultMessage = `Must be at least ${min} characters`
      return value.length >= min ? null : (message || defaultMessage)
    },

  maxLength: (max: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const defaultMessage = `Must be no more than ${max} characters`
      return value.length <= max ? null : (message || defaultMessage)
    },

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      return regex.test(value) ? null : message
    },

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      return phoneRegex.test(value.replace(/\s+/g, '')) ? null : message
    }
}