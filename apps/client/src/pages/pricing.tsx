import PurchaseCalculator from "@/components/about/calculator";
import PayMethods from "@/components/about/price/pay-methods";
import Pricing from "@/components/about/price/Pricing";
import ExchangeRate from "@/components/about/price/rage-exchange";
import { useEffect, useState } from 'react';

const About = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className="flex flex-col justify-center items-center gap-2 mt-20 animate-fade-in">
            {/* Pricing Component */}
            <div className={`transition-all duration-1000 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                <Pricing />
            </div>
            
            {/* Exchange Rate */}
            <div className={`transition-all duration-1000 delay-300 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                <ExchangeRate />
            </div>
            
            {/* Métodos de pago */}
            <div id="metodos-pago" className={`w-4/5 sm:w-1/2 md:w-2/5 p-6 my-20 transition-all duration-1000 delay-500 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-center w-full text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight animate-pulse-slow">
                        Métodos de Pago
                    </h3>
                </div>
                <PayMethods />
            </div>

            {/* Pago*/}
            <div className={`flex justify-center w-full sm:w-1/2 md:w-2/5 mb-10 transition-all duration-1000 delay-700 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                <div className="flex flex-col items-center gap-6">
                    <h3 className="font-bold text-2xl sm:text-3xl md:text-5xl text-center text-gray-900 dark:text-white tracking-tight my-5 animate-pulse-slow">
                        ¿Cómo se calcula el pago?
                    </h3>

                    <PurchaseCalculator />
                </div>
            </div>
        </div>
    );
};

export default About;