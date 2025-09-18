import { ChevronRight } from "lucide-react"

type rateItem = {
    exchangeFrom: string,
    exchangeTo: string,
    rate: number
}

const rates: rateItem[] = [
    {
        exchangeFrom: "USD",
        exchangeTo: "CUP",
        rate: 430.00
    },
    {
        exchangeFrom: "USD",
        exchangeTo: "TCUP",
        rate: 435.00
    }, {
        exchangeFrom: "USD",
        exchangeTo: "Zelle",
        rate: 1
    }
]

export default function ExchangeRate() {
    return (
        <div className="relative isolate px-6 lg:px-8 mt-20 " id="exchange-rates">
            <div className="mx-auto max-w-4xl text-center">
                <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl dark:text-white">
                    Tasas de Cambio
                </p>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">
                Estas son las tasa aplicadas a las diferentes monedas actualmente.
            </p>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6">
                {rates.map((rateItem, index) => (
                    <div
                        key={index}
                        className={`bg-black/10`+' ring-1 ring-gray-500/30 px-6 p-4 flex flex-row justify-between items-center rounded-xl shadow-none sm:mx-8 lg:mx-0 transition-all duration-300 ease-in-out hover:scale-105'}
                    >
                        <p className="flex items-baseline gap-x-2 m-0">
                            <span
                                className={'text-white text-5xl font-semibold tracking-tight'}
                            >
                                $1.00
                            </span>
                            <span
                                className={'text-black text-base bg-primary px-2 rounded-full'}
                            >
                                {rateItem.exchangeFrom}
                            </span>
                        </p>
                        <ChevronRight/>
                        <p className="flex items-baseline gap-x-2">
                            <span
                                className={'text-white text-5xl font-semibold tracking-tight'}
                            >
                                {"$"+rateItem.rate.toFixed(2)}
                            </span>
                            <span
                                className={'text-black text-base bg-primary px-2 rounded-full'}
                            >
                                {rateItem.exchangeTo}
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
