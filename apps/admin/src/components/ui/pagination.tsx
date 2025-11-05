import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps extends React.ComponentProps<"nav"> {
  className?: string;
}

function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

interface PaginationContentProps extends React.ComponentProps<"ul"> {
  className?: string;
}

function PaginationContent({ className, ...props }: PaginationContentProps) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

interface PaginationItemProps extends React.ComponentProps<"li"> {
  className?: string;
}

function PaginationItem({ className, ...props }: PaginationItemProps) {
  return <li className={cn("", className)} {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
} & React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "outline" : "ghost"}
      size={size}
      disabled={disabled}
      className={cn(
        isActive && "border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Ir a la página anterior"
      className={cn("gap-1 pl-2.5", className)}
      disabled={disabled}
      size="default"
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Anterior</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Ir a la página siguiente"
      className={cn("gap-1 pr-2.5", className)}
      disabled={disabled}
      size="default"
      {...props}
    >
      <span>Siguiente</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
