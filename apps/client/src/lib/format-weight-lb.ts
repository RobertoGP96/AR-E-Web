export function formatWeightLb(weight: number | string): string {
  // Convierte a número si es string
  const num = typeof weight === "string" ? parseFloat(weight) : weight;
  if (isNaN(num)) return "";
  // Formatea con dos decimales y agrega el sufijo lb
  return `${num.toFixed(2)} lb`;
}
