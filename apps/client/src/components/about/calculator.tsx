import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, ShoppingBag, Receipt, Weight } from "lucide-react";

const storeOptions = [
  { value: "shein", label: "Shein", extra: 0.00},
  { value: "amazon", label: "Amazon / Temu", extra: 0.03 },
  { value: "aliexpress", label: "AliExp/ eBay / ***", extra: 0.05 },
];

const categoryOptions = [
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

function calculateBuy(price: number, store: string, additionalTax: number = 0) {
  const baseTax = 0.07;
  const extra = storeOptions.find(opt => opt.value === store)?.extra ?? 0;
  const taxes = price * baseTax;
  const extraFee = (price + taxes) * extra;
  return price + taxes + extraFee + additionalTax;
}

function calculateWeight(weight: number, category: string) {
  const extra = categoryOptions.find(opt => opt.value === category)?.price ?? 0;
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

  const subtotal1 = useMemo(() => {
    if (isNaN(price) || price <= 0) return 0;
    return calculateBuy(price, store, additionalTax);
  }, [price, store, additionalTax]);

  const subtotal2 = useMemo((): number => {
    if (isNaN(weight) || weight <= 0) return 0;
    return calculateWeight(weight, category);
  }, [weight, category]);

  const total = useMemo(() => {
    return  subtotal1 + subtotal2 ;
  }, [subtotal2, subtotal1]);

  const selectedStore = storeOptions.find(opt => opt.value === store);
  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className=" p-6 space-y-6">
        {/* Explicación del Cálculo */}
        <div className=" border border-orange-400/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-400" />
            ¿Cómo se calcula el pago de encargar?
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-blue-400 font-medium">💰 Costo del Producto:</h4>
                <ul className="text-xs space-y-1 ml-2">
                  <li>• Se realiza el pago antes de hacer la compra</li>
                  <li>• Precio base del artículo</li>
                  <li>• <span className="text-orange-300">Impuesto base: 7%</span></li>
                  <li>• <span className="text-orange-300">Tarifa por tienda:</span>
                    <br className="md:hidden" />
                    <span className="ml-2">Shein: 0% | Amazon/Temu: 3% | AliExpress/Otras: 5%</span>
                  </li>
                  <li>• Impuestos adicionales (si aplica)</li>
                </ul>
              </div>
              <div>
                <h4 className="text-green-400 font-medium">📦 Costo de Envío:</h4>
                <ul className="text-xs space-y-1 ml-2">
                  <li>• Se realiza el pago una ves el producto este listo para recoger.</li>
                  <li>• Basado en el peso del producto</li>
                  <li>• <span className="text-green-300">Tarifas por categoría:</span></li>
                  <li className="ml-2">- Alimentos/Medicinas/Aseo: $6/lb</li>
                  <li className="ml-2">- Misceláneas: $7/lb</li>
                  <li className="ml-2">- Electrodomésticos: $8/lb</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-600">
              <p className="text-center">
                <span className="text-blue-400 font-medium">Total = </span>
                <span className="text-orange-300">(Precio + 7% + Tarifa Tienda + Impuestos Adicionales)</span>
                <span className="text-white"> + </span>
                <span className="text-green-300">(Peso × Tarifa Categoría)</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center pb-4 border-b border-orange-400/20">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6 text-orange-400" />
            Calculadora de Envío
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Calcula el costo total de tu compra
          </p>
        </div>

        {/* Información del Producto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-orange-400" />
            Producto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium text-slate-300">
                Precio (USD)
              </label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="100.00"
                value={price || ""}
                onChange={e => setPrice(Number(e.target.value))}
                className="bg-orange-400/20 border-orange-400/50 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="store" className="text-sm font-medium text-slate-300">
                Tienda
              </label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger id="store" className="w-55 bg-orange-400/20 border-orange-400/50 text-white">
                  <SelectValue placeholder="Selecciona tienda" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {storeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-600">
                      <div className="flex items-center justify-between w-full">
                        <span>{opt.label}</span>
                        {opt.extra >= 0 && (
                          <Badge variant="secondary" className="ml-2 bg-orange-400 text-white">
                            +{(opt.extra * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="additionalTax" className="text-sm font-medium text-slate-300">
                Impuesto adicional (%)
              </label>
              <Input
                id="additionalTax"
                type="number"
                min={0}
                max={100}
                step="0.1"
                placeholder="0.0"
                value={additionalTax || ""}
                onChange={e => setAdditionalTax(Number(e.target.value))}
                className="bg-orange-400/20 border-orange-400/50 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Subtotal del producto */}
          <div className="border-2 border-dashed border-orange-400/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-300 font-medium">Subtotal Producto</p>
                {selectedStore && (
                  <p className="text-xs text-slate-400">
                    Base 7% + {selectedStore.extra > 0 ? `${(selectedStore.extra * 100).toFixed(0)}%` : '0%'} tienda
                    {additionalTax > 0 && ` + ${additionalTax}% adicional`}
                  </p>
                )}
              </div>
              <div className="text-xl font-bold text-green-400">
                {subtotal1 > 0 ? formatCurrency(subtotal1) : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Información del Envío */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Weight className="h-5 w-5 text-orange-400" />
            Envío
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium text-slate-300">
                Peso (lb)
              </label>
              <Input
                id="weight"
                type="number"
                min={0}
                step="0.1"
                placeholder="2.5"
                value={weight || ""}
                onChange={e => setWeight(Number(e.target.value))}
                className="bg-orange-400/20 border-orange-400/50 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-300">
                Categoría
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="bg-gray-700 border-orange-400 text-white">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-600">
                      <div className="flex items-center justify-between w-full">
                        <span>{opt.name}</span>
                        <Badge variant="outline" className="ml-2 bg-orange-400 border-orange-400 text-white">
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
          <div className=" border-2 border-dashed border-orange-400/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-300 font-medium">Costo de Envío</p>
                {selectedCategory && weight > 0 && (
                  <p className="text-xs text-slate-400">
                    {weight} lb × ${selectedCategory.price}/lb
                  </p>
                )}
              </div>
              <div className="text-xl font-bold text-orange-400">
                {subtotal2 > 0 ? formatCurrency(subtotal2) : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Total Final */}
        <div className=" border border-orange-400/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-orange-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Total a Pagar</h3>
                <p className="text-sm text-slate-300">Producto + Envío</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-orage-400">
              {total > 0 ? formatCurrency(total) : "--"}
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="text-xs text-orange-400 bg-orange-400/30 p-3 rounded-lg">
          <p><strong>Cálculo:</strong> Impuesto base 7% + extra por tienda + impuestos adicionales + envío por peso</p>
        </div>
      </div>
    </div>
  );
}

export default PurchaseCalculator;