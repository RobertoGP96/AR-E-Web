import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Save, X, Store } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
    tax_rate?: string;
}

export default function ShopFormPopover({
    shop = null,
    onSuccess,
    onCancel,
    trigger,
    mode: modeProp
}: ShopFormPopoverProps) {
    // Calcular mode de forma estable para evitar re-renders innecesarios
    const mode = modeProp ?? (shop ? 'edit' : 'create');
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        link: '',
        tax_rate: 0.0
    });
    const [errors, setErrors] = useState<FormErrors>({});
    
    // Usar useRef para rastrear el shop.id y evitar actualizaciones innecesarias
    const previousShopIdRef = useRef<number | null>(null);
    const previousOpenRef = useRef<boolean>(false);

    // Inicializar formulario cuando se abre o cambia el shop
    // Solo dependemos de shop?.id para evitar ciclos infinitos cuando shop se recrea
    useEffect(() => {
        const shopId = shop?.id ?? null;
        const isOpening = open && !previousOpenRef.current;
        const shopChanged = shopId !== previousShopIdRef.current;
        
        // Solo inicializar cuando se abre el popover o cuando cambia el shop.id
        // No dependemos de shop?.name, shop?.link, shop?.tax_rate para evitar
        // que se resetee el formulario mientras el usuario está editando
        if (open && (isOpening || shopChanged)) {
            setFormData({
                name: shop?.name || '',
                link: shop?.link || '',
                tax_rate: shop?.tax_rate || 0.0,
            });
            setErrors({});
            previousShopIdRef.current = shopId;
        }
        
        previousOpenRef.current = open;
    }, [open, shop?.id]);

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

        // Validar tasa de impuesto
        if (formData.tax_rate < 0) {
            newErrors.tax_rate = 'La tasa de impuesto no puede ser negativa';
        } else if (formData.tax_rate > 100) {
            newErrors.tax_rate = 'La tasa de impuesto no puede ser mayor a 100%';
        } else if (isNaN(formData.tax_rate)) {
            newErrors.tax_rate = 'La tasa de impuesto debe ser un número válido';
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
        // Usar función de actualización para evitar dependencias del estado errors
        setErrors(prev => {
            if (prev[field]) {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            }
            return prev;
        });
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
                const { updateShopService } = await import('@/services/shops');
                
                // Verificar si hay cambios antes de actualizar
                const updatedResult = await updateShopService.updateShopIfChanged(
                    shop.id,
                    submitData,
                    shop
                );

                if (updatedResult === null) {
                    // No hay cambios, no se actualiza
                    toast.info('Sin cambios', {
                        description: 'No se detectaron cambios en los datos de la tienda'
                    });
                    setOpen(false);
                    setIsLoading(false);
                    return;
                }

                result = updatedResult;
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

            // Invalidar la query de shops para refrescar la lista
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            
            onSuccess?.(result);
            setOpen(false);
            setFormData({ name: '', link: '', tax_rate: 0.0 });

        } catch (error) {
            console.error('Error saving shop:', error);
            
            let errorMessage = "Ha ocurrido un error inesperado";
            
            if (error instanceof Error) {
                errorMessage = error.message;
                
                // Mensajes más específicos para errores comunes
                if (error.message.includes('No hay datos para actualizar')) {
                    errorMessage = 'No se detectaron cambios para actualizar';
                } else if (error.message.includes('ya existe') || error.message.includes('already exists')) {
                    errorMessage = 'Ya existe una tienda con este nombre o enlace';
                } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
                    errorMessage = 'Los datos proporcionados no son válidos';
                } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                    errorMessage = 'La tienda no fue encontrada';
                } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                    errorMessage = 'No tienes permisos para realizar esta acción';
                } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                    errorMessage = 'Error del servidor. Por favor, intenta más tarde';
                }
            }
            
            toast.error(mode === 'edit' ? 'Error al actualizar tienda' : 'Error al crear tienda', {
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
                            onChange={(e) => handleInputChange('name', e.target.value.toLowerCase())}
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
                            step={0.01}
                            value={formData.tax_rate}
                            onChange={(e) => handleInputChange('tax_rate', e.target.value)}
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
