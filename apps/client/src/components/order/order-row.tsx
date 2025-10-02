import { formatDateTime, formatUSD } from "@/lib"
import { Order } from "@/types/order"
import { ShoppingBag, Clock, Box, EllipsisVertical, Clipboard } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { OrderStatusLabel, PaymentStatusLabel } from "./order-status"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"



const OrderRow = ({ order }: { order: Order }) => {
    return (
        <div className='grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_auto] gap-2 md:gap-4 ring ring-white/10 p-3 md:p-4 rounded-md bg-white/2.5 hover:bg-white/5 w-full items-center'>
            {/* Primera columna - Información principal */}
            <div className='flex flex-row gap-3 md:gap-4 justify-start items-center min-w-0'>
                <div className='p-2 md:p-3 bg-black/20 rounded-lg flex-shrink-0'>
                    <ShoppingBag className='text-gray-200 h-4 w-4 md:h-6 md:w-6' />
                </div>
                <div className='flex flex-col gap-1 md:gap-2 min-w-0 flex-1'>
                    <div className="flex flex-row gap-2 md:gap-3 flex-wrap items-center">
                        <Badge className='bg-gray-400 rounded-full text-xs flex-shrink-0'>{"#0000" + order.id}</Badge>
                        <div className="px-2 py-1 border-gray-300 border rounded-full flex flex-row justify-center items-center gap-1 flex-shrink-0">
                            <Box className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm">{order.products.length}</span>
                        </div>
                    </div>
                    <div className='flex flex-row gap-1 items-center min-w-0'>
                        <Clock className='h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0' />
                        <span className='text-gray-400 text-xs md:text-sm truncate'>
                            {formatDateTime(new Date(order.create_at as string))}
                        </span>
                    </div>
                </div>
            </div>

            {/* Segunda columna - Estados y Precio (solo en desktop) */}
            <div className='ml-12 hidden md:flex justify-between items-center gap-4 min-w-0'>
                {/* Estados */}
                <div className='flex gap-4 items-center min-w-0'>
                    <div className="flex flex-row gap-2 items-center">
                        <span className="text-gray-400 text-sm whitespace-nowrap">Estado:</span>
                        <OrderStatusLabel status={order.status} />
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <span className="text-gray-400 text-sm whitespace-nowrap">Pagado:</span>
                        <PaymentStatusLabel paidStatus={order.pay_status} />
                    </div>
                </div>
                {/* Precio */}
                <div className='flex items-center flex-shrink-0'>
                    <span className='text-md font-bold whitespace-nowrap'>{formatUSD(order.total_cost)}</span>
                </div>
            </div>

            {/* Dropdown menu - Siempre visible en la esquina derecha */}
            <div className='flex items-center justify-end flex-shrink-0'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-white/10 focus:bg-white/10"
                        >
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú de opciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer">
                            <Clipboard className="h-4 w-4 mr-2" />
                            <span>Ver detalles</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Información adicional en mobile - Segunda fila */}
            <div className='md:hidden col-span-2 flex justify-between items-center gap-2 pt-2 border-t border-white/10'>
                <div className='flex gap-3 items-center flex-wrap'>
                    <div className="flex flex-row gap-1 items-center">
                        <span className="text-gray-400 text-xs">Estado:</span>
                        <OrderStatusLabel status={order.status} />
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <span className="text-gray-400 text-xs">Pagado:</span>
                        <PaymentStatusLabel paidStatus={order.pay_status} />
                    </div>
                </div>
                <div className='flex items-center'>
                    <span className='text-sm font-bold'>{formatUSD(order.total_cost)}</span>
                </div>
            </div>
        </div>
    )
}

export default OrderRow