import PurchaseCalculator from "@/components/about/calculator";
import PayMethods from "@/components/about/price/pay-methods";
import Pricing from "@/components/about/price/Pricing";
import ExchangeRate from "@/components/about/price/rage-exchange";
import { ShoppingCart, Equal, Plus, Truck, Asterisk } from "lucide-react";

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Tarjeta Compra */}
                        <div className="bg-gradient-to-br from-primary/10 to-gray-900/10 dark:from-primary/20 dark:to-gray-800/30 rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-primary/30">
                            <div className="flex items-center gap-3 mb-2">
                                <ShoppingCart className="text-primary w-7 h-7" />
                                <span className="text-xl font-bold text-primary">Pago de Compra</span>
                            </div>
                            <ul className="space-y-2 text-base text-gray-700 dark:text-gray-300">
                                <li className="flex items-center gap-2">
                                    <Equal className="text-primary h-5 w-5" />
                                    <span>Costo de los artículos</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Plus className="text-primary h-5 w-5" />
                                    <span>Impuesto de la tienda</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Plus className="text-primary h-5 w-5" />
                                    <span>Impuesto aduanal</span>
                                </li>
                            </ul>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Se paga al realizar el pedido.</strong>
                            </p>
                        </div>
                        {/* Tarjeta Envío */}
                        <div className="bg-gradient-to-br from-blue-100/20 to-primary/10 dark:from-blue-900/10 dark:to-primary/20 rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-blue-300/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Truck className="text-primary w-7 h-7" />
                                <span className="text-xl font-bold text-primary">Pago de Envío</span>
                            </div>
                            <ul className="space-y-2 text-base text-gray-700 dark:text-gray-300">
                                <li className="flex items-center gap-2">
                                    <Equal className="text-primary h-5 w-5" />
                                    <span>Peso del paquete</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Asterisk className="text-primary h-5 w-5" />
                                    <span>Costo de envío</span>
                                </li>
                            </ul>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Se paga al recibir el paquete.</strong>
                            </p>
                        </div>
                    </div>
                    <PurchaseCalculator />
                </div>
            </div>
        </div>
    );
};

export default About;