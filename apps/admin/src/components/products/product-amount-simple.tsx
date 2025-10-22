import type { Product } from "@/types";
import { CircularProgress } from "../utils/CircularProgres";

export const ProductAmountSimple = ({ product }: { product: Product }) => {

    const ProgressC = ({ value, color }: { value: number, color: string }) => {
        return <div className="relative p-3 flex justify-center items-center" >
            <CircularProgress
                value={value}
                size={60}
                strokeWidth={7}
                showLabel
                labelClassName="text-sm font-bold"
                progressClassName={color}
            />
        </div>
    }

    return <div className=" grid grid-cols-3  gap-2">
        <ProgressC value={(product.amount_purchased+2 / product.amount_requested) * 100} color="bg-blue-500"  />
        <ProgressC value={(product.amount_received+1 / product.amount_requested) * 100} color="bg-green-500" />
        <ProgressC value={(product.amount_delivered / product.amount_requested) * 100} color="bg-red-500" />
    </div>;
}