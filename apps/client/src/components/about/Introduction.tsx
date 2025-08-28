import { Clock, Info, ShieldCheck, HelpCircle, CheckCircle, HandHeart, LucideCircleDollarSign, Package, AlertTriangle, FileText, Pill, Calculator, HeadsetIcon, MapPin, Send, ShoppingCart, Truck, UserPlus, Warehouse } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import React, { useEffect, useState } from "react";
import PayMethods from "./price/pay-methods";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Registro",
    description: "Regístrate y recibe tu dirección internacional exclusiva."
  },
  {
    step: 2,
    icon: ShoppingCart,
    title: "Compra",
    description: "Realiza tu compra en tiendas online usando la dirección proporcionada."
  },
  {
    step: 3,
    icon: Send,
    title: "Notificación",
    description: "Envía la notificación con el número de guía y detalles del pedido."
  },
  {
    step: 4,
    icon: Warehouse,
    title: "Recepción",
    description: "Recepción y verificación del paquete en nuestra bodega."
  },
  {
    step: 5,
    icon: Package,
    title: "Consolidación",
    description: "Consolidación opcional de varios paquetes para optimizar costos."
  },
  {
    step: 6,
    icon: Calculator,
    title: "Cotización",
    description: "Generamos cotización y confirmamos pago según peso total."
  },
  {
    step: 7,
    icon: Truck,
    title: "Despacho",
    description: "Realizamos despacho con seguimiento local en tiempo real."
  },
  {
    step: 8,
    icon: MapPin,
    title: "Entrega",
    description: "Entregamos a domicilio dentro del plazo estimado."
  },
  {
    step: 9,
    icon: HeadsetIcon,
    title: "Soporte",
    description: "Brindamos soporte post-entrega para cualquier consulta."
  }
]

