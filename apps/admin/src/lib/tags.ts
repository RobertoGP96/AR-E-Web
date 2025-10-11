// Serializa tags al final de la descripción. Si tags está vacío, devuelve description (sin separar).
export function serializeTagsToDescription(description: string | undefined, tags: StoredTag[] | string[]): string {
  const desc = (description ?? '').trim();
  if (!tags || tags.length === 0) return desc;
  // Normalizar tags a JSON array de objetos si vienen como strings
  const normalized: StoredTag[] = (tags as Array<StoredTag | string>).map(t => {
    if (typeof t === 'string') {
      const s = t;
      // intentar split key:value
      if (s.includes(':')) {
        const [k, ...rest] = s.split(':');
        return { name: k.trim(), value: rest.join(':').trim() };
      }
      if (s.includes('=')) {
        const [k, ...rest] = s.split('=');
        return { name: k.trim(), value: rest.join('=').trim() };
      }
      return { name: s.trim(), value: '' };
    }
    return t as StoredTag;
  });
  return `${desc}\n\n--TAGS--\n${JSON.stringify(normalized)}`;
}

export type StoredTag = {
  name: string
  value?: string
}


const SEP = "\n\n--TAGS--\n"


export function parseTagsFromDescriptionBlock(description?: string): StoredTag[] {
  if (!description) return [];
  try {
    const content = description.trim();
    const idx = content.indexOf(SEP);
    if (idx === -1) return [];
    let after = content.substring(idx + SEP.length).trim();
    if (!after) return [];
    after = after.replace(/\r?\n/g, '').replace(/\s{2,}/g, ' ');
    const parsed = JSON.parse(after);
    if (Array.isArray(parsed)) {
      return parsed.map(tagObj => {
        if (tagObj && typeof tagObj === 'object' && !Array.isArray(tagObj)) {
          return {
            name: String(tagObj.name ?? ''),
            value: String(tagObj.value ?? '')
          };
        }
        return { name: String(tagObj ?? ''), value: '' };
      });
    }
    return [];
  } catch (err) {
    console.warn('parseTagsFromDescriptionBlock parse error', err);
    return [];
  }
}
