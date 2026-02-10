import { Plus, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import PackageFilters, {
  type PackageFilterState,
} from "@/components/filters/package-filters";
import { usePackages } from "@/hooks/package";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PackagesFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  cityFilter?: string;
  onCityFilterChange?: (value: string) => void;
  filters?: PackageFilterState;
  onFiltersChange?: (f: PackageFilterState) => void;
}

export default function PackagesFilters({
  searchTerm,
  onSearchChange,
  filters = { search: "", status_of_processing: "all" },
  onFiltersChange = () => {},
}: PackagesFiltersProps) {
  const { isFetching } = usePackages();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["packages"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    toast.info("Actualizando paquetes...");
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
              placeholder="Buscar por código de paquete, destinatario..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-sm shadow-sm"
            />
          </div>
        </div>
        <PackageFilters
          filters={filters}
          onFiltersChange={(newFilters) => onFiltersChange(newFilters)}
          resultCount={undefined}
        />
        <Button
          onClick={() => navigate("/packages/new")}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Agregar Paquete
        </Button>
      </div>
    </>
  );
}
