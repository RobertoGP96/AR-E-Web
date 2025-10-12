import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { createShopService } from '@/services/shops/create-shop.service';
import { toast } from 'sonner';
import type { Shop, CreateShopData } from '@/types/models/shop';

interface ShopFormPopoverProps {
    shop?: Shop | null;
    onSuccess?: (shop: Shop) => void;
    onCancel?: () => void;
    trigger?: React.ReactNode;
    mode?: 'create' | 'edit';
}

interface FormData {
    name: string;
    link: string;
    tax_rate: number;
}

interface FormErrors {
    name?: string;
    link?: string;
    tax_rate?: number;
}

export default function ShopFormPopover({
    shop = null,
    onSuccess,
    onCancel,
    trigger,
    mode = shop ? 'edit' : 'create'
}: ShopFormPopoverProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        link: '',
        tax_rate: 0.0
    });
    const [errors, setErrors] = useState<FormErrors>({});

    // Inicializar formulario cuando se abre o cambia el shop
    useEffect(() => {
        if (open) {
            setFormData({
                name: shop?.name || '',
                link: shop?.link || '',
                tax_rate: shop?.tax_rate || 0.0,
            });
            setErrors({});
        }
    }, [open, shop]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validar nombre
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'El nombre no puede exceder 100 caracteres';
        }

        // Validar enlace
        if (!formData.link.trim()) {
            newErrors.link = 'El enlace es requerido';
        } else {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlPattern.test(formData.link.trim())) {
                newErrors.link = 'Debe ser una URL válida (http:// o https://)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'tax_rate' ? (value === '' ? 0 : parseFloat(value) || 0) : value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const submitData: CreateShopData = {
                name: formData.name.trim(),
                link: formData.link.trim(),
                tax_rate: formData.tax_rate
            };

            let result: Shop;

                if (mode === 'edit' && shop) {
                // Actualizar tienda existente
                // El backend usa lookup_field = 'name', por lo que la URL espera el nombre de la tienda
                const { updateShopService } = await import('@/services/shops');
                // Usar el nombre original (shop.name) para buscar la instancia y enviar los datos actualizados
                result = await updateShopService.updateShop(shop.name, submitData);
                toast.success('Tienda actualizada', {
                    description: `"${result.name}" ha sido actualizada exitosamente`
                });
            } else {
                // Crear nueva tienda - el backend valida unicidad
                result = await createShopService.createShop(submitData);
                toast.success('Tienda creada', {
                    description: `"${result.name}" ha sido creada exitosamente`
                });
            }

            onSuccess?.(result);
            setOpen(false);
            setFormData({ name: '', link: '', tax_rate: 0.0 });

        } catch (error) {
            console.error('Error saving shop:', error);
            const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error inesperado";
            toast.error('Error al guardar tienda', {
                description: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ name: '', link: '', tax_rate: 0.0 });
        setErrors({});
        onCancel?.();
    };

    const defaultTrigger = (
        <Button
            variant={mode === 'edit' ? 'ghost' : 'default'}
            size={mode === 'edit' ? 'sm' : 'default'}
            className={mode === 'edit'
                ? "h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
                : "  shadow-lg hover:shadow-xl transition-all duration-200"
            }
        >
            {mode === 'edit' ? (
                <Edit className="h-4 w-4" />
            ) : (
                <>
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Tienda
                </>
            )}
        </Button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || defaultTrigger}
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 shadow-xl border-0 rounded-2xl overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            {mode === 'edit' ? (
                                <Edit className="w-5 h-5" />
                            ) : (
                                <Store className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">
                                {mode === 'edit' ? 'Editar Tienda' : 'Nueva Tienda'}
                            </h3>
                            <p className="text-sm">
                                {mode === 'edit'
                                    ? 'Modifica los datos de la tienda'
                                    : 'Completa la información de la nueva tienda'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nombre de la tienda *
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Ej: Amazon Store"
                            className={`transition-colors ${errors.name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link" className="text-sm font-medium text-gray-700">
                            Enlace de la tienda *
                        </Label>
                        <Input
                            id="link"
                            type="url"
                            value={formData.link}
                            onChange={(e) => handleInputChange('link', e.target.value)}
                            placeholder="https://ejemplo.com"
                            className={`transition-colors ${errors.link
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.link && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.link}
                            </p>
                        )}
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="tax" className="text-sm font-medium text-gray-700">
                            Tasa de impuesto (%) *
                        </Label>
                        <Input
                            id="tax"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={formData.tax_rate}
                            onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                            placeholder="0"
                            className={`transition-colors ${errors.tax_rate
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-200 focus:border-orange-400 focus:ring-orange-400'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.tax_rate && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.tax_rate}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            <span>
                                Cancelar
                            </span>
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 shadow-lg hover:shadow-xl transition-all duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {mode === 'edit' ? 'Actualizar' : 'Crear Tienda'}
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
