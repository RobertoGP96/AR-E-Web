'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageAction } from '@/app/actions/upload';

interface ImageUploadFieldProps {
  /** Hidden input name — the resulting URL is submitted with the form. */
  name: string;
  label: string;
  defaultUrl?: string | null;
}

/**
 * Uploads to Cloudinary via a server action and stores the resulting
 * secure_url in a hidden input so it submits with the surrounding form
 * (same shape the previous plain-URL field used).
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
        toast.success('Image uploaded');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input type="hidden" name={name} value={url} readOnly />

      {url ? (
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Uploaded"
            className="h-14 w-14 rounded object-cover"
          />
          <span className="flex-1 truncate text-xs text-zinc-500">
            {url}
          </span>
          <button
            type="button"
            onClick={() => setUrl('')}
            aria-label="Remove image"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <Upload className="h-4 w-4" aria-hidden />
          {isPending ? 'Uploading…' : 'Upload an image'}
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
