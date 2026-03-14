import { useIsMobile } from "./use-mobile"

type ViewMode = "table" | "cards"

export function useResponsiveView(): { viewMode: ViewMode } {
  const isMobile = useIsMobile()
  return { viewMode: isMobile ? "cards" : "table" }
}
