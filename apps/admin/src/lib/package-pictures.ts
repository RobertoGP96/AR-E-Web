import type { Package, PackageImage } from "@/types/models/package";

function toUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "object" && "picture" in value) {
    return toUrl((value as { picture?: string }).picture);
  }
  return null;
}

/**
 * Normaliza las fotos de un paquete a una lista de URLs.
 *
 * El backend devuelve `package_picture` y `package_picture_2` como
 * cadenas (URL o ""); los datos históricos pueden traer `package_picture`
 * como array de URLs u objetos `{ picture }`. Se conserva el orden
 * foto 1 → foto 2 y se descartan las entradas vacías.
 */
export function getPackagePictures(
  pkg: Pick<Package, "package_picture" | "package_picture_2">,
): string[] {
  const first: unknown[] = Array.isArray(pkg.package_picture)
    ? (pkg.package_picture as PackageImage[])
    : [pkg.package_picture];
  const urls = [...first, pkg.package_picture_2]
    .map(toUrl)
    .filter((u): u is string => u !== null);
  return Array.from(new Set(urls));
}

/** Máximo de fotos por paquete (foto 1 y foto 2). */
export const MAX_PACKAGE_PICTURES = 2;
