import { CircleDollarSign, CreditCard, DollarSign, type LucideProps } from "lucide-react"
import paypalSvg from '/assets/payment/paypal.svg';
import zelleSvg from '/assets/payment/zelle.svg';

type method = {
    name: string,
    icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>,
    class?: string,
    logo?: boolean
}

const methodList: method[] = [
    { name: 'CUP', icon: CircleDollarSign },
    { name: 'USD', icon: DollarSign },
    { name: 'PayPal', icon: CreditCard, logo: true },
    { name: 'Zelle', icon: CreditCard, logo: true },
]

const paymentLogos: Record<string, string> = {
    paypal: paypalSvg,
    zelle: zelleSvg,
}

export default function PayMethods() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {methodList.map((method, index) => (
                <div key={index} className="rounded-lg bg-gray-700/30 ring ring-gray-500/20 p-2 flex items-center justify-center space-x-3 hover:bg-gray-500/10 transition-all duration-300 group cursor-pointer">
                    {method.logo ? (<img className={method.class?"":method.class+" h-20 w-auto aspect-square"} alt="pay logo" src={paymentLogos[method.name.toLowerCase()]} />) : (method.icon && <method.icon />)}
                    {
                        !method.logo &&
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                            {method.name}
                        </span>
                    }
                </div>
            ))}
        </div>
    )
}