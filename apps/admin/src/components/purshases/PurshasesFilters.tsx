import { Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import PurchaseFilters, {
  type PurchaseFilterState,
} from "@/components/filters/purchase-filters";
import { useShoppingReceipts } from "@/hooks/shopping-receipts";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PurshasesFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPurchaseCreated?: () => void;
  filters?: PurchaseFilterState;
  onFiltersChange?: (f: PurchaseFilterState) => void;
}

export default function PurshasesFilters({
  searchValue = "",
  onSearchChange,
  filters = { search: "", status_of_shopping: "all" },
  onFiltersChange = () => {},
}: PurshasesFiltersProps & { onRefresh?: () => void }) {
  const { isFetching } = useShoppingReceipts();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const handleNewPurchase = () => {
    navigate("/purchases/new");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shopping-receipts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    toast.info("Actualizando compras...");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          title="Actualizar lista"
          className="border-gray-200 hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw
            className={`${isFetching ? "animate-spin" : ""} h-4 w-4`}
          />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar compras..."
            className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 shadow-sm"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>
      <PurchaseFilters
        filters={filters}
        onFiltersChange={(newFilters) => onFiltersChange(newFilters)}
        resultCount={undefined}
      />

      <Button
        className="flex items-center gap-2 border-0"
        onClick={handleNewPurchase}
      >
        <Plus className="h-5 w-5" />
        Crear Compra
      </Button>
    </div>
  );
}
