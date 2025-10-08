import OrderDetails from "@/components/order/order-details";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { Send } from "lucide-react";
import { useEffect, useState } from 'react';

export default function Contact() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const order: Order = {
        id: 12024001,
        status: "Completado",
        pay_status: "Pagado",
        delivery: [
            {
                id: 1,
                order: 12024001,
                weight: 2.5,
                products_delivered: [
                    {
                        original_product: 1,
                        amount_delivered: 1,
                        created_at: "2024-01-20T10:00:00Z",
                        updated_at: "2024-01-20T10:00:00Z",
                        id: 0,
                        order: 0,
                        reception_date_in_eeuu: "",
                        package_where_was_send: 11,
                        amount_received: 0
                    }
                ],
                        status: "Entregado",
                        deliver_date: "2024-01-20T10:30:00Z",
                        deliver_picture: [],
                        total_cost_of_deliver: 1500,
                        created_at: "2024-01-18T09:00:00Z",
                updated_at: "2024-01-20T12:00:00Z",
                weight_cost: 1200,
                manager_profit: 300
            }
        ],
        products: [
            {
                id: "prod-001",
                sku: "PREM-A-001",
                name: "Producto Premium A",
                link: "https://example.com/producto-a",
                amount_delivered: 2,
                amount_purchased: 4,
                created_at: "2024-01-15T10:00:00Z",
                updated_at: "2024-01-18T12:00:00Z",
                is_fully_delivered: false,
                is_fully_purchased: true,
                pending_delivery: 2,
                pending_purchase: 0,
                shop: {
                    id: 1,
                    name: "Amazon",
                    created_at: "2023-01-01T00:00:00Z",
                    updated_at: "2024-01-10T00:00:00Z",
                    is_active: true,
                    link: "https://amazon.com",
                },
                description: "Producto de alta calidad con características premium",
                observation: "",
                category: "Electrónicos",
                amount_requested: 2,
                order: {} as Order, // Referencia circular simplificada
                status: "Procesando",
                product_pictures: [
                    {
                        id: 1,
                        image_url: "https://placehold.co/400x400",
                        description: "Vista frontal del producto",
                        created_at: "2024-01-15T10:05:00Z",
                        updated_at: "2024-01-15T10:05:00Z"
                    }
                ],
                shop_cost: 4500,
                shop_delivery_cost: 800,
                shop_taxes: 450,
                own_taxes: 300,
                added_taxes: 200,
                total_cost: 6250
            },
            {
                id: "prod-002",
                sku: "STAN-B-002",
                name: "Producto Estándar B",
                shop: {
                    id: 2,
                    name: "eBay",
                    created_at: "2023-05-01T00:00:00Z",
                    updated_at: "2024-01-10T00:00:00Z",
                    is_active: true,
                    link: "https://ebay.com",
                },
                description: "Producto de calidad estándar para uso diario",
                category: "Hogar",
                amount_requested: 1,
                order: {} as Order,
                status: "Procesando",
                amount_delivered: 0,
                amount_purchased: 1,
                created_at: "2024-01-15T11:00:00Z",
                updated_at: "2024-01-18T13:00:00Z",
                is_fully_delivered: false,
                is_fully_purchased: true,
                pending_delivery: 1,
                pending_purchase: 0,
                product_pictures: [],
                shop_cost: 2800,
                shop_delivery_cost: 600,
                shop_taxes: 280,
                own_taxes: 200,
                added_taxes: 150,
                total_cost: 4030
            }
        ],
        total_cost: 10280,
        received_value_of_client: 8000,
        extra_payments: 2280,
        client: {
            id: 1,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-10T00:00:00Z",
            email: "juan.perez@example.com",
            name: "Juan",
            last_name: "Pérez",
            home_address: "Calle Principal 123, Madrid, España",
            phone_number: "+34 123 456 789",
            role: "client" as const,
            agent_profit: 0,
            is_staff: false,
            is_active: true,
            is_verified: true,
            date_joined: "2024-01-01T00:00:00Z",
            sent_verification_email: true,
            full_name: "Juan Pérez"
        },
        sales_manager: {
            id: 2,
            created_at: "2023-06-01T00:00:00Z",
            updated_at: "2024-01-10T00:00:00Z",
            email: "maria.garcia@company.com",
            name: "María",
            last_name: "García",
            home_address: "Oficina Central",
            phone_number: "+34 987 654 321",
            role: "agent" as const,
            agent_profit: 10.0,
            is_staff: true,
            is_active: true,
            is_verified: true,
            date_joined: "2023-06-01T00:00:00Z",
            sent_verification_email: true,
            full_name: "María García"
        },

        total_products_delivered: 1,
        total_products_purchased: 3,
        total_products_requested: 3,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-20T12:00:00Z"
    }

    return (
        <div className="isolate px-6 py-24 sm:py-32 lg:px-8 animate-fade-in">
            <div className="mx-auto mt-1/4 max-w-2xl text-center">
                <h2 className={`text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl dark:text-white transition-all duration-1000 ${
                    isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                }`}>
                    Contáctenos
                </h2>
                <p className={`mt-6 text-justify text-lg leading-relaxed text-gray-700 dark:text-gray-300 transition-all duration-1000 delay-300 ${
                    isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                }`}>
                    Si tienes preguntas, comentarios o necesitas asistencia, no dudes en ponerte en contacto con nosotros.
                    Nuestro equipo está disponible para ayudarte y responder todas tus inquietudes.
                    Valoramos tu opinión y buscamos ofrecerte la mejor experiencia posible.
                    Completa el formulario y te responderemos a la brevedad.
                </p>
            </div>
            <form action="#" method="POST" className={`mx-auto mt-16 max-w-xl sm:mt-20 transition-all duration-1000 delay-500 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first-name" className="block text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Nombres
                        </label>
                        <div className="mt-2.5">
                            <input
                                id="first-name"
                                name="first-name"
                                type="text"
                                autoComplete="given-name"
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 "
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="last-name" className="block text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Apellidos
                        </label>
                        <div className="mt-2.5">
                            <input
                                id="last-name"
                                name="last-name"
                                type="text"
                                autoComplete="family-name"
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                            />
                        </div>
                    </div>



                    <div className="sm:col-span-2">
                        <label htmlFor="message" className="block text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Message
                        </label>
                        <div className="mt-2.5">
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                defaultValue={''}
                            />
                        </div>
                    </div>

                </div>
                <div className={`mt-10 transition-all duration-1000 delay-700 ${
                    isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                }`}>
                    <Button type="submit"
                        className="flex flex-row gap-2 w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:scale-105 transition-all duration-300 group btn-hover-glow"
                    >
                        <Send className="group-hover:translate-x-1 transition-transform duration-300" />
                        <span>
                            Enviar
                        </span>
                    </Button>
                </div>
            </form>

            <div className="mx-auto mt-32 max-w-2xl text-center">
                <OrderDetails order={order} />

            </div>
        </div>
    )
}
