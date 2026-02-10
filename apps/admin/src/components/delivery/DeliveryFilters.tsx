import { useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DeliveryFiltersComponent, {
  type DeliveryFilterState,
} from "@/components/filters/delivery-filters";
import { Button } from "../ui/button";
import CreateDeliveryDialog from "./CreateDeliveryDialog";
import { useDeliveries } from "@/hooks/delivery";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DeliveryFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  zoneFilter?: string;
  onZoneFilterChange?: (value: string) => void;
  filters?: DeliveryFilterState;
  onFiltersChange?: (f: DeliveryFilterState) => void;
}

export default function DeliveryFilters({
  searchTerm,
  onSearchChange,
  filters = { search: "", status: "all" },
  onFiltersChange = () => {},
}: DeliveryFiltersProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isFetching } = useDeliveries();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    toast.info("Actualizando entregas...");
  };
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por orden, cliente o delivery..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-sm shadow-sm"
            />
          </div>
        </div>
        <DeliveryFiltersComponent
          filters={filters}
          onFiltersChange={(newFilters) => onFiltersChange(newFilters)}
          resultCount={undefined}
        />
        <Button
          onClick={() => navigate("/delivery/new")}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Agregar Delivery
        </Button>
      </div>

      <CreateDeliveryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
