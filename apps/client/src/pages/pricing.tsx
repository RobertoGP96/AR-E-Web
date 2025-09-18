import PurchaseCalculator from "@/components/about/calculator";
import PayMethods from "@/components/about/price/pay-methods";
import Pricing from "@/components/about/price/Pricing";
import ExchangeRate from "@/components/about/price/rage-exchange";

const About = () => {
    return (
        <div className="flex flex-col justify-center items-center gap-2 mt-20">

            <Pricing />
            <ExchangeRate />
            {/* Métodos de pago */}
            <div id="metodos-pago" className="w-1/2  p-6 my-20 ">
                <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-center w-full text-5xl font-black text-white tracking-tight">
                        Métodos de Pago
                    </h3>
                </div>
                <PayMethods />
            </div>

            {/* Pago*/}
            <div className="flex justify-center w-2/3 mb-10">
                <div className="flex flex-col items-center gap-6">
                    <h3 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight my-5">
                        ¿Cómo se calcula el pago?
                    </h3>

                    <PurchaseCalculator />
                </div>
            </div>
        </div>
    );
};

export default About;