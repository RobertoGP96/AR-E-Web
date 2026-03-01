import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { ProductBuyed } from "@/types/models";

type SearchCriteria = "id" | "sku" | "nombre" | "cliente" | "agente";

interface ProductSearchBarProps {
  items: ProductBuyed[];
  onSearch: (query: string, criteria: SearchCriteria) => void;
  onSelectSuggestion: (product: ProductBuyed) => void;
}

const CRITERIA_OPTIONS: { value: SearchCriteria; label: string }[] = [
  { value: "id", label: "ID del Producto" },
  { value: "sku", label: "SKU" },
  { value: "nombre", label: "Nombre" },
  { value: "cliente", label: "Cliente" },
  { value: "agente", label: "Agente" },
];

export function ProductSearchBar({
  items,
  onSearch,
  onSelectSuggestion,
}: ProductSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCriteria, setSelectedCriteria] =
    useState<SearchCriteria>("nombre");
  const [isOpen, setIsOpen] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();

    return items.filter((item) => {
      const product = item.original_product_details;
      if (!product) return false;

      switch (selectedCriteria) {
        case "id":
          return (
            item.id?.toString().toLowerCase().includes(query) ||
            item.product_id?.toString().toLowerCase().includes(query)
          );
        case "sku":
          return product.sku?.toLowerCase().includes(query);
        case "nombre":
          return product.name?.toLowerCase().includes(query);
        case "cliente":
          return product.client_name?.toLowerCase().includes(query);
        case "agente":
          // Si no tienes un campo de agente, puedes usar shop o crear uno
          return (
            product.shop?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
          );
        default:
          return false;
      }
    });
  }, [searchQuery, selectedCriteria, items]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query, selectedCriteria);
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleCriteriaChange = (criteria: SearchCriteria) => {
    setSelectedCriteria(criteria);
    if (searchQuery.trim()) {
      onSearch(searchQuery, criteria);
    }
  };

  const handleSelectSuggestion = (product: ProductBuyed) => {
    onSelectSuggestion(product);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearch("", selectedCriteria);
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Selector de criterio */}
        <Select value={selectedCriteria} onValueChange={handleCriteriaChange}>
          <SelectTrigger className="w-full sm:w-[200px] border-slate-200 bg-slate-50/50">
            <SelectValue placeholder="Buscar por..." />
          </SelectTrigger>
          <SelectContent>
            {CRITERIA_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input con Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder={`Buscar entre ${items.length} producto${items.length !== 1 ? "s" : ""}...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 border-slate-200 bg-white focus:ring-orange-500 focus:border-orange-500"
                onFocus={() => searchQuery.trim() && setIsOpen(true)}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>

          {/* Suggestions List */}
          {filteredSuggestions.length > 0 && (
            <PopoverContent
              className="w-[320px] p-0 border-slate-200"
              align="start"
            >
              <div className="max-h-[400px] overflow-y-auto">
                <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {filteredSuggestions.length === 1
                      ? "1 resultado encontrado"
                      : `${filteredSuggestions.length} resultados encontrados`}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredSuggestions.map((item) => {
                    const product = item.original_product_details;
                    if (!product) return null;

                    const productId = (item.product_id || product.id) as string;

                    return (
                      <button
                        key={productId}
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full px-4 py-3 hover:bg-orange-50 transition-colors text-left group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                              {product.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-slate-100 text-slate-600 border-none"
                              >
                                {product.sku}
                              </Badge>
                              {product.client_name && (
                                <span className="text-xs text-slate-500">
                                  Cliente: {product.client_name}
                                </span>
                              )}
                            </div>
                            {product.category && (
                              <p className="text-xs text-slate-400 mt-1 capitalize">
                                {product.category}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-orange-500">
                              ${(product.total_cost || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              Qty: {item.amount_buyed}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          )}

          {/* No results message */}
          {searchQuery && filteredSuggestions.length === 0 && (
            <PopoverContent
              className="w-[320px] p-4 border-slate-200"
              align="start"
            >
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 font-medium">
                  No se encontraron resultados para "{searchQuery}"
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Busca entre los {items.length} producto{items.length !== 1 ? "s" : ""} en el carrito por:{" "}
                  <span className="font-semibold">
                    {CRITERIA_OPTIONS.find((o) => o.value === selectedCriteria)?.label.toLowerCase()}
                  </span>
                </p>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  );
}
