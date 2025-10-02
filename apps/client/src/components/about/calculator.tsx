import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, ShoppingBag, Receipt, Weight } from "lucide-react";

// Types
interface StoreOption {
  value: string;
  label: string;
  extra: number;
}

interface CategoryOption {
  name: string;
  value: string;
  price: number;
}

// Constants moved outside component for better performance
const STORE_OPTIONS: StoreOption[] = [
  { value: "shein", label: "Shein", extra: 0.00 },
  { value: "amazon", label: "Amazon / Temu", extra: 0.03 },
  { value: "aliexpress", label: "AliExp/ eBay / ***", extra: 0.05 },
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    name: "Alim / Medic./ Aseo",
    value: "alimed",
    price: 6
  },
  {
    name: "Misceláneas",
    value: "misc",
    price: 7
  },
  {
    name: "Electrod / Partes",
    value: "elect",
    price: 8
  }
];

const BASE_TAX = 0.07;

// Utility functions
function calculateBuy(price: number, store: string, additionalTax: number = 0): number {
  if (!price || price <= 0) return 0;
  const extra = STORE_OPTIONS.find((opt: StoreOption) => opt.value === store)?.extra ?? 0;
  const taxes = price * BASE_TAX;
  const extraFee = (price + taxes) * extra;
  return price + taxes + extraFee + additionalTax;
}

