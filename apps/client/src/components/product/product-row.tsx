
import { ExternalLink, Store, Trash2, Package, FileText, CheckCircle, Tag } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import type { CreateProduc } from "@/types/product"

type ProductWithId = CreateProduc & { id: string }

interface ProductRowProps {
    product: ProductWithId
    onRemove: () => void
}

export const ProductRow = ({ product, onRemove }: ProductRowProps) => {
    return (
        <div className="border rounded-xl p-6 bg-gradient-to-br from-background to-muted/10 hover:from-muted/20 hover:to-muted/30 transition-all duration-300 shadow-sm hover:shadow-md border-muted-foreground/10">
            <div className="flex items-start justify-between gap-6">
                {/* Información principal del producto */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground/90">{product.name}</h3>
                    </div>
                    
                    {/* Shop */}
                    {product.shop && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30">
                                <Store className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-muted-foreground">
                                <span className="font-medium text-foreground/80">Tienda:</span> {product.shop}
                            </span>
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                        </div>
                    )}
                    
                    {/* Descripción */}
                    {product.description && (
                        <div className="flex items-start gap-3 text-sm">
                            <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30 mt-0.5">
                                <FileText className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                        </div>
                    )}
                    
                    {/* Etiquetas */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-900/30">
                                <Tag className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                    <Badge 
                                        key={index}
                                        variant="secondary" 
                                        className="text-xs bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 transition-all duration-200"
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Link del producto */}
                    {product.link && (
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200">
                                <ExternalLink className="h-3 w-3 mr-1.5 text-green-600 dark:text-green-400" />
                                <a 
                                    href={product.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:underline text-green-700 dark:text-green-300 font-medium"
                                >
                                    Ver producto
                                </a>
                            </Badge>
                        </div>
                    )}
                </div>
                
                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-all duration-200 h-9 w-9 p-0"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar producto</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}