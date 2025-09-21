'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Add Document" },
    { id: 2, label: "Template Settings" },
    { id: 3, label: "Place Fields" },
    { id: 4, label: "Review & Finish" }
  ]

  return (
    <div className="flex items-center justify-center py-6 bg-white border-b">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  isActive
                    ? "bg-green-500 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-green-600" : isCompleted ? "text-green-600" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-16 h-px mx-4 bg-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StepIndicator