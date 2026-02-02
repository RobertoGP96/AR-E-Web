"use client";

import { useNavigate, useParams } from "react-router-dom";
import { PackageForm } from "@/components/packages/package-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { usePackage } from "@/hooks/package/usePackage";

export default function EditPackagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { package: packageData, isLoading, error } = usePackage(Number(id));

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-orange-500 animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold animate-pulse">
          Cargando información del paquete...
        </p>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-900">
            Paquete no encontrado
          </h3>
          <p className="text-slate-500 mt-2">
            No pudimos localizar el paquete con ID:{" "}
            <span className="font-mono font-bold text-red-400">#{id}</span>
          </p>
        </div>
        <Button
          onClick={() => navigate("/packages")}
          className="rounded-2xl h-12 px-8 bg-slate-900 hover:bg-black font-bold"
        >
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/packages")}
          className="group rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a Paquetes
        </Button>
      </div>

      <PackageForm
        packageData={packageData}
        onSuccess={() => navigate(`/packages/${id}`)}
        onCancel={() => navigate(`/packages/${id}`)}
      />
    </div>
  );
}
