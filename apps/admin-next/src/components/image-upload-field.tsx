'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, X } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { uploadImageAction } from '@/app/actions/upload';

interface ImageUploadFieldProps {
  /** Hidden input name — the resulting URL is submitted with the form. */
  name: string;
  label: string;
  defaultUrl?: string | null;
}

/**
 * Uploads to Cloudinary via a server action and stores the resulting
 * secure_url in a hidden input so it submits with the surrounding form.
 */
export function ImageUploadField({
  name,
  label,
  defaultUrl,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState<string>(defaultUrl ?? '');

  function handleFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const result = await uploadImageAction(fd);
      if (result.ok) {
        setUrl(result.url);
        toast.success('Imagen subida', {
          description: `«${file.name}» se cargó correctamente.`,
        });
      } else {
        toast.error('No se pudo subir la imagen', {
          description: result.error,
        });
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={url} readOnly />

      {url ? (
        <div className="animate-in fade-in flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Imagen subida"
            className="h-14 w-14 rounded-md object-cover"
          />
          <span className="flex-1 truncate text-xs text-muted">{url}</span>
          <button
            type="button"
            onClick={() => setUrl('')}
            aria-label="Quitar imagen"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted transition-colors hover:border-accent/60 hover:bg-accent-soft/40 hover:text-accent-soft-foreground disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Spinner size="sm" aria-hidden />
              Subiendo…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden />
              Subir una imagen
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
