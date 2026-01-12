import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useShoppingReceipt } from '@/hooks/shopping-receipts/useShoppingReceipt';
import { EditPurchaseForm } from '@/components/purshases/EditPurchaseForm';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

export default function EditPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shoppingReceipt: purchase, isLoading, error } = useShoppingReceipt(id ? parseInt(id) : 0);

  const handleSuccess = () => {
    // Redirect to purchases list after successful update
    navigate('/purchases');
  };

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
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
          onClick={() => navigate('/purchases')}
        >
          Volver a Compras
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
          onClick={() => navigate('/purchases')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Compras
        </Button>
        <h1 className="text-2xl font-bold">Editar Compra</h1>
        <p className="text-sm text-muted-foreground">
          Actualiza los detalles de la compra
        </p>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow">
        <EditPurchaseForm 
          receiptId={parseInt(id)} 
          onSuccess={handleSuccess} 
          onCancel={() => navigate('/purchases')} 
        />
      </div>
    </div>
  );
}
