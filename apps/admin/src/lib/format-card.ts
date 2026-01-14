interface MaskOptions {
  maskChar?: string;
  addSpaces?: boolean;
  visibleStart?: number;
  visibleEnd?: number;
}

 export function maskCardNumberAdvanced(
  cardNumber: string, 
  options: MaskOptions = {}
): string {
  const {
    maskChar = '*',
    addSpaces = false,
    visibleStart = 4,
    visibleEnd = 4
  } = options;
  
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  if (cleaned.length < visibleStart + visibleEnd) {
    throw new Error(`El número debe tener al menos ${visibleStart + visibleEnd} dígitos`);
  }
  
  const start = cleaned.slice(0, visibleStart);
  const end = cleaned.slice(-visibleEnd);
  const middle = maskChar.repeat(cleaned.length - visibleStart - visibleEnd);
  
  let masked = `${start}${middle}${end}`;
  
  if (addSpaces) {
    masked = masked.match(/.{1,4}/g)?.join(' ') || masked;
  }
  
  return masked;
}