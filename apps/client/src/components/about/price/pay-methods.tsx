import { CircleDollarSign, CreditCard, DollarSign, type LucideProps } from "lucide-react"

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

export default function PayMethods() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {methodList.map((method, index) => (
                <div key={index} className="rounded-lg bg-gray-700/30 ring ring-gray-500/20 p-2 flex items-center justify-center space-x-3 hover:bg-gray-500/10 transition-all duration-300 group cursor-pointer">
                    {method.logo ? (<img className={method.class?"":method.class+" h-20 w-auto aspect-square"} alt="pay logo" src={`/assets/payment/${method.name.toLowerCase()}.svg`} />) : (method.icon && <method.icon />)}
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