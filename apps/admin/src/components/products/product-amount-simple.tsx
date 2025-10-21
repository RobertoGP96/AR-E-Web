import type { Product } from "@/types";
import { CircularProgress } from "../utils/CircularProgres";

export const ProductAmountSimple = ({product}: {product: Product}) => {
  
    const Progress = ({value, color}: {value: number, color: string}) => {
      return <div className={`p-4 flex justify-center items-center rounded-2xl ${color}`} style={{width: `${value}%`}}>
            <CircularProgress value={value} size={120} strokeWidth={10} />
      </div>
    }

  return <div className=" grid grid-cols-3  gap-2">
    <Progress value={(product.amount_purchased / product.amount_requested) * 100} color="bg-blue-500" />
    <Progress value={(product.amount_received / product.amount_requested) * 100} color="bg-green-500" />
    <Progress value={(product.amount_delivered / product.amount_requested) * 100} color="bg-red-500" />
  </div>;
}