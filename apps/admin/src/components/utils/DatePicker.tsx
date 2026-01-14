"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }
  // Use getDate(), getMonth(), getFullYear() to avoid timezone issues
  const day = String(date.getDate()).padStart(2, '0')
  const monthNames = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}

function parseDateFromInput(value: string) {
  if (!value) return undefined
  const v = value.trim()

  // Numeric format: dd/mm/yyyy
  const numericMatch = v.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})$/)
  if (numericMatch) {
    const day = Number(numericMatch[1])
    const month = Number(numericMatch[2]) - 1
    const year = Number(numericMatch[3])
    // Use noon to avoid timezone issues
    const d = new Date(year, month, day, 12, 0, 0, 0)
    if (!isNaN(d.getTime())) return d
  }

  // Spanish text formats, a la "01 de junio de 2025" or "01 jun 2025"
  const textRegex = /^(\d{1,2})\s*(?:de\s+)?([a-záéíóúñ.]+)\s*(?:de\s+)?(\d{4})$/i
  const m = v.match(textRegex)
  if (m) {
    const day = Number(m[1])
    const monthStr = m[2].toLowerCase().replace(/\./g, "")
    const year = Number(m[3])
    const months = [
      'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'
    ]
    // Allow first 3 letter abbreviations
    let monthIdx = months.findIndex(mn => mn.startsWith(monthStr))
    if (monthIdx === -1) {
      // check 3-letter abbreviations
      monthIdx = months.findIndex(mn => mn.slice(0,3) === monthStr.slice(0,3))
    }
    if (monthIdx >= 0) {
      // Use noon to avoid timezone issues
      const d = new Date(year, monthIdx, day, 12, 0, 0, 0)
      if (!isNaN(d.getTime())) return d
    }
  }

  // Try native parse as last resort (can have timezone issues)
  const parsed = new Date(v)
  if (!isNaN(parsed.getTime())) {
    // Reset to noon to avoid timezone shifts
    parsed.setHours(12, 0, 0, 0)
    return parsed
  }

  return undefined
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  /** Controlled date value (Date) */
  selected?: Date | undefined
  /** Callback that emits the selected Date (or undefined) */
  onDateChange?: (date: Date | undefined) => void
  /** Locale for formatting */
  locale?: string
  /** Accept `value` as string (formatted), Date, or other input value shapes */
  value?: string | number | readonly string[] | Date | undefined
  /** Accept a flexible onChange handler (native event or date callback) */
  onChange?: ((date: Date | undefined) => void) | React.ChangeEventHandler<HTMLInputElement>
}

/**
 * DatePicker component usable as controlled/uncontrolled.
 * - Forwarded ref allows use with React Hook Form's `register()`.
 * - Prefer `Controller` for receiving Date objects directly:
 *   <Controller name="date" control={control} render={({ field }) => (
 *     <DatePicker selected={field.value} onDateChange={(d) => field.onChange(d)} ref={field.ref} />
 *   )} />
 * - If you use `register`, the input value will be the localized (es-ES) string.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      selected,
      onDateChange,
      locale = "es-ES",
      id = "date",
      placeholder = "-- --- ----",
      value: controlledValue,
      onChange: onChangeProp,
      defaultValue,
      ...rest
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(
      selected ?? (defaultValue ? parseDateFromInput(String(defaultValue)) : undefined)
    )
    const [month, setMonth] = React.useState<Date | undefined>(internalDate)

    const controlledValueIsDate = controlledValue instanceof Date

    // value shown in input (string)
    const [internalValue, setInternalValue] = React.useState<string>(
      controlledValue !== undefined ? String(controlledValue) : formatDate(internalDate)
    )

    // Sync when controlled props change
    React.useEffect(() => {
      if (selected !== undefined) {
        setInternalDate(selected)
        setInternalValue(formatDate(selected))
        setMonth(selected)
      }
    }, [selected, locale])

    React.useEffect(() => {
      if (controlledValue !== undefined) {
        if (controlledValueIsDate) {
          const asDate = controlledValue as unknown as Date
          setInternalDate(asDate)
          setInternalValue(formatDate(asDate))
          setMonth(asDate)
        } else {
          setInternalValue(String(controlledValue))
        }
      }
    }, [controlledValue, controlledValueIsDate, locale])

    type OnChangeAny = (param?: Date | React.ChangeEvent<HTMLInputElement> | undefined) => void
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value
      setInternalValue(raw)
      // If the consumer passed a Date as `value`, then `onChange` likely expects Date
      if (onChangeProp) {
        const oc = onChangeProp as unknown as OnChangeAny
        if (controlledValueIsDate) {
          // parse and call with date (for backward compatibility)
          const parsed = parseDateFromInput(raw)
          oc(parsed)
        } else {
          // Treat as native input onChange (e.g., from react-hook-form register)
          oc(e)
        }
      }

      const parsed = parseDateFromInput(raw)
      if (isValidDate(parsed)) {
        setInternalDate(parsed)
        setMonth(parsed)
        onDateChange?.(parsed)
      } else {
        onDateChange?.(undefined)
      }
    }

    return (
      <div className="flex flex-col gap-3">
        <Label htmlFor={id} className="px-1">
          {label || "Fecha:"}
        </Label>
        <div className="relative flex gap-2">
          <Input
            id={id}
            name={rest.name}
            value={internalValue}
            placeholder={placeholder}
            className="bg-background pr-10"
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setOpen(true)
              }
            }}
            ref={ref}
            {...rest}
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`${id}-picker`}
                variant="ghost"
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              >
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={internalDate}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  setInternalDate(date)
                  setInternalValue(formatDate(date))
                  if (onChangeProp && controlledValueIsDate) {
                    const oc = onChangeProp as unknown as OnChangeAny
                    oc(date)
                  }
                  onDateChange?.(date)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"