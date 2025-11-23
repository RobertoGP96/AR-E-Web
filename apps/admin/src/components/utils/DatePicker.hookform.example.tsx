"use client"

import { useForm, Controller } from "react-hook-form"
import { DatePicker } from "./DatePicker"
import { Button } from "@/components/ui/button"

type FormValues = {
  dateString?: string
  date?: Date | null
}

export default function DatePickerHookFormExample() {
  const { handleSubmit, control } = useForm<FormValues>({
    defaultValues: { date: new Date() },
  })

  const onControllerSubmit = (data: FormValues) => {
    console.log("controller form submit:", data)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">Usa <code>Controller</code> para integrar este componente con React Hook Form. Ejemplo abajo.</p>

      <form onSubmit={handleSubmit(onControllerSubmit)} className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Usando Controller</h3>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePicker
              selected={field.value ?? undefined}
              onDateChange={(d) => field.onChange(d)}
              label="Fecha (Controller)"
              // Pass field.ref so react-hook-form can get access
              ref={field.ref}
            />
          )}
        />
        <Button type="submit">Enviar controller</Button>
      </form>
    </div>
  )
}
