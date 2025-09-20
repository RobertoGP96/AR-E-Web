/**
 * Configuración de colores para la aplicación
 * Incluye paletas de bee, honey y variables CSS de shadcn/ui
 */

export const beeColors = {
  50: 'hsl(33 100% 97%)',
  100: 'hsl(34 100% 92%)',
  200: 'hsl(32 98% 83%)',
  300: 'hsl(31 97% 72%)',
  400: 'hsl(27 96% 61%)',
  500: 'hsl(24 95% 53%)', // Color principal
  600: 'hsl(20 91% 48%)',
  700: 'hsl(17 88% 40%)',
  800: 'hsl(15 86% 34%)',
  900: 'hsl(12 84% 29%)',
  950: 'hsl(9 82% 24%)',
} as const

export const honeyColors = {
  50: 'hsl(54 91% 95%)',
  100: 'hsl(48 96% 89%)',
  200: 'hsl(48 95% 76%)',
  300: 'hsl(46 91% 58%)',
  400: 'hsl(43 96% 56%)',
  500: 'hsl(38 92% 50%)', // Color principal
  600: 'hsl(32 95% 44%)',
  700: 'hsl(26 90% 37%)',
  800: 'hsl(23 83% 31%)',
  900: 'hsl(22 78% 26%)',
  950: 'hsl(20 75% 21%)',
} as const

/**
 * Función helper para obtener colores CSS variables de shadcn/ui
 */
export const getCSSVariable = (variable: string) => `hsl(var(--${variable}))`

/**
 * Colores del sistema usando CSS variables
 */
export const systemColors = {
  background: getCSSVariable('background'),
  foreground: getCSSVariable('foreground'),
  primary: getCSSVariable('primary'),
  primaryForeground: getCSSVariable('primary-foreground'),
  secondary: getCSSVariable('secondary'),
  secondaryForeground: getCSSVariable('secondary-foreground'),
  accent: getCSSVariable('accent'),
  accentForeground: getCSSVariable('accent-foreground'),
  muted: getCSSVariable('muted'),
  mutedForeground: getCSSVariable('muted-foreground'),
  card: getCSSVariable('card'),
  cardForeground: getCSSVariable('card-foreground'),
  popover: getCSSVariable('popover'),
  popoverForeground: getCSSVariable('popover-foreground'),
  border: getCSSVariable('border'),
  input: getCSSVariable('input'),
  ring: getCSSVariable('ring'),
  destructive: getCSSVariable('destructive'),
  destructiveForeground: getCSSVariable('destructive-foreground'),
} as const

/**
 * Colores del sidebar usando CSS variables
 */
export const sidebarColors = {
  sidebar: getCSSVariable('sidebar'),
  sidebarForeground: getCSSVariable('sidebar-foreground'),
  sidebarPrimary: getCSSVariable('sidebar-primary'),
  sidebarPrimaryForeground: getCSSVariable('sidebar-primary-foreground'),
  sidebarAccent: getCSSVariable('sidebar-accent'),
  sidebarAccentForeground: getCSSVariable('sidebar-accent-foreground'),
  sidebarBorder: getCSSVariable('sidebar-border'),
  sidebarRing: getCSSVariable('sidebar-ring'),
} as const

/**
 * Colores de estado para la aplicación
 */
export const statusColors = {
  success: beeColors[500],
  warning: honeyColors[500],
  error: getCSSVariable('destructive'),
  info: 'hsl(217 91% 60%)',
} as const

/**
 * Función helper para crear variantes de color
 */
export const createColorVariant = (baseColor: string, opacity: number) => {
  return `${baseColor} / ${opacity}`
}

/**
 * Mapeo de colores para facilitar el uso en componentes
 */
export const colorMap = {
  bee: beeColors,
  honey: honeyColors,
  system: systemColors,
  sidebar: sidebarColors,
  status: statusColors,
} as const

export type ColorPalette = keyof typeof colorMap
export type BeeColorShade = keyof typeof beeColors
export type HoneyColorShade = keyof typeof honeyColors
