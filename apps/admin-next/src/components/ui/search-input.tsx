'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Standard table search box: icon, Enter/blur to apply, clear button.
 * URL-driven pages pass the applied value and receive onApply.
 */
export function SearchInput({
  initialValue,
  placeholder,
  onApply,
  className,
}: {
  initialValue: string;
  placeholder: string;
  onApply: (value: string | null) => void;
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <label className={`relative block ${className ?? 'flex-1 lg:max-w-xs'}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onApply(value || null);
        }}
        onBlur={() => {
          if (value !== initialValue) onApply(value || null);
        }}
        className="field-input pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setValue('');
            if (initialValue) onApply(null);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
