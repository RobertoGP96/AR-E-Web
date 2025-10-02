import { OrderStatus, PayStatus } from "@/types/base"
import { Badge } from "../ui/badge"
import { BadgeCheck, Check, CheckCheck, Circle, CircleDivide, Clock } from 'lucide-react';

const PaymentVariants = {
    paid: {
        icon: BadgeCheck,
        style: "bg-green-400 border-green-500"
    },
    unpaid: {
        icon: Circle,
        style: "bg-yellow-500 border-yellow-500"
    },
    partial: {
        icon: CircleDivide,
        style: "bg-gray-500 border-gray-500"
    },
}

const OrderStatusVariants = {
    ordered: {
        icon: Check,
        style: "bg-gray-400/20 border-gray-500"
    },
    procesing: {
        icon: Clock,
        style: "bg-yellow-500/20 border-yellow-500"
    },
    completed: {
        icon: CheckCheck,
        style: "bg-green-400 border-green-700"
    },
    canceled: {
        icon: CircleDivide,
        style: "bg-red-500/20 border-red-500"
    },
}

interface OrderStatusProps {
    status: OrderStatus
}

export const OrderStatusLabel = ({
    status
}: OrderStatusProps) => {

    const getStatusStyle = () => {
        switch (status) {
            case "Encargado":
                return OrderStatusVariants.ordered
            case "En proceso":
                return OrderStatusVariants.procesing
            case "Cancelado":
                return OrderStatusVariants.canceled
            case "Completado":
                return OrderStatusVariants.completed
        }
    }
    const severity = getStatusStyle()
    const Icon = severity.icon

    return (
        <Badge className={severity.style + " p-1 px-2 flex justify-center items-center gap-1"}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline text-xs sm:text-sm">{status}</span>
        </Badge>)
}



interface PaymentStatusProps {
    paidStatus: PayStatus
}

export const PaymentStatusLabel = ({
    paidStatus
}: PaymentStatusProps) => {
    const getPayStyle = () => {
        switch (paidStatus) {
            case "Pagado":
                return PaymentVariants.paid
            case "Parcial":
                return PaymentVariants.partial
            case "Pendiente":
                return PaymentVariants.unpaid
        }
    }
    
    const severity = getPayStyle()
    const Icon = severity.icon
    

    return (
        <Badge className={severity.style + " p-1 px-2 flex justify-center items-center gap-1"}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline text-xs sm:text-sm">{paidStatus}</span>
        </Badge>)
}

