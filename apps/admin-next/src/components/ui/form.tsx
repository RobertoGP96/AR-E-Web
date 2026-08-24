'use client';

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Button } from '@heroui/react';
import { Loader2 } from 'lucide-react';

/**
 * Form primitives of the design system. They stay native
 * (input/select/textarea) so FormData + server actions keep working
 * unchanged, but carry the HeroUI field treatment via the .field-*
 * classes defined in globals.css.
 */

export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block space-y-1.5 ${className ?? ''}`}>
      <span className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`field-input ${className ?? ''}`}
    />
  );
}

export function NativeSelect({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`field-input ${className ?? ''}`}
    >
      {children}
    </select>
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={`field-input min-h-20 ${className ?? ''}`}
    />
  );
}

/** Primary submit button with pending spinner (HeroUI Button). */
export function SubmitButton({
  isPending,
  children,
  pendingText = 'Guardando…',
  className,
}: {
  isPending: boolean;
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={isPending}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Inline form-level error banner. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="animate-in fade-in slide-in-from-top-1 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger-soft-foreground"
    >
      {message}
    </div>
  );
}
