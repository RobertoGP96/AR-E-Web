// Helper para parsear la sección --TAGS-- que contiene un JSON array
// Ejemplo esperado: "--TAGS--\n[{"icon":{},"name":"Talla","value":"L"},{"name":"Color","value":"Rojo"}]"
export type ParsedTag = { name: string; value: string };

/**
 * Extrae las tags desde un texto que contiene la sección `--TAGS--\n` seguida
 * de un JSON array de objetos. Devuelve un array de objetos con {name, value}.
 * Si no se encuentra la sección o el JSON no es válido, devuelve []
 */
export function parseTagsFromDescriptionJsonBlock(description?: string): ParsedTag[] {
  if (!description) return [];

  const SEP = "--TAGS--\n";
  try {
    const idx = description.indexOf(SEP);
    if (idx === -1) return [];

    const jsonPart = description.substring(idx + SEP.length).trim();
    if (!jsonPart) return [];

    // Intentar parsear hasta el final del array JSON. Puede haber texto adicional después,
    // por eso buscamos el cierre del array ']' y recortamos hasta ahí.
    const endIdx = jsonPart.indexOf(']');
    const maybeJson = endIdx === -1 ? jsonPart : jsonPart.substring(0, endIdx + 1);

    const parsed = JSON.parse(maybeJson);
    if (!Array.isArray(parsed)) return [];

    const out: ParsedTag[] = [];
    for (const item of parsed) {
      if (!item) continue;
      const name = typeof item.name === 'string' ? item.name.trim() : (item.label || item.key || '')
      const value = typeof item.value === 'string' ? item.value.trim() : (item.val || '')
      if (name || value) {
        out.push({ name: name || value, value: value || name });
      }
    }

    return out;
  } catch {
    // Si hay error en el parseo JSON, devolvemos array vacío
    // No hacemos console.error para evitar ruido en producción
    return [];
  }
}
