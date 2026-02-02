'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  Filter,
  UserCircle,
  AlertCircle,
  CircleDollarSign,
  CheckCircle,
  X,
  DollarSign,
} from 'lucide-react'

export interface FilterState {
  searchTerm: string
  statusFilter: string
  agentFilter: string
  balanceRange: [number, number]
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  agents: string[]
  balanceMin: number
  balanceMax: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  agents,
  balanceMin,
  balanceMax,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const resetFilters = () => {
    onFiltersChange({
      searchTerm: '',
      statusFilter: 'all',
      agentFilter: 'all',
      balanceRange: [balanceMin, balanceMax],
    })
  }

  const hasActiveFilters =
    filters.statusFilter !== 'all' ||
    filters.agentFilter !== 'all' ||
    filters.balanceRange[0] !== balanceMin ||
    filters.balanceRange[1] !== balanceMax

  const activeFilterCount = [
    filters.statusFilter !== 'all',
    filters.agentFilter !== 'all',
    filters.balanceRange[0] !== balanceMin || filters.balanceRange[1] !== balanceMax,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Barra de busqueda siempre visible */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o telefono..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Popover de filtros */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtros</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpiar todo
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Filtro por estado */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Estado</Label>
              <Select
                value={filters.statusFilter}
                onValueChange={(value) => updateFilter('statusFilter', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="DEUDA">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Con Deuda
                    </div>
                  </SelectItem>
                  <SelectItem value="SALDO A FAVOR">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                      Saldo a Favor
                    </div>
                  </SelectItem>
                  <SelectItem value="AL DIA">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-500" />
                      Al Dia
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por agente */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Agente</Label>
              <Select
                value={filters.agentFilter}
                onValueChange={(value) => updateFilter('agentFilter', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los agentes</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        {agent}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slider de rango de balance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Rango de Balance
                </Label>
              </div>

              <Slider
                value={filters.balanceRange}
                onValueChange={(value) =>
                  updateFilter('balanceRange', value as [number, number])
                }
                min={balanceMin}
                max={balanceMax}
                step={100}
                className="w-full"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(filters.balanceRange[0])}</span>
                <span>{formatCurrency(filters.balanceRange[1])}</span>
              </div>

              {/* Inputs de rango manual */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min-balance" className="text-xs text-muted-foreground">
                    Minimo
                  </Label>
                  <Input
                    id="min-balance"
                    type="number"
                    value={filters.balanceRange[0]}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value <= filters.balanceRange[1]) {
                        updateFilter('balanceRange', [value, filters.balanceRange[1]])
                      }
                    }}
                    min={balanceMin}
                    max={filters.balanceRange[1]}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-balance" className="text-xs text-muted-foreground">
                    Maximo
                  </Label>
                  <Input
                    id="max-balance"
                    type="number"
                    value={filters.balanceRange[1]}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value >= filters.balanceRange[0]) {
                        updateFilter('balanceRange', [filters.balanceRange[0], value])
                      }
                    }}
                    min={filters.balanceRange[0]}
                    max={balanceMax}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {filters.statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.statusFilter}
                    <button
                      onClick={() => updateFilter('statusFilter', 'all')}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.agentFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.agentFilter}
                    <button
                      onClick={() => updateFilter('agentFilter', 'all')}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(filters.balanceRange[0] !== balanceMin ||
                  filters.balanceRange[1] !== balanceMax) && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {formatCurrency(filters.balanceRange[0])} - {formatCurrency(filters.balanceRange[1])}
                    <button
                      onClick={() => updateFilter('balanceRange', [balanceMin, balanceMax])}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
