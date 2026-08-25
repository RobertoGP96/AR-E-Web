'use client';

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import {
  Alert,
  Button,
  cn,
  Input,
  inputVariants,
  Spinner,
  TextArea as HeroUITextArea,
} from '@heroui/react';

/**
 * Form primitives of the design system, built on the HeroUI field
 * components. They render native input/select/textarea elements
 * underneath, so FormData + server actions keep working unchanged.
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

/** HeroUI styles key the invalid state off data-invalid; keep
 * aria-invalid alongside for assistive tech. */
function invalidProps(invalid?: boolean) {
  return invalid
    ? ({ 'aria-invalid': true, 'data-invalid': 'true' } as const)
    : {};
}

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <Input {...props} {...invalidProps(invalid)} fullWidth className={className} />
  );
}

/** Native select with the HeroUI Input field treatment (there is no
 * HeroUI native select; its listbox Select would change the form
 * semantics, so only the styling is shared). */
export function NativeSelect({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      {...invalidProps(invalid)}
      className={cn(inputVariants({ fullWidth: true }), className)}
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
    <HeroUITextArea
      {...props}
      {...invalidProps(invalid)}
      fullWidth
      className={cn('min-h-20', className)}
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
          <Spinner size="sm" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Inline form-level error banner (HeroUI Alert). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Alert
      status="danger"
      role="alert"
      className="animate-in fade-in slide-in-from-top-1 items-center gap-2.5 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 shadow-none"
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
