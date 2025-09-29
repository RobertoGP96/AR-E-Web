import { formatDateTime, formatUSD } from "@/lib"
import { Order } from "@/types/order"
import { ShoppingBag, Clock, Box, EllipsisVertical, Trash, PenIcon, Clipboard } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { OrderStatusLabel, PaymentStatusLabel } from "./order-status"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"



const OrderRow = ({ order }: { order: Order }) => {
    return (<div className='grid grid-cols-3 justify-center gap-2 ring ring-white/10 p-2 rounded-md bg-white/2.5 hover:bg-white/5 w-full'>
        <div className=' flex flex-row gap-4 justify-start items-center p-3'>
            <div className='p-3 bg-black/20 rounded-lg'>
                <ShoppingBag className='text-gray-200 h-6 w-6' />
            </div>
            <div className='flex flex-col gap-2'>
                <div className="flex flex-row gap-3">
                    <Badge className='bg-gray-400 rounded-full'>{"#0000" + order.id}</Badge>
                    <div className="px-2 border-gray-300 border rounded-full flex flex-row justify-center items-center gap-1">
                        <Box className="h-4 w-4" />
                        <span className="text-sm">{order.products.length}</span>
                    </div>
                </div>
                <div className='flex flex-row w-full gap-1 justify-center items-center nowrap'>
                    <Clock className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-400 text-sm'>
                        {formatDateTime(new Date(order.create_at as string))}
                    </span>

                </div>
            </div>

        </div>

        <div className='flex  justify-start gap-4 items-center'>
            <div className="flex flex-row gap-2">
                <span className="text-gray-400 text-sm">Estado:</span>
                <OrderStatusLabel status={order.status} />
            </div>
            <div className="flex flex-row gap-2">
                <span className="text-gray-400 text-sm">Pagado:</span>
                <PaymentStatusLabel paidStatus={order.pay_status} />
            </div>
        </div>

        <div className='flex flex-row justify-end  items-center gap-4'>
            <span className='text-md font-bold pr-4'>{formatUSD(order.total_cost)}</span>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button type="button" variant="ghost">
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="">
                    <DropdownMenuItem>
                        <Clipboard/>
                        <span className="text-white">Detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Box/>
                        <span className="text-white">Productos</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <PenIcon/>
                        <span className="text-white">Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Trash className="h-4 w-4 text-red-500" />
                        <span className="text-white">
                            Eliminar
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>)
}

export default OrderRow