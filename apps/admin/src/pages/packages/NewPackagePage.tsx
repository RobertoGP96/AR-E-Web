"use client";

import { useNavigate } from "react-router-dom";
import { PackageForm } from "@/components/packages/package-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePackages } from "@/hooks/package";

export default function NewPackagePage() {
  const navigate = useNavigate();
  const { invalidatePackages } = usePackages();

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex items-center justify-between">
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
        onInvalidate={invalidatePackages}
        onSuccess={() => navigate("/packages")}
        onCancel={() => navigate("/packages")}
      />
    </div>
  );
}
