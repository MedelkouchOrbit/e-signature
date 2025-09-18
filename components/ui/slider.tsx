import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max: number
  min: number
  step: number
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, max, min, step, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([Number(e.target.value)])
    }

    return (
      <input
        ref={ref}
        type="range"
        value={value[0]}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
          "slider:appearance-none slider:h-2 slider:rounded-lg slider:bg-blue-600",
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }