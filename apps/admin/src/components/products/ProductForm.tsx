import { Plus, Save, Tag, X, Store, Link2, FileText, CheckCircle, AlertCircle, CircleAlert, Receipt } from "lucide-react"
import { serializeTagsToDescription, type StoredTag } from '@/lib/tags'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useShops } from '@/hooks/shop/useShops'
import { useCategories } from '@/hooks/category/useCategory'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CreateProductData } from "@/types/models"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"

type tag = {
    icon: React.ComponentType,
    name: string,
    value: string
}

interface ProductFormProps {
    onSubmit: (product: CreateProductData) => void
    orderId?: number
    initialValues?: Partial<CreateProductData>
    isEditing?: boolean
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
            'ebay.com': 'eBay',
            'ebay.es': 'eBay España',
            'aliexpress.com': 'AliExpress',
            'shopify.com': 'Shopify',
            'etsy.com': 'Etsy',
            'walmart.com': 'Walmart',
            'target.com': 'Target',
            'bestbuy.com': 'Best Buy',
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

        console.log("Extract-Link")
        // Si no encuentra coincidencia, capitalizar el dominio principal
        const domainParts = cleanHostname.split('.')
        const mainDomain = domainParts[0]
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)

    } catch {
        return ''
    }
}


// Función para obtener la tarifa de la tienda según el nombre
const getShopTaxRate = (shopName: string): number => {
    const normalizedName = shopName.toLowerCase()

    if (normalizedName.includes('shein')) return 0
    if (normalizedName.includes('amazon') || normalizedName.includes('temu')) return 3
    if (normalizedName.includes('aliexpress')) return 5

    // Para otras tiendas
    return 5
}

// Función para calcular el total según las reglas de la empresa
const calculateTotalCost = (
    unitPrice: number,
    shippingCost: number,
    shopName: string,
    shopTaxRate: number | undefined,
    addedTaxes: number = 0,
    ownTaxes: number = 0,
    chargeIva: boolean = true
): {
    subtotal: number;
    costoEnvio: number;
    baseImpuesto: number;
    baseParaTarifa: number;
    tarifaTienda: number;
    impuestosAdicionales: number;
    impuestosPropios: number;
    total: number
} => {
    // Precio del producto (sin multiplicar por cantidad)
    const subtotal = unitPrice

    // Costo de envío
    const costoEnvio = shippingCost

    // Base = precio + envío
    const base = subtotal + costoEnvio

    // Impuesto base: 7% sobre (precio + envío) solo si chargeIva es true
    const baseImpuesto = chargeIva ? base * 0.07 : 0

    // Base con impuesto = (precio + envío) + (precio + envío) * 0.07 (si aplica)
    const baseParaTarifa = base + baseImpuesto

    // Tarifa por tienda (usar el valor proporcionado o auto-detectar)
    const effectiveShopTaxRate = shopTaxRate ?? getShopTaxRate(shopName)
    const tarifaTienda = baseParaTarifa * (effectiveShopTaxRate / 100)

    // Impuestos adicionales (valor fijo nominal)
    const impuestosAdicionales = addedTaxes

    // Impuestos propios (valor fijo)
    const impuestosPropios = ownTaxes

    // Total = (precio + envío) + (precio + envío) * 0.07 (si aplica) + ((precio + envío) + (precio + envío) * 0.07) * imp_tienda + imp_add + imp_propio
    // Simplificado: Total = base + baseImpuesto + tarifaTienda + impuestosAdicionales + impuestosPropios
    const total = base + baseImpuesto + tarifaTienda + impuestosAdicionales + impuestosPropios

    return {
        subtotal,
        costoEnvio,
        baseImpuesto,
        baseParaTarifa,
        tarifaTienda,
        impuestosAdicionales,
        impuestosPropios,
        total
    }
}

const TAGS_SEPARATOR = "\n\n--TAGS--\n"

// Función para formatear números con separador de miles
const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

