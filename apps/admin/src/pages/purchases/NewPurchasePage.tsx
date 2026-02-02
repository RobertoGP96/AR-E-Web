import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PurchaseForm } from "@/components/purshases/purshase-form";

export default function NewPurchasePage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to purchases list after successful submission
    navigate("/purchases");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/purchases")}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Compras
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <PurchaseForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
