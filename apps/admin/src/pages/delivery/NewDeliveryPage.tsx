import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DeliveryForm } from "@/components/delivery/delivery-form";

export default function NewDeliveryPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to delivery list after successful submission
    navigate("/delivery");
  };

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
          onSuccess={handleSuccess}
          onCancel={() => navigate("/delivery")}
        />
      </div>
    </div>
  );
}