export default function Introduction() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: "beneficios", label: "Beneficios" },
    { id: "metodos-pago", label: "Métodos de pago" },
    { id: "horario", label: "Horario de atención" },
    { id: "como-funciona", label: "Cómo funciona" },
    { id: "recomendaciones", label: "Recomendaciones" },
    { id: "faq", label: "Preguntas frecuentes" }
  ];

  const handleIndexClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();

    // Desplazamiento suave
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Actualizar sección activa
      setActiveSection(sectionId);
    }
  };

  // Efecto para rastrear la sección actual al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;

          if (
            scrollPosition >= elementTop - 100 &&
            scrollPosition < elementTop + elementHeight - 100
          ) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    // Añadir evento de scroll
    window.addEventListener('scroll', handleScroll);

    // Limpiar evento al desmontar
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  },);

  return (
    <div className="space-y-10 relative flex flex-col md:flex-row max-w-5xl mx-auto scroll-smooth">
      {/* Índice fijo */}
      <nav className="md:sticky md:top-8 md:self-start md:w-64 rounded-xl shadow-lg p-6 mb-4 md:mb-0 z-10">
        <h4 className="text-xl text-primary uppercase font-extrabold mb-4 tracking-wide">
          Índice
        </h4>
        <ul className="space-y-2">
          {sections.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleIndexClick(e, id)}
                className={`block pl-4 py-2 rounded-md transition-all duration-200 ease-in-out
                ${activeSection === id
                    ? "text-primary bg-primary/10 font-semibold border-l-4 border-primary"
                    : "text-gray-300 hover:bg-gray-600/20"
                  }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {/* Contenido principal */}
      <section
        className="rounded-xl p-10 flex-1 space-y-12 prose prose-lg prose-gray dark:prose-invert"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Título principal */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
            Servicio de recepción y envío de compras internacionales
          </h2>
        </div>

        {/* Descripción del servicio */}
        <p className="text-gray-700 dark:text-gray-300 text-xl leading-relaxed indent-8">
          Ofrecemos un servicio seguro y sencillo para recibir y entregar las compras que realices en tiendas internacionales (<span className="font-semibold">Shein, Temu, Amazon, AliExpress</span> y otras). Nos encargamos de recibir tus paquetes en el exterior, gestionarlos y entregarlos en tu domicilio con rapidez y seguimiento personalizado.
        </p>

        {/* Beneficios */}
        <div id="beneficios" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <HandHeart className="text-primary" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">
              Beneficios
            </h3>
          </div>
          <ul className="space-y-3 list-disc pl-8 text-lg">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Envios rápidos y seguros, recibe tus compras sin complicaciones.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tarifas claras y competitivas, ahorra reduciendo costos de excesivos de envíos.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Variedad de métodos de pagos, con el objetivo de facilitar el acceso a tus artículos.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Amplia red de tiendas online, compra desde las tiendas más populares.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Atención personalizada, te guiamos paso a paso para que tu compra llegue sin complicaciones
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>
                Experiencia y confianza, reconocidos por clientes fieles que repiten sus compras por la seguridad y el trato cercano.

              </span>
            </li>
          </ul>
        </div>

        {/* Métodos de pago */}
        <div id="metodos-pago" className=" p-6 ">
          <div className="flex items-center space-x-4 mb-6">
            <LucideCircleDollarSign className="w-10 h-10 text-primary-600 dark:text-primary-400 stroke-current" />
            <h3 className="text-3xl font-black text-white tracking-tight">
              Métodos de Pago
            </h3>
          </div>
          <PayMethods />
        </div>

        {/* Horario de atención */}
        <div id="horario" className="w-full rounded-xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="w-full p-5 border-b border-gray-500/20 ">
            <div className="w-full flex items-center space-x-4">
              <h3 className="text-3xl font-black text-white tracking-tight">
                Horario de Atención
              </h3>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-semibold text-gray-300">
                  Días de servicio
                </span>
              </div>
              <span className="bg-primary-100 dark:bg-primary-900 text-primary px-3 py-1 rounded-full font-bold">
                Lunes a Domingo
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between bg-gray-600/20 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold text-gray-200">
                  Horario
                </span>
              </div>
              <span className="bg-primary/20 text-primary px-4 py-2 rounded-full text-lg font-bold">
                08:00 a.m. - 06:00 p.m.
              </span>
            </div>
          </div>
        </div>
        {/* Cómo funciona */}
        <div id="como-funciona" className="how-it-works">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white text-center">
              Cómo Funciona Nuestro Servicio
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className=" rounded-xl p-6 border border-gray-600/50 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                      <item.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col gap-1 justify-center items-start">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white line-clamp-2">
                        Paso {item.step}
                      </h3>
                      <span className="text-primary">
                        {item.title}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-base flex-grow line-clamp-4">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Recomendaciones y condiciones */}
        <div id="recomendaciones" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="text-primary w-8 h-8" />
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Recomendaciones y condiciones
            </h3>
          </div>

          <div className="rounded-xl p-6 shadow-sm">
            <ul className="space-y-4 text-gray-700 dark:text-gray-300 text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Contenido del Paquete
                  </h4>
                  <p>Evita enviar artículos prohibidos o restringidos. Asegúrate de cumplir con las regulaciones de importación.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Declaración Precisa
                  </h4>
                  <p>Declara correctamente el contenido y valor del paquete para evitar retrasos o problemas aduaneros.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">
                  <Pill className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Productos Especiales
                  </h4>
                  <p>Para medicamentos y alimentos, asegúrate de cumplir estrictamente con los requisitos sanitarios y de importación.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Verificación de Paquetes
                  </h4>
                  <p>Al recibir tu envío, revisa inmediatamente y reporta cualquier empaque dañado o discrepancia para una rápida resolución.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="border border-blue-100 dark:border-primary/50 rounded-lg p-4 flex items-center gap-3">
            <Info className="w-6 h-6 text-primary shrink-0" />
            <p className="text-gray-800 dark:text-blue-200 text-sm">
              Estas recomendaciones ayudan a garantizar un proceso de envío seguro y sin complicaciones. Ante cualquier duda, nuestro equipo está disponible para asesorarte.
            </p>
          </div>
        </div>

        {/* Preguntas frecuentes */}
        <div id="faq" className="space-y-6">
          <div className="flex items-center gap-3 mb-10">
            <HelpCircle className="text-primary w-8 h-8" />
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Preguntas frecuentes
            </h3>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full max-w-3xl mx-auto space-y-4"
          >
            <AccordionItem
              value="faq-1"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                ¿Cuánto tarda en llegar mi paquete?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                El tiempo de entrega depende del país de origen y la tienda, pero normalmente tu paquete llega en un plazo de <span className="font-bold text-primary">10 a 20 días hábiles</span> desde que es recibido en nuestra bodega internacional. Te notificamos cada etapa y puedes consultar el estado en cualquier momento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-2"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                ¿Puedo consolidar paquetes?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Sí, ofrecemos la opción de <span className="font-semibold">consolidar varios paquetes</span> en un solo envío para reducir costos. Solo debes indicarlo al momento de notificar tus compras y te ayudamos a agruparlos antes de despachar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-3"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                ¿Qué hago si mi paquete llega dañado?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Si tu paquete presenta daños al recibirlo, <span className="font-semibold text-primary">repórtalo de inmediato</span> con fotos y detalles. Te ayudaremos a gestionar el reclamo con la tienda o el seguro para buscar una solución rápida.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </section>
    </div>
  );
}
