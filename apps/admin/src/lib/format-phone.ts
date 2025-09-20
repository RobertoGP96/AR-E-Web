export function formatPhone(phone: string): string {
  // Elimina todos los caracteres que no sean dígitos
  const cleaned = phone.replace(/\D/g, "");

  // Formato para Cuba: +53 XXXXXXXX (8 dígitos después del 53)
  if ((cleaned.length === 10 && cleaned.startsWith("53"))) {
    // Ejemplo: 5353844409 => +53 5384-4409
    return `+53 ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  // Si el número es móvil cubano (empieza por 5 después del 53)
  if (cleaned.length === 10 && cleaned.startsWith("535")) {
    // Ejemplo: 5351234567 => +53 5123-4567
    return `+53 ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  // Si el número es fijo de La Habana (empieza por 7 después del 53)
  if (cleaned.length === 10 && cleaned.startsWith("537")) {
    // Ejemplo: 5371234567 => +53 7123-4567
    return `+53 ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  // Formatea según el patrón internacional +XX (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    // Ejemplo: 1234567890 => (123) 456-7890
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // Ejemplo: 11234567890 => +1 (123) 456-7890
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 11) {
    // Ejemplo: +XX (XXX) XXX-XXXX
    return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  }
  // Si no coincide con ningún patrón, retorna el número limpio
  return cleaned;
}
