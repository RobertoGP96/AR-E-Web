import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { es } from "date-fns/locale";
import { format, isValid, setHours, setMinutes, setSeconds } from "date-fns";
import type { Locale } from "date-fns";

// Cuban Spanish locale override
const cubanLocale: Locale = {
  ...es,
  localize: {
    ...es.localize!,
    month: (n: number) =>
      (
        [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ] as const
      )[n],
    day: (n: number) =>
      (["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const)[n],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a 24h Date to a 12h time string "hh:mm:ss" and period "AM"|"PM" */
function dateTo12h(date: Date): { timeStr: string; period: "AM" | "PM" } {
  let h = date.getHours();
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return { timeStr: `${String(h).padStart(2, "0")}:${mm}:${ss}`, period };
}

/** Apply a 12h time string + period to an existing Date */
function apply12hTime(base: Date, timeStr: string, period: "AM" | "PM"): Date {
  // Accept partial input too
  const parts = timeStr.split(":").map(Number);
  let h = isNaN(parts[0]) ? 0 : parts[0] % 12;
  const m = isNaN(parts[1]) ? 0 : parts[1];
  const s = isNaN(parts[2]) ? 0 : parts[2];
  if (period === "PM") h += 12;
  let d = setHours(base, h);
  d = setMinutes(d, m);
  d = setSeconds(d, s);
  return d;
}

// ─── DateTimePicker ────────────────────────────────────────────────────────────

export interface DateTimePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  label = "Fecha y hora",
  placeholder = "Seleccionar fecha y hora...",
  disabled = false,
}: DateTimePickerProps) {
  const [date, setDate] = useState<Date | null>(
    value instanceof Date && isValid(value) ? value : null,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // When popover opens, initialise to current date/time if nothing selected
  const handleOpenChange = (next: boolean) => {
    if (next) {
      const now = date ?? new Date();
      if (!date) {
        setDate(now);
        onChange?.(now);
      }
      const { timeStr: ts, period: p } = dateTo12h(now);
      setTimeStr(ts);
      setPeriod(p);
    }
    setOpen(next);
  };

  const handleDaySelect = (day: Date | undefined): void => {
    if (!day) return;
    const newDate = apply12hTime(day, timeStr, period);
    setDate(newDate);
    onChange?.(newDate);
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    setTimeStr(raw);
    if (!date) return;
    const newDate = apply12hTime(date, raw, period);
    if (isValid(newDate)) {
      setDate(newDate);
      onChange?.(newDate);
    }
  };

  const handleTimeBlur = (): void => {
    // Normalise on blur
    if (date && isValid(date)) {
      const { timeStr: ts } = dateTo12h(date);
      setTimeStr(ts);
    }
  };

  const togglePeriod = (): void => {
    const newPeriod: "AM" | "PM" = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    if (!date) return;
    const newDate = apply12hTime(date, timeStr, newPeriod);
    setDate(newDate);
    onChange?.(newDate);
  };

  const handleClear = (): void => {
    setDate(null);
    setTimeStr("");
    setPeriod("AM");
    onChange?.(null);
  };

  const formatted: string =
    date && isValid(date)
      ? format(date, "dd/MM/yyyy hh:mm:ss aa", { locale: cubanLocale })
      : "";

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-sm">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {formatted || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={handleDaySelect}
            locale={cubanLocale}
            initialFocus
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Hora exacta</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Time input */}
              <Input
                value={timeStr}
                onChange={handleTimeInput}
                onBlur={handleTimeBlur}
                placeholder="hh:mm:ss"
                className="font-mono text-center flex-1"
                maxLength={8}
              />
              {/* AM / PM toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePeriod}
                className="w-14 font-semibold shrink-0"
              >
                {period}
              </Button>
            </div>
            {date && isValid(date) && (
              <p className="text-xs text-center text-muted-foreground mt-2 font-mono">
                {format(date, "dd/MM/yyyy hh:mm:ss aa")}
              </p>
            )}
          </div>
          <div className="flex gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Limpiar
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setOpen(false)}>
              Aceptar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
