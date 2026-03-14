import * as React from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface MobileDataCardRow {
  icon?: React.ElementType
  label: string
  value: React.ReactNode
}

interface MobileDataCardProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  primaryMetric?: React.ReactNode
  rows?: MobileDataCardRow[]
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
}

function MobileDataCard({
  title,
  subtitle,
  badges,
  primaryMetric,
  rows,
  actions,
  onClick,
  className,
}: MobileDataCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-l-4 border-l-primary shadow-sm p-4 space-y-3",
        onClick && "cursor-pointer active:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header: title + primary metric */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {primaryMetric && (
            <div className="font-bold text-sm text-right">{primaryMetric}</div>
          )}
          {actions}
        </div>
      </div>

      {/* Badges */}
      {badges && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-1.5">{badges}</div>
        </>
      )}

      {/* Data rows */}
      {rows && rows.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {row.icon && (
                  <row.icon className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-muted-foreground shrink-0">
                  {row.label}
                </span>
                <span className="ml-auto text-right truncate font-medium">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MobileDataCardList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  )
}

export { MobileDataCard, MobileDataCardList }
export type { MobileDataCardProps, MobileDataCardRow }
