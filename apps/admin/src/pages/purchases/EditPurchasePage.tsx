import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useShoppingReceipt } from "@/hooks/shopping-receipts/useShoppingReceipt";
import { PurchaseForm } from "@/components/purshases/purshase-form";
import LoadingSpinner from "@/components/utils/LoadingSpinner";

export default function EditPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    shoppingReceipt: purchase,
    isLoading,
    error,
  } = useShoppingReceipt(id ? parseInt(id) : 0);

  const handleSuccess = () => {
    // Redirect to purchases list after successful update
    navigate("/purchases");
  };

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando datos de la compra..." />
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error al cargar la compra</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/purchases")}
        >
          Volver a Compras
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-card p-6 rounded-lg shadow">
        <PurchaseForm
          purchase={purchase}
          onSuccess={handleSuccess}
          onCancel={() => navigate("/purchases")}
        />
      </div>
    </div>
  );
}
