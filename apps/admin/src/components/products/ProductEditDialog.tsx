import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductForm } from "./ProductForm"
import type { Product, UpdateProductData, CreateProductData } from "@/types/models"
import { useUpdateProduct } from "@/hooks/product/useUpdateProduct"
import { toast } from "sonner"

interface ProductEditDialogProps {
    product: Product | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const ProductEditDialog = ({ product, open, onOpenChange }: ProductEditDialogProps) => {
    const updateMutation = useUpdateProduct()

    if (!product) return null

    const handleSubmit = async (data: CreateProductData) => {
        try {
            const updateData: UpdateProductData = {
                id: product.id,
                ...data,
            }

            await updateMutation.mutateAsync(updateData)
            toast.success("Producto actualizado correctamente")
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating product:", error)
            toast.error("Error al actualizar el producto")
        }
    }

    // Convertir Product a valores iniciales para el form
    const initialValues: Partial<CreateProductData> = {
        name: product.name,
        link: product.link,
        shop: product.shop,
        description: product.description,
        amount_requested: product.amount_requested,
        shop_cost: product.shop_cost,
        total_cost: product.total_cost,
        category: product.category,
        added_taxes: product.added_taxes,
        shop_taxes: product.shop_taxes,
        charge_iva: product.charge_iva,
        own_taxes: product.own_taxes,
        shop_delivery_cost: product.shop_delivery_cost,
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Editar Producto
                    </DialogTitle>
                </DialogHeader>
                <ProductForm
                    onSubmit={handleSubmit}
                    orderId={typeof product.order === 'number' ? product.order : product.order?.id}
                    initialValues={initialValues}
                    isEditing={true}
                />
            </DialogContent>
        </Dialog>
    )
}
