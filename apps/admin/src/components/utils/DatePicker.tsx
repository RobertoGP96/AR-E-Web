"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  label = "Fecha",
  placeholder = "Selecciona la fecha",
  disabled = false,
  required = false,
  className = "w-48",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={inputId} className="px-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={inputId}
            className={`justify-between font-normal ${className}`}
            disabled={disabled}
          >
            {value ? value.toLocaleDateString() : placeholder}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
