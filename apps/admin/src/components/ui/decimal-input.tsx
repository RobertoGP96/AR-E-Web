"use client"

import * as React from "react"
import { cn } from "@/lib/utils"


export interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number | string
  onChange?: (value: number | undefined) => void
  decimalPlaces?: number
  allowNegative?: boolean
}


export function DecimalInput({
  className,
  value,
  onChange,
  decimalPlaces = 2,
  allowNegative = false,
  ...props
}: DecimalInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>("")


  // Sync external value with display
  React.useEffect(() => {
    if (value !== undefined && value !== "") {
      const num = typeof value === "string" ? Number.parseFloat(value) : value
      if (!isNaN(num)) {
        setDisplayValue(num.toString())
      }
    } else {
      setDisplayValue("")
    }
  }, [value])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value


    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("")
      onChange?.(undefined)
      return
    }


    // Build regex pattern based on options
    const negativePattern = allowNegative ? "-?" : ""
    const decimalPattern = decimalPlaces > 0 ? `(\\.\\d{0,${decimalPlaces}})?` : ""
    const regex = new RegExp(`^${negativePattern}\\d*${decimalPattern}$`)


    // Validate input format
    if (regex.test(inputValue)) {
      setDisplayValue(inputValue)


      // Only call onChange with valid number
      const num = Number.parseFloat(inputValue)
      if (!isNaN(num)) {
        onChange?.(num)
      } else if (inputValue === "-" || inputValue === ".") {
        // Allow partial input while typing
        onChange?.(undefined)
      }
    }
  }


  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  )
}
