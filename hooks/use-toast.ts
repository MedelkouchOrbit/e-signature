"use client"

import type * as React from "react"
import { toast as sonnerToast } from "sonner"

// This file acts as a wrapper to provide a consistent toast API
// while using 'sonner' as the underlying toast library.

// Define a clean interface that matches Sonner's expectations
// Don't extend ToastProps to avoid type conflicts
interface CustomToastProps {
  title?: string // Sonner expects string for title
  description?: string | React.ReactNode // Sonner supports ReactNode for description
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  // Add other Sonner-compatible props
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  richColors?: boolean
  closeButton?: boolean
}

function toast({ title, description, variant, duration, action, ...props }: CustomToastProps) {
  // Map custom variant to sonner's type if necessary
  if (variant === "destructive") {
    sonnerToast.error(title || "", {
      description: description,
      duration: duration || 3000,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      ...props,
    })
  } else if (variant === "success") {
    sonnerToast.success(title || "", {
      description: description,
      duration: duration || 3000,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      ...props,
    })
  } else if (variant === "warning") {
    sonnerToast.warning(title || "", {
      description: description,
      duration: duration || 3000,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      ...props,
    })
  } else if (variant === "info") {
    sonnerToast.info(title || "", {
      description: description,
      duration: duration || 3000,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      ...props,
    })
  } else {
    // Default case
    sonnerToast(title || "", {
      description: description,
      duration: duration || 3000,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      ...props,
    })
  }
}

// If you need a hook, you can provide a simple one.
// Sonner's `toast` function is usually called directly.
function useToast() {
  return {
    toast,
    // Sonner's dismiss is usually called via toast.dismiss(id)
    // If you need a global dismiss, you can expose sonnerToast.dismiss()
    dismiss: sonnerToast.dismiss,
  }
}

export { toast, useToast }
export type { CustomToastProps }
