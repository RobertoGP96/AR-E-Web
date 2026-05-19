'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPackageAction,
  updatePackageAction,
  type ActionResult,
} from './actions';
import { ImageUploadField } from '@/components/image-upload-field';
import { PACKAGE_STATUSES, type PackageRow } from './schema';

interface PackageDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  pkg?: PackageRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function PackageDialog({
  open,
  mode,
  pkg,
  onClose,
  onSuccess,
}: PackageDialogProps) {
  const headingId = useId();
  const action = mode === 'create' ? createPackageAction : updatePackageAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);

  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  useEffect(() => {
    if (open) lastHandledRef.current = undefined;
  }, [open]);

  if (!open) return null;

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {mode === 'create' ? 'New package' : 'Edit package'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {mode === 'edit' && pkg ? (
            <input type="hidden" name="id" value={pkg.id} />
          ) : null}

          <Field
            label="Tracking number"
            name="numberOfTracking"
            type="text"
            defaultValue={pkg?.numberOfTracking ?? ''}
            error={errors['numberOfTracking']}
            required
            maxLength={100}
          />

          <Field
            label="Agency name"
            name="agencyName"
            type="text"
            defaultValue={pkg?.agencyName ?? ''}
            error={errors['agencyName']}
            required
            maxLength={100}
          />

          <div className="space-y-1">
            <label
              htmlFor="statusOfProcessing"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Status
            </label>
            <select
              id="statusOfProcessing"
              name="statusOfProcessing"
              defaultValue={pkg?.statusOfProcessing ?? 'Enviado'}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
                errors['statusOfProcessing']
                  ? 'border-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {PACKAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors['statusOfProcessing'] ? (
              <p className="text-xs text-red-600">
                {errors['statusOfProcessing']}
              </p>
            ) : null}
          </div>

          <Field
            label="Arrival date"
            name="arrivalDate"
            type="date"
            defaultValue={isoToDateInput(pkg?.arrivalDate)}
            error={errors['arrivalDate']}
            required
          />

          <ImageUploadField
            name="packagePicture"
            label="Package picture (optional)"
            defaultUrl={pkg?.packagePicture}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type: 'text' | 'url' | 'date';
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
}

function Field({
  label,
  name,
  type,
  defaultValue,
  placeholder,
  error,
  required,
  maxLength,
}: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        maxLength={maxLength}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 dark:bg-zinc-950 dark:focus:border-zinc-100 ${
          error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
