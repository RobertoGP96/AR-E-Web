import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <ShieldX className="h-16 w-16 text-orange-400" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Acceso denegado</h1>
        <p className="text-muted-foreground max-w-sm">
          No tienes permisos para ver esta página. Contacta al administrador si
          crees que esto es un error.
        </p>
      </div>
      <Button onClick={() => navigate("/")} variant="default">
        Volver al inicio
      </Button>
    </div>
  );
}