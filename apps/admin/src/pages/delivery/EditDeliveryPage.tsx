import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DeliveryForm } from "@/components/delivery/delivery-form";
import { useSingleDelivery } from "@/hooks/delivery/useSingleDelivery";

export default function EditDeliveryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { delivery, isLoading } = useSingleDelivery(id ? parseInt(id) : 0);

  const handleSuccess = () => {
    navigate("/delivery");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-500 font-medium">Cargando entrega...</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-xl font-bold text-slate-900">
          Entrega no encontrada
        </p>
        <Button
          variant="link"
          onClick={() => navigate("/delivery")}
          className="mt-4 text-blue-600"
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/delivery")}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Deliveries
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DeliveryForm
          delivery={delivery}
          onSuccess={handleSuccess}
          onCancel={() => navigate("/delivery")}
        />
      </div>
    </div>
  );
}
