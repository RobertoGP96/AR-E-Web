import { Plus, Save, Tag, X, Store, Link2, FileText, CheckCircle, AlertCircle, CircleAlert } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import type { CreateProductData } from '@/services/products/create-product'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/category/useCategory'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type tag = {
    icon: React.ComponentType,
    name: string,
    value: string
}

interface ProductFormProps {
    onSubmit: (product: CreateProductData) => void
    orderId?: number
    initialValues?: Partial<FormState>
}

// Función para extraer el nombre de la tienda del URL
const extractShopName = (url: string): string => {
    try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.toLowerCase()
        
        // Remover 'www.' si existe
        const cleanHostname = hostname.replace(/^www\./, '')
        
        // Mapeo de dominios conocidos a nombres de tienda
        const shopMappings: Record<string, string> = {
            'amazon.com': 'Amazon',
            'amazon.es': 'Amazon España',
            'amazon.co.uk': 'Amazon Reino Unido',
            'ebay.com': 'eBay',
            'ebay.es': 'eBay España',
            'aliexpress.com': 'AliExpress',
            'mercadolibre.com': 'MercadoLibre',
            'mercadolibre.com.mx': 'MercadoLibre México',
            'shopify.com': 'Shopify',
            'etsy.com': 'Etsy',
            'walmart.com': 'Walmart',
            'target.com': 'Target',
            'bestbuy.com': 'Best Buy',
            'zalando.com': 'Zalando',
            'zara.com': 'Zara',
            'hm.com': 'H&M',
            'nike.com': 'Nike',
            'adidas.com': 'Adidas'
        }
        
        // Buscar coincidencia exacta
        if (shopMappings[cleanHostname]) {
            return shopMappings[cleanHostname]
        }
        
        // Buscar coincidencias parciales para subdominios
        for (const [domain, shopName] of Object.entries(shopMappings)) {
            if (cleanHostname.includes(domain)) {
                return shopName
            }
        }
        
        // Si no encuentra coincidencia, capitalizar el dominio principal
        const domainParts = cleanHostname.split('.')
        const mainDomain = domainParts[0]
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
        
    } catch {
        return ''
    }
}

type FormState = {
    name: string
    link: string
    shop: string
    description: string
    amount_requested: number
    shop_cost: number
    total_cost: number
    category_id?: number | undefined
    tax?: number
}

const TAGS_SEPARATOR = "\n\n--TAGS--\n"

