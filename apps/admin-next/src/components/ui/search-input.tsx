'use client';

import { useState } from 'react';
import { SearchField } from '@heroui/react';

/**
 * Standard table search box (HeroUI SearchField): icon, Enter/blur to
 * apply, built-in clear button (Escape also clears). URL-driven pages
 * pass the applied value and receive onApply.
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
    <SearchField
      value={value}
      onChange={setValue}
      onSubmit={(applied) => onApply(applied || null)}
      onClear={() => {
        if (initialValue) onApply(null);
      }}
      aria-label={placeholder}
      fullWidth
      className={className ?? 'flex-1 lg:max-w-xs'}
    >
      <SearchField.Group className="w-full">
        <SearchField.SearchIcon />
        <SearchField.Input
          placeholder={placeholder}
          onBlur={() => {
            if (value !== initialValue) onApply(value || null);
          }}
        />
        <SearchField.ClearButton aria-label="Limpiar búsqueda" />
      </SearchField.Group>
    </SearchField>
  );
}
