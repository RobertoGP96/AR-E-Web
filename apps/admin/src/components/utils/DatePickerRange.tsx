"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { es } from "date-fns/locale";

export interface DatePickerWithRangeProps {
  value?: DateRange | undefined;
  onChange?: (date: DateRange | undefined) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePickerWithRange({
  value,
  onChange,
  label,
  className,
  disabled = false,
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(value.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(value.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DatePickerWithRange;