export const ProductForm = ({ onSubmit, orderId, initialValues, isEditing = false }: ProductFormProps) => {
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

    const [newProduct, setNewProduct] = useState<CreateProductData>({
        name: initialValues?.name || '',
        link: initialValues?.link || '',
        shop: initialValues?.shop || '',
        description: initialParsed.descPlain || '',
        amount_requested: initialValues?.amount_requested ?? 1,
        shop_cost: initialValues?.shop_cost ?? undefined,
        total_cost: initialValues?.total_cost ?? 0,
        category: initialValues?.category ?? undefined,
        added_taxes: initialValues?.added_taxes ?? 0,
        shop_taxes: initialValues?.shop_taxes ?? 0,
        base_tax: initialValues?.base_tax ?? 0,
        shop_tax_amount: initialValues?.shop_tax_amount ?? 0,
        own_taxes: initialValues?.own_taxes ?? 0,
        shop_delivery_cost: initialValues?.shop_delivery_cost ?? 0,
        charge_iva: initialValues?.charge_iva ?? true,
        order: orderId || 0, // Agregar order obligatorio
    });
    const [tags, setTags] = useState<tag[]>(initialParsed.parsedTags || [])
    const [newtag, setNewTag] = useState<tag>({
        icon: Tag,
        name: "",
        value: ""
    })
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isInvoicePopoverOpen, setIsInvoicePopoverOpen] = useState(false)

    // Obtener configuración del sistema (tasa de cambio)
    const { config: systemConfig } = useSystemConfig()
    const exchangeRate = systemConfig?.change_rate || 1

    // Efecto para extraer automáticamente el nombre de la tienda cuando cambia el link
    useEffect(() => {
        if (newProduct.link?.trim()) {
            const shopName = extractShopName(newProduct.link)
            if (shopName && shopName !== newProduct.shop) {
                setNewProduct(prev => ({ ...prev, shop: shopName }))
            }
        }
    }, [newProduct.link, newProduct.shop])

    // Estado para controlar si se muestra el selector manual de tienda
    const [showManualShopSelect, setShowManualShopSelect] = useState(false)

    // Cuando se detecta un shop por link, intentar normalizar con las shops de la BD
    const { shops: availableShops, error: shopsError } = useShops()
    useEffect(() => {
        if (!newProduct.shop || !availableShops || availableShops.length === 0) return

        // Buscar coincidencia por nombre (case-insensitive) o por link que incluya el hostname
        const detected = newProduct.shop.toLowerCase()

        // Primero buscar por nombre exacto/insensible a mayúsculas
        let matched = availableShops.find(s => s.name && s.name.toLowerCase() === detected)

        // Si no hay match por nombre, intentar buscar por hostname dentro del link de la shop
        if (!matched && newProduct.link) {
            try {
                const urlObj = new URL(newProduct.link)
                const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase()
                matched = availableShops.find(s => s.link && s.link.toLowerCase().includes(hostname))
            } catch {
                // ignore
            }
        }

        // Si encontramos una tienda en la BD, normalizar el campo shop con su name
        if (matched) {
            setIsShopInDatabase(true);
            const updates: Partial<CreateProductData> = {}

            if (matched.name && matched.name !== newProduct.shop) {
                updates.shop = matched.name
            }
            // Si no hay shop_taxes definido manualmente, usar el de la BD
            if (newProduct.shop_taxes === undefined || newProduct.shop_taxes === 0) {
                updates.shop_taxes = matched.tax_rate
            }

            if (Object.keys(updates).length > 0) {
                setNewProduct(prev => ({ ...prev, ...updates }))
            }
            // almacenar id en un campo temporal del estado (no persistir en backend form state)
            setMatchedShopId(matched.id)
        } else if (newProduct.shop) {
            setIsShopInDatabase(false);
            // Si la tienda no está en BD y no hay shop_taxes definido, usar auto-detectado
            if (newProduct.shop_taxes === undefined || newProduct.shop_taxes === 0) {
                const autoRate = getShopTaxRate(newProduct.shop)
                setNewProduct(prev => ({ ...prev, shop_taxes: autoRate }))
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newProduct.shop, newProduct.link, availableShops])

    // Id de la tienda detectada en la BD (si existe)
    const [matchedShopId, setMatchedShopId] = useState<number | undefined>(undefined)
    const [isShopInDatabase, setIsShopInDatabase] = useState<boolean | undefined>(undefined)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validación básica
        if (!newProduct.name.trim()) {
            alert('El nombre es un campo obligatorio')
            return
        }

        // Validar que haya una tienda seleccionada
        if (!newProduct.shop?.trim()) {
            alert('Debes seleccionar o detectar una tienda')
            return
        }

        // Validar el link solo si se proporciona
        if (newProduct.link?.trim()) {
            try {
                new URL(newProduct.link)
            } catch {
                alert('Por favor, introduce un link válido')
                return
            }

            // Validar longitud máxima del link
            if (newProduct.link.length > 200) {
                alert('El link no puede tener más de 200 caracteres')
                return
            }
        }

        // En modo edición, orderId es opcional
        if (!isEditing && !orderId) {
            alert('orderId es requerido para crear el producto')
            return
        }

        // Convertir tags a formato string array y enviar el producto
        // Usar util de serialización centralizada
        // import dinámico local para evitar cambios globales en top-level imports si no se desea
        let finalDescription = newProduct.description || ''
        try {
            // Mapear tags locales al tipo StoredTag
            const normalizedTags: StoredTag[] = tags.map(t => ({ name: t.name, value: t.value }))
            finalDescription = serializeTagsToDescription(finalDescription, normalizedTags)
        } catch {
            // fallback a la lógica previa en caso de error
            if (tags.length > 0) {
                try {
                    finalDescription = `${finalDescription}${TAGS_SEPARATOR}${JSON.stringify(tags)}`
                } catch {
                    // ignore
                }
            }
        }

        const qty = Number(newProduct.amount_requested) || 1
        const unit = Number(newProduct.shop_cost) || 0
        const shippingCost = Number(newProduct.shop_delivery_cost) || 0
        // Preferir enviar el ID de la tienda (pk) cuando esté disponible.
        let shopPayload: number | string | undefined
        if (matchedShopId) {
            shopPayload = matchedShopId
        } else if (newProduct.shop) {
            // Intentar mapear por nombre a la tienda en BD
            const found = availableShops.find(s => s.name && s.name.toLowerCase() === (newProduct.shop || '').toLowerCase())
            if (found) shopPayload = found.id
            else {
                // Si no coincide por nombre, intentar extraer del link
                if (newProduct.link) {
                    const fromLink = extractShopName(newProduct.link)
                    const found2 = availableShops.find(s => s.name && s.name.toLowerCase() === fromLink.toLowerCase())
                    if (found2) shopPayload = found2.id
                }
                    // Si aún no existe, dejamos undefined y validamos más abajo
            }
        }
        const shopTaxRate = newProduct.shop_taxes
        const addedTaxes = Number(newProduct.added_taxes) || 0
        const ownTaxes = Number(newProduct.own_taxes) || 0
        const chargeIva = newProduct.charge_iva ?? true

        // Calcular el total usando la función correcta
        // Decidir nombre de tienda para mostrar en el cálculo
        let shopDisplayName = ''
        if (typeof shopPayload === 'number') {
            shopDisplayName = availableShops.find(s => s.id === shopPayload)?.name || ''
        } else {
            shopDisplayName = (newProduct.shop || (newProduct.link ? extractShopName(newProduct.link) : '')) || 'Unknown'
        }

        const calculation = calculateTotalCost(unit, shippingCost, shopDisplayName, shopTaxRate, addedTaxes, ownTaxes, chargeIva)
        const computedTotal = calculation.total

        // category: backend espera PK; soportamos que el form guarde nombre -> mapear a id
        const matchedCategory = categories.find(c => c.name && c.name.toLowerCase() === (newProduct.category || '').toLowerCase())
        const categoryPayload = matchedCategory ? matchedCategory.id : (Number(newProduct.category) ? Number(newProduct.category) : undefined)

        // Validación final: la API espera un PK para la tienda (shop). Si no está
        // registrado (no conseguimos shopPayload), forzar al usuario a seleccionar
        // la tienda manualmente o registrarla en el panel de tiendas.
        if (typeof shopPayload === 'undefined' || shopPayload === null) {
            alert('Debes seleccionar una tienda registrada o usar el selector manual.');
            return
        }

        const productToSubmit = {
            // Asegurar que se envía el nombre del producto
            name: newProduct.name,
            // Enviar shop como nombre (lo que espera la API según el serializer que usa slug_field="name")
            // Enviar shop por id (PK) si está disponible. El backend espera un PK numérico.
            shop: shopPayload ?? undefined,
            order: orderId,
            description: finalDescription,
            amount_requested: qty,
            link: newProduct.link,
            shop_cost: unit,
            total_cost: computedTotal,
            // category: enviar el nombre de la categoría (la API espera nombre)
            // category: enviar id si existe, si no envíe undefined (no se incluye)
            category: typeof categoryPayload !== 'undefined' ? categoryPayload : undefined,
            // Guardar los valores en campos apropiados
            shop_delivery_cost: shippingCost, // Costo de envío
            shop_taxes: shopTaxRate ?? getShopTaxRate(shopDisplayName), // Porcentaje de impuesto de tienda
            charge_iva: chargeIva, // Si se cobra IVA o no
            base_tax: calculation.baseImpuesto, // IVA 7% calculado
            shop_tax_amount: calculation.tarifaTienda, // Impuesto adicional calculado (3% o 5%)
            added_taxes: addedTaxes, // Impuestos adicionales nominales
            own_taxes: ownTaxes, // Impuestos propios nominales
            // Product images: enviar como array (el servicio create-product convertirá a string JSON)
            product_pictures: []
        } as unknown as CreateProductData

        onSubmit(productToSubmit)

        // Limpiar el formulario solo si no estamos editando
        if (!isEditing) {
            handleCancel()
        }
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
            total_cost: 0,
            category: undefined,
            added_taxes: 0,
            shop_taxes: 0,
            base_tax: 0,
            shop_tax_amount: 0,
            own_taxes: 0,
            shop_delivery_cost: 0,
            charge_iva: true,
            order: orderId || 0,
        })
        // Restore to initial parsed tags if editing, otherwise clear
        setTags(initialParsed.parsedTags || [])
        setNewTag({
            icon: Tag,
            name: "",
            value: ""
        })
        setIsShopInDatabase(undefined)
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
        <Card className="w-full max-w-2xl mx-auto shadow-none border-0 bg-transparent ">

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
                            Link del producto
                            <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                        </label>
                        <Input
                            id="link"
                            type="url"
                            placeholder="https://ejemplo.com/producto"
                            value={newProduct.link}
                            onChange={(e) => {
                                setNewProduct({ ...newProduct, link: e.target.value })
                                // Si se ingresa un link, desactivar selector manual
                                if (e.target.value.trim()) {
                                    setShowManualShopSelect(false)
                                }
                            }}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary border-muted-foreground/20 hover:border-muted-foreground/40"
                            maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CircleAlert className="h-3 w-3 text-gray-500" />
                            Si proporcionas un link, la tienda se detectará automáticamente
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Máximo 200 caracteres ({newProduct.link?.length || 0}/200)
                        </p>
                    </div>

                    {/* Tienda (auto-detectada o manual) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="shop" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                                <div className="p-1 rounded ">
                                    <Store className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                </div>
                                Tienda *
                            </label>
                            {!newProduct.link?.trim() && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowManualShopSelect(!showManualShopSelect)}
                                    className="h-8 text-xs"
                                >
                                    {showManualShopSelect ? 'Ocultar selector' : 'Seleccionar manualmente'}
                                </Button>
                            )}
                        </div>

                        {showManualShopSelect && !newProduct.link?.trim() ? (
                            // Selector manual de tienda
                            <>
                                <Select
                                    value={newProduct.shop || ''}
                                    onValueChange={(val) => setNewProduct(prev => ({ ...prev, shop: val }))}
                                >
                                    <SelectTrigger id="shop">
                                        <SelectValue placeholder="Selecciona una tienda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableShops && availableShops.length > 0 ? (
                                            availableShops.map((shop: { id: number; name: string }) => (
                                                <SelectItem key={shop.id} value={shop.name}>
                                                    {shop.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No hay tiendas disponibles</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Store className="h-3 w-3 text-purple-500" />
                                    Selecciona la tienda manualmente
                                </p>
                            </>
                        ) : (
                            // Campo de solo lectura (detección automática)
                            <>
                                <div className="relative">
                                    <Input
                                        id="shop"
                                        placeholder={newProduct.link?.trim() ? "Esperando detección automática..." : "Sin tienda (usa selector manual)"}
                                        value={newProduct.shop}
                                        readOnly
                                        className="bg-muted/30 border-muted-foreground/20 text-muted-foreground cursor-not-allowed pr-10"
                                    />
                                    {newProduct.shop ? (
                                        isShopInDatabase ? (
                                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                        ) : isShopInDatabase === false ? (
                                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                        ) : (
                                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                        )
                                    ) : newProduct.link ? (
                                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {newProduct.shop ? (
                                        isShopInDatabase ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                Tienda detectada y registrada
                                            </>
                                        ) : isShopInDatabase === false ? (
                                            <>
                                                <AlertCircle className="h-3 w-3 text-amber-500" />
                                                Tienda detectada pero no registrada
                                                <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">Advertencia</Badge>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                Tienda detectada automáticamente
                                            </>
                                        )
                                    ) : newProduct.link ? (
                                        <>
                                            <AlertCircle className="h-3 w-3 text-amber-500" />
                                            No se pudo detectar la tienda automáticamente
                                        </>
                                    ) : (
                                        "Introduce un link o selecciona una tienda manualmente"
                                    )}
                                </p>
                            </>
                        )}
                        {shopsError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Error al cargar tiendas: {shopsError.message}
                            </p>
                        )}
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
                            value={newProduct.category ? newProduct.category : '0'}
                            onValueChange={(val) => setNewProduct(prev => ({ ...prev, category: val !== '0' ? val : '' }))}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Selecciona una categoría (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Sin categoría</SelectItem>
                                {categories.map((c: { id: number; name: string }) => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                                    onChange={(e) => setNewTag({ ...newtag, name: e.target.value })}
                                                    placeholder="Ej: Color, Talla, Marca"
                                                    className="h-8 mt-1 border-muted-foreground/20 focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Valor</label>
                                                <Input
                                                    value={newtag.value}
                                                    onChange={(e) => setNewTag({ ...newtag, value: e.target.value })}
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

                    {/* Sección Económica */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Información Económica</h3>

                        {/* Grid uniforme - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Cantidad */}
                            <div className="space-y-1.5">
                                <label htmlFor="amount_requested" className="text-sm font-medium text-foreground">
                                    Cantidad
                                </label>
                                <Input
                                    id="amount_requested"
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={newProduct.amount_requested}
                                    onChange={(e) => setNewProduct({ ...newProduct, amount_requested: Number(e.target.value) })}
                                    className="h-10"
                                />
                            </div>

                            {/* Precio unitario */}
                            <div className="space-y-1.5">
                                <label htmlFor="shop_cost" className="text-sm font-medium text-foreground">
                                    Precio
                                </label>
                                <Input
                                    id="shop_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newProduct.shop_cost}
                                    onChange={(e) => setNewProduct({ ...newProduct, shop_cost: Number(e.target.value) })}
                                    className="h-10"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Costo de envío */}
                            <div className="space-y-1.5">
                                <label htmlFor="shop_delivery_cost" className="text-sm font-medium text-foreground">
                                    Costo Envío
                                </label>
                                <Input
                                    id="shop_delivery_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newProduct.shop_delivery_cost}
                                    onChange={(e) => setNewProduct({ ...newProduct, shop_delivery_cost: Number(e.target.value) })}
                                    className="h-10"
                                    placeholder="0.00"
                                />
                            </div>



                            {/* Impuesto de tienda (calculado) */}
                            <div className="space-y-1.5">
                                {(() => {
                                    const price = Number(newProduct.shop_cost) || 0
                                    const shippingCost = Number(newProduct.shop_delivery_cost) || 0
                                    const shopTaxRate = newProduct.shop_taxes ?? getShopTaxRate(newProduct.shop || '')
                                    const chargeIva = newProduct.charge_iva ?? true

                                    // Calcular el valor del impuesto de tienda en dólares
                                    const base = price + shippingCost
                                    const baseImpuesto = chargeIva ? base * 0.07 : 0
                                    const baseParaTarifa = base + baseImpuesto
                                    const valorImpuestoTienda = baseParaTarifa * (shopTaxRate / 100)

                                    return (
                                        <>
                                            <label htmlFor="shop_taxes" className="text-sm font-medium text-foreground">
                                                Impuesto Tienda ({shopTaxRate}%)
                                            </label>
                                            <Input
                                                id="shop_taxes"
                                                type="text"
                                                value={valorImpuestoTienda > 0 ? `$${formatCurrency(valorImpuestoTienda)}` : ''}
                                                readOnly
                                                className="h-10 bg-muted/50 cursor-default"
                                                placeholder="$0.00"
                                            />
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Impuesto adicional */}
                            <div className="space-y-1.5">
                                <label htmlFor="added_taxes" className="text-sm font-medium text-foreground">
                                    Impuesto Adicional
                                </label>
                                <Input
                                    id="added_taxes"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newProduct.added_taxes}
                                    onChange={(e) => setNewProduct({ ...newProduct, added_taxes: Number(e.target.value) })}
                                    className="h-10"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Impuestos propios */}
                            <div className="space-y-1.5">
                                <label htmlFor="own_taxes" className="text-sm font-medium text-foreground">
                                    Impuestos Propios ($)
                                </label>
                                <Input
                                    id="own_taxes"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newProduct.own_taxes}
                                    onChange={(e) => setNewProduct({ ...newProduct, own_taxes: Number(e.target.value) })}
                                    className="h-10"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            {/* Cobrar IVA */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="airplane-mode"
                                    checked={!!newProduct.charge_iva}
                                    onCheckedChange={(checked: boolean) => setNewProduct(prev => ({ ...prev, charge_iva: Boolean(checked) }))}
                                />
                                <Label htmlFor="airplane-mode">Aplicar 7%</Label>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de total calculado con detalle de factura */}
                    {(() => {
                        const price = Number(newProduct.shop_cost) || 0
                        const shippingCost = Number(newProduct.shop_delivery_cost) || 0
                        const shopName = newProduct.shop || ''
                        const shopTaxRate = newProduct.shop_taxes
                        const addedTaxes = Number(newProduct.added_taxes) || 0
                        const ownTaxes = Number(newProduct.own_taxes) || 0
                        const chargeIva = newProduct.charge_iva ?? true

                        const calculation = calculateTotalCost(price, shippingCost, shopName, shopTaxRate, addedTaxes, ownTaxes, chargeIva)

                        return (
                            <div className="space-y-4">
                                <Separator className="bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />

                                {/* Card de resumen total - Minimalista */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Total a Cobrar</span>
                                        <Popover open={isInvoicePopoverOpen} onOpenChange={setIsInvoicePopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    type="button"
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[90vw] sm:w-96 p-0" align="end" side="top">
                                                <div className="max-h-[80vh] overflow-y-auto">
                                                    {/* Encabezado de factura */}
                                                    <div className="p-4 bg-primary text-primary-foreground rounded-t-lg sticky top-0 z-10">
                                                        <div className="flex items-center gap-2">
                                                            <Receipt className="h-5 w-5" />
                                                            <h3 className="font-bold text-lg">Desglose de Costos</h3>
                                                        </div>
                                                        <p className="text-xs opacity-90 mt-1">Cálculo detallado del producto</p>
                                                    </div>

                                                    {/* Detalles de la factura */}
                                                    <div className="p-4 space-y-3">
                                                        {/* Información del producto */}
                                                        <div className="pb-3 border-b border-muted-foreground/10">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Producto</p>
                                                            <p className="text-sm font-medium truncate">{newProduct.name || 'Sin nombre'}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Tienda: {shopName || 'No detectada'}</p>
                                                        </div>

                                                        {/* Cálculo de costos */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Precio del producto:</span>
                                                                <span className="font-medium">${formatCurrency(price)}</span>
                                                            </div>
                                                            <Separator className="my-2" />
                                                            <div className="flex justify-between text-sm font-medium">
                                                                <span>Subtotal producto:</span>
                                                                <span>${formatCurrency(calculation.subtotal)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Costo de envío:</span>
                                                                <span className="font-medium text-purple-600">+${formatCurrency(calculation.costoEnvio)}</span>
                                                            </div>
                                                        </div>

                                                        <Separator className="my-2" />

                                                        {/* Impuestos y tarifas */}
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impuestos y Tarifas</p>

                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Impuesto base (7%):</span>
                                                                <span className="font-medium text-emerald-600">+${formatCurrency(calculation.baseImpuesto)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">
                                                                        Tarifa tienda ({shopTaxRate ?? getShopTaxRate(shopName)}%):
                                                                    </span>
                                                                    <span className="font-medium text-blue-600">+${formatCurrency(calculation.tarifaTienda)}</span>
                                                                </div>

                                                            </div>

                                                            {calculation.impuestosAdicionales > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">Impuestos adicionales:</span>
                                                                    <span className="font-medium text-amber-600">+${formatCurrency(calculation.impuestosAdicionales)}</span>
                                                                </div>
                                                            )}

                                                            {calculation.impuestosPropios > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">Impuestos propios:</span>
                                                                    <span className="font-medium text-orange-600">+${formatCurrency(calculation.impuestosPropios)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Separator className="my-3 bg-primary/20" />

                                                        {/* Total en USD */}
                                                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                            <span className="font-bold text-xs">Total a Cobrar (USD):</span>
                                                            <span className="font-bold text-xs text-primary">${formatCurrency(calculation.total)}</span>
                                                        </div>

                                                        {/* Total en CUP */}
                                                        <div className="flex justify-between items-center p-3 ">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-gray-900">Total en CUP:</span>
                                                                <span className="text-xs text-gray-700 font-mono">
                                                                    Tasa: {formatCurrency(exchangeRate)} CUP/USD
                                                                </span>
                                                            </div>
                                                            <span className="font-bold text-xs text-gray-600">
                                                                ${formatCurrency(calculation.total * exchangeRate)} CUP
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Totales - Minimalista */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">USD</div>
                                            <div className="text-2xl font-bold">${formatCurrency(calculation.total)}</div>
                                        </div>
                                        <div className="h-10 w-px bg-border" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">CUP</div>
                                            <div className="text-lg font-semibold">{formatCurrency(calculation.total * exchangeRate)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Botones de acción - Minimalista */}
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={!newProduct.name.trim() || !newProduct.shop?.trim()}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isEditing ? 'Guardar cambios' : 'Añadir producto'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