export const ProductForm = ({ onSubmit, orderId, initialValues }: ProductFormProps) => {
    // Parse tags embedded in description if present
    const parseDescriptionForTags = (desc?: string) => {
        if (!desc) return { descPlain: '', parsedTags: [] as tag[] }
        const idx = desc.indexOf(TAGS_SEPARATOR)
        if (idx === -1) return { descPlain: desc, parsedTags: [] as tag[] }
        const before = desc.substring(0, idx)
        const after = desc.substring(idx + TAGS_SEPARATOR.length)
        try {
            const parsed = JSON.parse(after)
            if (Array.isArray(parsed)) return { descPlain: before, parsedTags: parsed as tag[] }
        } catch {
            // ignore parse errors and treat whole desc as plain
        }
        return { descPlain: desc, parsedTags: [] as tag[] }
    }

    const initialParsed = parseDescriptionForTags(initialValues?.description)

    const [newProduct, setNewProduct] = useState<FormState>({
        name: initialValues?.name || '',
        link: initialValues?.link || '',
        shop: initialValues?.shop || '',
        description: initialParsed.descPlain || '',
        amount_requested: initialValues?.amount_requested ?? 1,
        shop_cost: initialValues?.shop_cost ?? 0,
        total_cost: initialValues?.total_cost ?? 0,
        category_id: initialValues?.category_id ?? undefined,
        tax: initialValues?.tax ?? 0,
    });
    const [tags, setTags] = useState<tag[]>(initialParsed.parsedTags || [])
    const [newtag, setNewTag] = useState<tag>({
        icon: Tag,
        name:"",
        value:""
    })
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)

    // Efecto para extraer automáticamente el nombre de la tienda cuando cambia el link
    useEffect(() => {
        if (newProduct.link.trim()) {
            const shopName = extractShopName(newProduct.link)
            if (shopName && shopName !== newProduct.shop) {
                setNewProduct(prev => ({ ...prev, shop: shopName }))
            }
        }
    }, [newProduct.link, newProduct.shop])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validación básica
        if (!newProduct.name.trim()) {
            alert('El nombre es un campo obligatorio')
            return
        }
        
        if (!newProduct.link.trim()) {
            alert('El link es un campo obligatorio')
            return
        }

        // Validar que el link sea una URL válida
        try {
            new URL(newProduct.link)
        } catch {
            alert('Por favor, introduce un link válido')
            return
        }

        if (!orderId) {
            alert('orderId es requerido para crear el producto')
            return
        }

        // Convertir tags a formato string array y enviar el producto
        // Merge tags into description using a separator and JSON so they can be parsed when editing
        let finalDescription = newProduct.description || ''
        if (tags.length > 0) {
            try {
                finalDescription = `${finalDescription}${TAGS_SEPARATOR}${JSON.stringify(tags)}`
            } catch {
                // fallback: ignore tags serialization on error
            }
        }

        const qty = Number(newProduct.amount_requested) || 1
        const unit = Number(newProduct.shop_cost) || 0
        const taxPct = Number(newProduct.tax) || 0
        const computedTotal = qty * unit * (1 + taxPct / 100)

        const productToSubmit: CreateProductData = {
            shop_name: newProduct.shop || extractShopName(newProduct.link) || 'Unknown',
            order_id: orderId,
            description: finalDescription,
            amount_requested: qty,
            shop_cost: unit,
            total_cost: Number(computedTotal) || 0,
            category: newProduct.category_id ? (categories.find(c => c.id === newProduct.category_id)?.name ?? null) : null,
            shop_taxes: taxPct,
            product_pictures: []
        }

        onSubmit(productToSubmit)
        
        // Limpiar el formulario
        handleCancel()
    }

    // Obtener categorías para el select
    const { data: categoriesData } = useCategories();
    const categories = categoriesData?.results || [];

    const handleCancel = () => {
        setNewProduct({
            name: '',
            link: '',
            shop: '',
            description: '',
            amount_requested: 1,
            shop_cost: 0,
            total_cost: 0
        })
        // Restore to initial parsed tags if editing, otherwise clear
        setTags(initialParsed.parsedTags || [])
        setNewTag({
            icon: Tag,
            name: "",
            value: ""
        })
    }

    const handleAddTag = () => {
        if (newtag.name.trim() && newtag.value.trim()) {
            setTags(prevTags => [...prevTags, newtag])
            setNewTag({
                icon: Tag,
                name: "",
                value: ""
            })
            setIsPopoverOpen(false)
        }
    }

    const handleRemoveTag = (indexToRemove: number) => {
        setTags(prevTags => prevTags.filter((_, index) => index !== indexToRemove))
    }

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-none border-0 bg-transparent">
           
            <CardContent className="border-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre del producto */}
                    <div className="space-y-3">
                        <label htmlFor="name" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <div className="p-1 rounded ">
                                <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            Nombre del producto *
                        </label>
                        <Input 
                            id="name" 
                            placeholder="Introduce el nombre del producto" 
                            value={newProduct.name} 
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary border-muted-foreground/20 hover:border-muted-foreground/40"
                        />
                    </div>

                    {/* Link del producto */}
                    <div className="space-y-3">
                        <label htmlFor="link" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <div className="p-1 rounded ">
                                <Link2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            Link del producto *
                        </label>
                        <Input 
                            id="link" 
                            type="url"
                            placeholder="https://ejemplo.com/producto" 
                            value={newProduct.link} 
                            onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary border-muted-foreground/20 hover:border-muted-foreground/40"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CircleAlert className="h-3 w-3 text-gray-500" />
                            La tienda se detectará automáticamente del link
                        </p>
                    </div>

                    {/* Tienda (auto-detectada) */}
                    <div className="space-y-3">
                        <label htmlFor="shop" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <div className="p-1 rounded ">
                                <Store className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            Tienda
                        </label>
                        <div className="relative">
                            <Input 
                                id="shop" 
                                placeholder="Esperando detección automática..." 
                                value={newProduct.shop} 
                                readOnly
                                className="bg-muted/30 border-muted-foreground/20 text-muted-foreground cursor-not-allowed pr-10"
                            />
                            {newProduct.shop ? (
                                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                            ) : newProduct.link ? (
                                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                            ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {newProduct.shop ? (
                                <>
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                    Tienda detectada automáticamente
                                </>
                            ) : newProduct.link ? (
                                <>
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    No se pudo detectar la tienda automáticamente
                                </>
                            ) : (
                                "Introduce un link para detectar la tienda"
                            )}
                        </p>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-3">
                        <label htmlFor="category" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <div className="p-1 rounded ">
                                <Tag className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                            </div>
                            Categoría
                        </label>
                        <Select
                            value={newProduct.category_id ? String(newProduct.category_id) : '0'}
                            onValueChange={(val) => setNewProduct(prev => ({ ...prev, category_id: val !== '0' ? Number(val) : undefined }))}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Selecciona una categoría (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Sin categoría</SelectItem>
                                {categories.map((c: { id: number; name: string }) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cantidad, Costo y impuesto */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-3">
                            <label htmlFor="amount_requested" className="text-sm font-semibold text-foreground/90">Cantidad encargada</label>
                            <Input id="amount_requested" type="number" min={1} step="1" value={newProduct.amount_requested} onChange={(e) => setNewProduct({ ...newProduct, amount_requested: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="shop_cost" className="text-sm font-semibold text-foreground/90">Precio (unidad)</label>
                            <Input id="shop_cost" type="number" step="0.01" value={newProduct.shop_cost} onChange={(e) => setNewProduct({ ...newProduct, shop_cost: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="tax" className="text-sm font-semibold text-foreground/90">Impuesto (%)</label>
                            <Input id="tax" type="number" step="0.01" value={newProduct.tax} onChange={(e) => setNewProduct({ ...newProduct, tax: Number(e.target.value) })} />
                        </div>
                    </div>

                    {/* Sistema de Tags */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                                <div className="p-1 rounded ">
                                    <Tag className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                                </div>
                                Etiquetas
                            </label>
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10 text-primary hover:text-primary transition-all duration-200">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Añadir etiqueta
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 bg-muted border-muted-foreground/20 shadow-xl" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold leading-none text-foreground/90 flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                            Nueva Etiqueta
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                                                <Input 
                                                    value={newtag.name} 
                                                    onChange={(e) => setNewTag({...newtag, name: e.target.value})} 
                                                    placeholder="Ej: Color, Talla, Marca"
                                                    className="h-8 mt-1 border-muted-foreground/20 focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Valor</label>
                                                <Input 
                                                    value={newtag.value} 
                                                    onChange={(e) => setNewTag({...newtag, value: e.target.value})} 
                                                    placeholder="Ej: Rojo, XL, Nike"
                                                    className="h-8 mt-1 border-muted-foreground/20 focus:border-primary"
                                                />
                                            </div>
                                            <Button 
                                                onClick={handleAddTag} 
                                                size="sm" 
                                                className="w-full h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200"
                                                disabled={!newtag.name.trim() || !newtag.value.trim()}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Añadir
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Lista de tags */}
                        <div className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-muted-foreground/10">
                            {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((item, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center rounded-full gap-2 px-3 py-2 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/80 hover:to-secondary border border-muted-foreground/20 transition-all duration-200">
                                            <span className="text-xs font-medium">{item.name}: {item.value}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                                                onClick={() => handleRemoveTag(index)}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-2 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Tag className="h-6 w-6 text-muted-foreground/50" />
                                        <p className="text-sm font-medium">No hay etiquetas añadidas</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />

                    {/* Resumen de total calculado */}
                    {(() => {
                        const qty = Number(newProduct.amount_requested) || 0
                        const unit = Number(newProduct.shop_cost) || 0
                        const taxPct = Number(newProduct.tax) || 0
                        const totalCalc = qty * unit * (1 + taxPct / 100)
                        return (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Valor total (incl. impuesto)</div>
                                <div className="text-lg font-semibold">${totalCalc.toFixed(2)}</div>
                            </div>
                        )
                    })()}

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-4 pt-2">
                        
                        <Button 
                            type="submit"
                            className="min-w-[140px] h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newProduct.name.trim() || !newProduct.link.trim()}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Añadir producto
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