function calculateWeight(weight: number, category: string): number {
  if (!weight || weight <= 0) return 0;
  const extra = CATEGORY_OPTIONS.find((opt: CategoryOption) => opt.value === category)?.price ?? 0;
  return weight * extra;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PurchaseCalculator() {
  const [price, setPrice] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [store, setStore] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [additionalTax, setAdditionalTax] = useState<number>(0);

  // Input handlers with validation
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setPrice(Math.max(0, value));
  }, []);

  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setWeight(Math.max(0, value));
  }, []);

  const handleAdditionalTaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAdditionalTax(Math.max(0, Math.min(100, value)));
  }, []);

  const subtotal1 = useMemo(() => {
    if (isNaN(price) || price <= 0) return 0;
    return calculateBuy(price, store, additionalTax);
  }, [price, store, additionalTax]);

  const subtotal2 = useMemo((): number => {
    if (isNaN(weight) || weight <= 0) return 0;
    return calculateWeight(weight, category);
  }, [weight, category]);

  const total = useMemo(() => {
    return subtotal1 + subtotal2;
  }, [subtotal2, subtotal1]);

  const selectedStore = STORE_OPTIONS.find((opt: StoreOption) => opt.value === store);
  const selectedCategory = CATEGORY_OPTIONS.find((opt: CategoryOption) => opt.value === category);

  return (
    <div 
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative"
      role="application"
      aria-label="Calculadora de envío internacional"
    >
      <div className="p-6 sm:p-8 space-y-8">


        {/* Explicación del Cálculo */}
        <div className=" bg-black/10 border border-orange-400/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            ¿Cómo funciona el cálculo?
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <h4 className="text-blue-400 font-medium">Costo del Producto</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-300 ml-4">
                <p>• Precio base del artículo</p>
                <p>• <span className="text-orange-300 font-medium">Impuesto base: 7%</span></p>
                <p>• <span className="text-orange-300 font-medium">Tarifa por tienda:</span></p>
                <div className="ml-4 space-y-1 text-xs">
                  <p>→ Shein: 0%</p>
                  <p>→ Amazon/Temu: 3%</p>
                  <p>→ AliExpress/Otras: 5%</p>
                </div>
                <p>• Impuestos adicionales</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <h4 className="text-green-400 font-medium">Costo de Envío</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-300 ml-4">
                <p>• Basado en el peso del producto</p>
                <p>• <span className="text-green-300 font-medium">Tarifas por categoría:</span></p>
                <div className="ml-4 space-y-1 text-xs">
                  <p>→ Alimentos/Medicinas/Aseo: $6/lb</p>
                  <p>→ Misceláneas: $7/lb</p>
                  <p>→ Electrodomésticos: $8/lb</p>
                </div>
                <p>• Pago al momento de recogida</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-center text-sm font-medium">
                <span className="text-blue-400">Total = </span>
                <span className="text-orange-300">(Producto + Impuestos)</span>
                <span className="text-white"> + </span>
                <span className="text-green-300">(Peso × Tarifa)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Principal */}
        <div className="text-center my-8 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-orange-400/20 rounded-xl">
              <Calculator className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl  font-bold text-white">
                Calculadora de Envío
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Calcula el costo total de tu compra internacional
              </p>
            </div>
          </div>
        </div>
        {/* Información del Producto */}
        <div className="bg-slate-800/30 border border-orange-400/20 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-400/20 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Información del Producto
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <label htmlFor="price" className="text-sm font-medium text-slate-200 block">
                Precio del Producto (USD)
              </label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="Ej: 100.00"
                value={price || ""}
                onChange={handlePriceChange}
                aria-describedby="price-help"
                className="bg-slate-700/50 border-orange-400/30 text-white placeholder:text-slate-400 
                          focus:border-orange-400 focus:ring-orange-400/20 transition-colors
                          h-9 text-base rounded-lg"
              />
              <div id="price-help" className="sr-only">
                Ingrese el precio del producto en dólares americanos
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="store" className="text-sm font-medium text-slate-200 block">
                Tienda de Compra
              </label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger
                  id="store"
                  className="w-full min-w-0 bg-slate-700/50 border-orange-400/30 text-white 
                           focus:border-orange-400 focus:ring-orange-400/20 h-12 rounded-lg flex items-center justify-between"
                  style={{ minWidth: "0" }}
                >
                  <SelectValue 
                    placeholder="Selecciona una tienda" 
                    className="truncate w-full text-left"
                  />
                </SelectTrigger>
                <SelectContent 
                  className="bg-slate-700 border-slate-600 rounded-lg"
                  position="popper"
                  sideOffset={5}
                  collisionPadding={20}
                  avoidCollisions={true}
                  style={{ zIndex: 100001 }}
                >
                  {STORE_OPTIONS.map((opt: StoreOption) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-white hover:bg-slate-600 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-3 min-w-0">
                        <span className="font-medium truncate">{opt.label}</span>
                        {opt.extra >= 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-400/80 text-white text-xs font-medium px-2 py-1"
                          >
                            +{(opt.extra * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              <label htmlFor="additionalTax" className="text-sm font-medium text-slate-200 block">
                Impuesto Adicional
              </label>
              <Input
                id="additionalTax"
                type="number"
                min={0}
                max={100}
                step="0.1"
                placeholder="Ej: 5.0"
                value={additionalTax || ""}
                onChange={handleAdditionalTaxChange}
                aria-describedby="tax-help"
                className="bg-slate-700/50 border-orange-400/30 text-white placeholder:text-slate-400 
                          focus:border-orange-400 focus:ring-orange-400/20 transition-colors
                          h-9 text-base rounded-lg"
              />
              <div id="tax-help" className="sr-only">
                Impuesto adicional entre 0 y 100
              </div>
            </div>
          </div>

          {/* Subtotal del producto */}
          <div className="bg-gradient-to-r from-orange-400/10 to-orange-400/5 border-2 border-dashed 
                          border-orange-400/40 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-white font-semibold text-lg">Subtotal del Producto</p>
                {selectedStore && (
                  <p className="text-sm text-slate-300 mt-1">
                    Impuesto base 7% + {selectedStore.extra > 0 ? `${(selectedStore.extra * 100).toFixed(0)}%` : '0%'} de tienda
                    {additionalTax > 0 && ` + ${additionalTax} adicional`}
                  </p>
                )}
              </div>
              <div className="text-2xl font-bold text-orange-400 bg-slate-700/50 px-4 py-2 rounded-lg">
                {subtotal1 > 0 ? formatCurrency(subtotal1) : "$0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Información del Envío */}
        <div className="bg-slate-800/30 border border-green-400/20 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-400/20 rounded-lg">
              <Weight className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Información del Envío
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label htmlFor="weight" className="text-sm font-medium text-slate-200 block">
                Peso del Producto (lb)
              </label>
              <Input
                id="weight"
                type="number"
                min={0}
                step="0.1"
                placeholder="Ej: 2.5"
                value={weight || ""}
                onChange={handleWeightChange}
                aria-describedby="weight-help"
                className="bg-slate-700/50 border-green-400/30 text-white placeholder:text-slate-400 
                          focus:border-green-400 focus:ring-green-400/20 transition-colors
                          h-9 text-base rounded-lg"
              />
              <div id="weight-help" className="sr-only">
                Peso del producto en libras
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="category" className="text-sm font-medium text-slate-200 block">
                Categoría del Producto
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="w-full min-w-0 bg-slate-700/50 border-green-400/30 text-white 
                           focus:border-green-400 focus:ring-green-400/20 h-9 rounded-lg flex items-center justify-between"
                  style={{ minWidth: "0" }}
                >
                  <SelectValue 
                    placeholder="Selecciona una categoría" 
                    className="truncate w-full text-left"
                  />
                </SelectTrigger>
                <SelectContent 
                  className="bg-slate-700 border-slate-600 rounded-lg"
                  position="popper"
                  sideOffset={5}
                  collisionPadding={20}
                  avoidCollisions={true}
                  style={{ zIndex: 100001 }}
                >
                  {CATEGORY_OPTIONS.map((opt: CategoryOption) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-white hover:bg-slate-600 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-3 min-w-0">
                        <span className="font-medium truncate">{opt.name}</span>
                        <Badge
                          variant="outline"
                          className="bg-green-400/80 border-green-400/80 text-white text-xs font-medium px-2 py-1"
                        >
                          ${opt.price}/lb
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtotal del envío */}
          <div className="bg-gradient-to-r from-green-400/10 to-green-400/5 border-2 border-dashed 
                          border-green-400/40 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-white font-semibold text-lg">Costo de Envío</p>
                {selectedCategory && weight > 0 && (
                  <p className="text-sm text-slate-300 mt-1">
                    {weight} lb × ${selectedCategory.price}/lb = {formatCurrency(subtotal2)}
                  </p>
                )}
              </div>
              <div className="text-2xl font-bold text-green-400 bg-slate-700/50 px-4 py-2 rounded-lg">
                {subtotal2 > 0 ? formatCurrency(subtotal2) : "$0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Total Final */}
        <div className="bg-black/10 border-2 border-orange-400/50 
                        rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="p-3 bg-orange-400/20 rounded-xl">
                <Receipt className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Total a Pagar</h3>
                <p className="text-slate-300">Producto + Envío</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {total > 0 ? formatCurrency(total) : "$0.00"}
              </div>
              {total > 0 && (
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Producto: {formatCurrency(subtotal1)}</p>
                  <p>Envío: {formatCurrency(subtotal2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notas informativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-400/10 border border-gray-400/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <h4 className="text-blue-400 font-medium">Pago del Producto</h4>
            </div>
            <p className="text-sm text-slate-300">
              Se realiza <strong>antes</strong> de hacer la compra internacional
            </p>
          </div>

          <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h4 className="text-green-400 font-medium">Pago del Envío</h4>
            </div>
            <p className="text-sm text-slate-300">
              Se realiza al momento de <strong>recoger</strong> el producto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseCalculator;