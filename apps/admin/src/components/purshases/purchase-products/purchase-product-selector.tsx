"use client"

import { useState } from "react"
import { Plus, Minus, ShoppingCart, Trash2, Package, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Product } from "@/types/models/product"
import type { ProductBuyed } from "@/types/models/product-buyed"

interface ProductSelectorProps {
    products: Product[]
    onCartChange?: (cart: ProductBuyed[]) => void
}

export function ProductSelector({ products, onCartChange }: ProductSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [cart, setCart] = useState<ProductBuyed[]>([])

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const updateCart = (newCart: ProductBuyed[]) => {
        setCart(newCart)
        onCartChange?.(newCart)
    }

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.product_id === product.id)

        if (existingItem) {
            const newCart = cart.map((item) =>
                item.product_id === product.id
                    ? {
                        ...item,
                        amount_buyed: item.amount_buyed + 1,
                        subtotal: (item.amount_buyed + 1) * product.total_cost,
                    }
                    : item,
            )
            updateCart(newCart)
        } else {
            updateCart([
                ...cart,
                {
                    product_id: product.id,
                    original_product_details: product,
                    amount_buyed: 1,
                },
            ])
        }
    }

    const removeFromCart = (productId: string) => {
        updateCart(cart.filter((item) => item.product_id !== productId))
    }

    const updateQuantity = (productId:string, delta: number) => {
        const newCart = cart
            .map((item) => {
                if (item.product_id === productId) {
                    const newQuantity = item.amount_buyed + delta
                    if (newQuantity <= 0) return null
                    return {
                        ...item,
                        amount_buyed: newQuantity,
                        subtotal: newQuantity,
                    }
                }
                return item
            })
            .filter(Boolean) as ProductBuyed[]

        updateCart(newCart)
    }

    const getCartQuantity = (productId: string) => {
        return cart.find((item) => item.product_id === productId)?.amount_buyed || 0
    }


    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Lista de productos disponibles */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Productos Disponibles
                    </CardTitle>
                    <CardDescription>Selecciona productos para agregar a la compra</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 translate-y-[-25%] text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, SKU o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No se encontraron productos</p>
                            ) : (
                                filteredProducts.map((product) => {
                                    const cartQty = getCartQuantity(product.id)
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{product.sku}</span>
                                                    {product.category && (
                                                        <>
                                                            <span>•</span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {product.category}
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-primary">${product.total_cost.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {cartQty > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 bg-transparent"
                                                            onClick={() => updateQuantity(product.id, -1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-medium">{cartQty}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 bg-transparent"
                                                            onClick={() => updateQuantity(product.id, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => addToCart(product)}>
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Agregar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Carrito de compras */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Productos Seleccionados
                        {cart.length > 0 && (
                            <Badge variant="default" className="ml-2">
                                {cart.length}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Lista de productos para tu compra</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[320px] pr-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                                <p>No hay productos seleccionados</p>
                                <p className="text-sm">Agrega productos desde la lista</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.product_id} className="flex items-center gap-3 rounded-lg border p-3">
                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">{item.original_product_details.shop_cost}</p>
                                            <p className="text-xs text-muted-foreground">
                                                ${item.original_product_details.total_cost.toFixed(2)} x {item.amount_buyed}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.product_id as string, -1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-6 text-center font-medium text-sm">{item.amount_buyed}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.product_id as string, 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => removeFromCart(item.product_id as string)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
