import { useState, useEffect } from "react"
import { ProductForm } from "./product-form"
import { ProductRow } from "./product-row"
import type { CreateProduc } from "@/types/product"
import { useProductStorage } from "@/hooks/use-local-storage"
import { Card, CardContent } from "../ui/card"
import { Package, ShoppingBag, Plus, Search, Grid, List, SortAsc } from "lucide-react"
import { Separator } from "../ui/separator"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription 
} from "../ui/dialog"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger
} from "../ui/dropdown-menu"

export const ProductList = () => {
    const [products, setProducts] = useProductStorage()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [sortBy, setSortBy] = useState<"name" | "shop" | "recent">("recent")
    const [isLocalStorageAvailable, setIsLocalStorageAvailable] = useState(true)
    
    // Verificar disponibilidad de localStorage
    useEffect(() => {
        try {
            const testKey = '__localStorage_test__'
            localStorage.setItem(testKey, 'test')
            localStorage.removeItem(testKey)
            setIsLocalStorageAvailable(true)
        } catch {
            setIsLocalStorageAvailable(false)
        }
    }, [])
    
    const handleAddProduct = (productData: CreateProduc) => {
        const newProduct = {
            ...productData,
            id: Date.now().toString()
        }
        setProducts(prevProducts => [...prevProducts, newProduct])
        setIsFormOpen(false) // Cerrar el modal después de añadir
    }

    const handleRemoveProduct = (productId: string) => {
        setProducts(prevProducts => prevProducts.filter(product => product.id !== productId))
    }

    // Filtrar y ordenar productos
    const filteredProducts = products
        .filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.shop.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name)
                case "shop":
                    return a.shop.localeCompare(b.shop)
                case "recent":
                default:
                    return parseInt(b.id) - parseInt(a.id)
            }
        })

    // Obtener tiendas únicas para estadísticas
    const uniqueShops = [...new Set(products.map(p => p.shop).filter(Boolean))]

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Advertencia de localStorage no disponible */}
            {!isLocalStorageAvailable && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="h-4 w-4 rounded-full bg-amber-500 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Almacenamiento local no disponible
                            </p>
                            <p className="text-amber-700 dark:text-amber-300">
                                Los productos no se guardarán entre sesiones. Verifica la configuración de tu navegador.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Header con estadísticas y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Mis Productos
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Gestiona tu lista de productos favoritos
                            </p>
                        </div>
                    </div>
                    
                    {/* Estadísticas rápidas */}
                    {products.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                {products.length} producto{products.length !== 1 ? 's' : ''}
                            </Badge>
                            {uniqueShops.length > 0 && (
                                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                    {uniqueShops.length} tienda{uniqueShops.length !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Botón para añadir producto */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button className="self-start lg:self-center bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden  flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Añadir Nuevo Producto
                            </DialogTitle>
                            <DialogDescription>
                                Completa la información del producto que quieres añadir a tu lista
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto">
                            <ProductForm onSubmit={handleAddProduct} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Controles de búsqueda y filtros - Solo mostrar si hay productos */}
            {products.length > 0 && (
                <Card className="border-muted-foreground/10 py-2">
                    <CardContent className="px-2">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {/* Búsqueda */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar productos por nombre, tienda o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            {/* Controles de vista y ordenación */}
                            <div className="flex items-center gap-2">
                                {/* Ordenación */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <SortAsc className="h-4 w-4" />
                                            Ordenar
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setSortBy("recent")}>
                                            Más recientes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy("name")}>
                                            Por nombre
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy("shop")}>
                                            Por tienda
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Toggle de vista */}
                                <div className="flex  rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant={viewMode === "list" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("list")}
                                        className="h-8 w-8 p-0"
                                    >
                                        <List className="h-4 w-4" />
                                        <span className="sr-only">Vista lista</span>
                                    </Button>
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Grid className="h-4 w-4" />
                                        <span className="sr-only">Vista cuadrícula</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mostrar resultados de búsqueda */}
                        {searchTerm && (
                            <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                                <p className="text-sm text-muted-foreground">
                                    {filteredProducts.length === 0 
                                        ? "No se encontraron productos"
                                        : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
                                    } para "{searchTerm}"
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Lista de productos */}
            <div className="space-y-6">
                {products.length === 0 ? (
                    /* Estado vacío mejorado */
                    <Card className="border-dashed border-2 border-muted-foreground/20">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-6">
                                <Package className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground/80 mb-2">
                                ¡Empieza tu lista de productos!
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Añade productos de tus tiendas favoritas para tenerlos organizados en un solo lugar
                            </p>
                            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Añadir tu primer producto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-primary" />
                                            Añadir Nuevo Producto
                                        </DialogTitle>
                                        <DialogDescription>
                                            Completa la información del producto que quieres añadir a tu lista
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-y-auto">
                                        <ProductForm onSubmit={handleAddProduct} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                ) : filteredProducts.length === 0 ? (
                    /* Estado de búsqueda sin resultados */
                    <Card className="border-muted-foreground/10">
                        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                                No se encontraron productos
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Intenta con otros términos de búsqueda
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setSearchTerm("")}
                                className="text-sm"
                            >
                                Limpiar búsqueda
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Lista/Grid de productos */
                    <div className={
                        viewMode === "grid" 
                            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                            : "space-y-4"
                    }>
                        {filteredProducts.map((product, index) => (
                            <div key={product.id} className={viewMode === "list" ? "" : "h-fit"}>
                                <ProductRow 
                                    product={product} 
                                    onRemove={() => handleRemoveProduct(product.id)}
                                />
                                {viewMode === "list" && index < filteredProducts.length - 1 && (
                                    <Separator className="my-4 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}