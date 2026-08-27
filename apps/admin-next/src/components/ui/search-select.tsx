'use client';

import { useContext, useState } from 'react';
import {
  Autocomplete,
  cn,
  ListBox,
  SearchField,
  useFilter,
} from '@heroui/react';

import { FieldLabelContext } from './form';

/**
 * Select con buscador dentro del popover (HeroUI Autocomplete: trigger
 * tipo select + SearchField que filtra el listbox). Mantiene el mismo
 * contrato nativo que `Select`:
 *
 *   - `name` envía el valor plano con FormData vía input invisible EN
 *     FLUJO (required valida con constraint validation nativa),
 *   - `onChange` recibe `{ target: { value } }`,
 *   - sin selección muestra `placeholder` y envía ''.
 *
 * El nombre accesible sale de `aria-label` o del label de `Field` vía
 * contexto, igual que el resto de primitivos del design system.
 */

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Línea secundaria (también participa en la búsqueda). */
  description?: string;
  disabled?: boolean;
}

export function SearchSelect({
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  placeholder = '— Selecciona —',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  options,
  className,
  triggerClassName,
  'aria-label': ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  options: SearchSelectOption[];
  className?: string;
  triggerClassName?: string;
  'aria-label'?: string;
}) {
  const fieldLabel = useContext(FieldLabelContext);
  const { contains } = useFilter({ sensitivity: 'base' });

  const [internal, setInternal] = useState<string>(
    () => defaultValue ?? (value != null ? String(value) : '')
  );
  const current = value != null ? String(value) : internal;
  const hasCurrent = options.some((option) => option.value === current);

  return (
    <>
      <Autocomplete
        aria-label={ariaLabel ?? fieldLabel}
        selectedKey={hasCurrent && current !== '' ? current : null}
        onSelectionChange={(key) => {
          const next = key == null ? '' : String(key);
          setInternal(next);
          onChange?.({ target: { value: next } });
        }}
        placeholder={placeholder}
        isDisabled={disabled}
        isInvalid={invalid}
        fullWidth
        className={className}
      >
        <Autocomplete.Trigger className={cn('w-full', triggerClassName)}>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter filter={contains}>
            <SearchField
              aria-label={searchPlaceholder}
              className="border-b border-separator p-2"
            >
              <SearchField.Group className="w-full">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={searchPlaceholder} autoFocus />
                <SearchField.ClearButton aria-label="Limpiar búsqueda" />
              </SearchField.Group>
            </SearchField>
            <ListBox
              renderEmptyState={() => (
                <div className="px-3 py-6 text-center text-sm text-muted">
                  {emptyMessage}
                </div>
              )}
              className="max-h-64 overflow-y-auto"
            >
              {options.map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={
                    option.description
                      ? `${option.label} ${option.description}`
                      : option.label
                  }
                  isDisabled={option.disabled}
                >
                  <div className="min-w-0">
                    <div className="truncate">{option.label}</div>
                    {option.description ? (
                      <div className="truncate text-xs text-muted">
                        {option.description}
                      </div>
                    ) : null}
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
      {name ? (
        // En flujo pero invisible: envía el valor con FormData y deja
        // que `required` bloquee el submit con la validación nativa
        // (mismo patrón que ui/select.tsx).
        <input
          type="text"
          name={name}
          value={current}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none block h-0 w-0 self-start border-0 p-0 opacity-0"
        />
      ) : null}
    </>
  );
}

/** Utilidad compartida: opciones únicas de cliente a partir de filas
 * candidatas (id vacío se ignora). */
export function uniqueClientOptions(
  rows: ReadonlyArray<{ clientId?: string | null; clientName?: string | null }>
): SearchSelectOption[] {
  const seen = new Map<string, string>();
  for (const row of rows) {
    if (row.clientId && row.clientName && !seen.has(row.clientId)) {
      seen.set(row.clientId, row.clientName);
    }
  }
  return [...seen.entries()]
    .map(([id, label]) => ({ value: id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
