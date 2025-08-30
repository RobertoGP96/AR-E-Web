import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";



const storeOptions = [
  { value: "shein", label: "Shein", extra: 0 },
  { value: "amazon", label: "Amazon / Temu", extra: 0.03 },
  { value: "aliexpress", label: "AliExpress / eBay / Otras", extra: 0.05 },
];

const categoryOptions = [{
  name: "Alimento / Medicamentos / Aseo",
  value: "alimed",
  price: 6
},
{
  name: "Miscelaneas",
  value: "misc",
  price: 7
}, {
  name: "Electrodomesticos y Partes",
  value: "elect",
  price: 8
}
]

function calculateBuy(price: number, store: string) {
  const baseTax = 0.07;
  const extra = storeOptions.find(opt => opt.value === store)?.extra ?? 0;
  const taxes = price * baseTax;
  const extraFee = price * extra;
  return price + taxes + extraFee;
}

function calculateWeidth(weidth: number, category: string) {
  const extra = categoryOptions.find(opt => opt.value === category)?.price ?? 0;
  return weidth * extra;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PurchaseCalculator() {
  const [price, setPrice] = useState<number>(0);
  const [weidth, setWeidth] = useState<number>(0);
  const [store, setStore] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const subtotal1 = useMemo(() => {
    if (isNaN(price) || price <= 0) return 0;
    return calculateBuy(price, store);
  }, [price, store]);

  const subtotal2 = useMemo(():number => {
    if (isNaN(weidth) || weidth <= 0) return 0;
    return calculateWeidth(weidth, category);
  }, [weidth, category]);

  const total = useMemo(() => {
    return (subtotal1 && subtotal2)?subtotal1+subtotal2:0;
  }, [subtotal2, subtotal1]);


  return (
    <div className="w-full bg-gray-700/10 rounded-xl p-6 flex flex-col gap-4 border border-primary/30 mt-4">
      <h4 className="text-xl font-bold text-primary mb-2">Calcula tu pago</h4>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="price" className="text-base">Precio del artículo (USD)</label>
          <Input
            id="price"
            type="number"
            min={0}
            step="any"
            placeholder="Ej: 100.00"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="store" className="text-base">Tienda</label>
          <Select value={store} onValueChange={setStore}>
            <SelectTrigger id="store" className="w-full">
              <SelectValue className="w-full" placeholder="Selecciona tienda" />
            </SelectTrigger>
            <SelectContent>
              {storeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-base">Subtotal</label>
          <div className="text-2xl font-bold text-primary">
            {total !== null ? formatCurrency(subtotal1 as number) : "--"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:flex-row gap-4 items-end">
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="Weidth" className="text-base">Peso (lb)</label>
          <Input
            id="weidth"
            type="number"
            min={0}
            step="any"
            placeholder="Ej: 100.00"
            value={weidth}
            onChange={e => setWeidth(Number(e.target.value))}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="store" className="text-base">Categoría</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="store" className="w-full">
              <SelectValue className="w-full" placeholder="Selecciona tienda" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-base">SubTotal:</label>
          <div className="text-2xl font-bold text-primary">
            {total !== null ? formatCurrency(subtotal2 as number) : "--"}
          </div>
        </div>
      </div>
      <div className=" flex flex-col justify-center items-end">
        <label>
              Total a pagar:
        </label>
        <div className="text-2xl font-bold text-primary">
          {total !== null ? formatCurrency(total) : "--"}
        </div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
        El cálculo incluye taxes obligatorios (7%) y el extra según la tienda seleccionada.
      </div>
    </div>
  );
}

export default PurchaseCalculator;