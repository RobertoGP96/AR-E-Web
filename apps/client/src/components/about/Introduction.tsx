import { Clock, Info, ShieldCheck, HelpCircle, CheckCircle, HandHeart, Package, AlertTriangle, Pill, Calculator, MapPin, ShoppingCart, Truck, UserPlus, CigaretteIcon, Volume2Icon, Drone, Wifi, FlameKindling, Telescope, BowArrow, Smartphone, Compass, ShoppingBag, CircleCheckBigIcon, Zap } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import React, { useEffect, useState } from "react";

const steps = [
  {
    step: 1,
    icon: Smartphone,
    title: "Instalación",
    description: "Descargue e instale la aplicación de la tienda en la que deseas comprar usando Play Store o Apple Store"
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Registro",
    description: "Regístrese o inicie sesión en una cuenta usando una dirección de correo electrónico."
  },
  {
    step: 3,
    icon: Compass,
    title: "Exploración",
    description: "Navegue en la aplicación de la tienda para encontrar lo que quieres comprar."
  },
  {
    step: 4,
    icon: ShoppingCart,
    title: "Selección",
    description: "Añada los artículos al carrito, selecciona talla, color o cualquier especificación que nos ayude a identificar lo q quieres."
  },
  {
    step: 5,
    icon: ShoppingBag,
    title: "Captura",
    description: "Compártenos tu carrito para nosotros poder comprarlo por ti."
  },
  {
    step: 6,
    icon: Calculator,
    title: "Facturación",
    description: "Obtiene la factura del pedido y realiza su pago"
  },
  {
    step: 7,
    icon: CircleCheckBigIcon,
    title: "Despacho",
    description: "Nuestros gestores le informarán en cuanto el pedido este listo para ser recogido."
  },
  {
    step: 8,
    icon: MapPin,
    title: "Entrega",
    description: "Una vez listo para recoger puede pasar a buscar su pedido y pagar el costo de envio."
  }
]
const warningList = [
  {
    icon: CigaretteIcon,
    text: "Vapes 🚬",
  },
  {
    icon: Telescope,
    text: "Mirillas (telescopio)",
  },
  {
    icon: Volume2Icon,
    text: "Megáfonos",
  },
  {
    icon: BowArrow,
    text: "Valines, municiones",
  },
  {
    icon: Drone,
    text: "Artículos que vuelen ",
  },
  {
    icon: Wifi,
    text: "Cualquier artículo relacionado con las conexiones inalámbricas como: router, repartidores de señal..",
  },
  {
    icon: Zap,
    text: "Taser",
  },
  {
    icon: FlameKindling,
    text: "Objetos inflamables",
  }
  ,

]

export default function Introduction() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: "beneficios", label: "Beneficios" },
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
      <nav className="md:sticky md:top-8 md:self-start md:w-64 p-6 mb-4 md:mb-0 z-10">
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
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Envios rápidos y seguros
                </strong>
                , recibe tus compras sin complicaciones.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Tarifas claras y competitivas
                </strong>
                , ahorra reduciendo costos de excesivos de envíos.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Variedad de métodos de pagos
                </strong>
                , con el objetivo de facilitar el acceso a tus artículos.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Amplia red de tiendas online
                </strong>
                , compra desde las tiendas más populares.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Atención personalizada
                </strong>
                , te guiamos paso a paso para que tu compra llegue sin complicaciones.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 min-w-5" />
              <span>
                <strong className="text-primary">
                  Experiencia y confianza
                </strong>
                , reconocidos por clientes fieles que repiten sus compras por la seguridad y el trato cercano.

              </span>
            </li>
          </ul>
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

            <div className="mt-4 flex flex-col sm:fles-row items-center gap-3 flex-wrap justify-between  bg-gray-600/20 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold text-gray-200">
                  Horario
                </span>
              </div>
              <span className="bg-primary/20 text-primary px-4 py-2 rounded-full text-xl  md:text-3xl font-bold">
                08:00 a.m. - 06:00 p.m.
              </span>
            </div>
          </div>
        </div>
        {/* Cómo funciona */}
        <div id="como-funciona" className="how-it-works">
          <div className="container mx-auto px-4 space-y-6">
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
            <div className="border border-blue-100 dark:border-primary/50 rounded-lg p-4 flex items-center gap-3">
              <Truck className="w-6 h-6 text-primary shrink-0" />
              <p className="text-gray-800 dark:text-gray-200 text-sm">
                Puede solicitar al gestor nuestro servicio de domicilio  ya sea para realizar los pagos y la entrega de su pedido.
              </p>
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
                  <p>Evite enviar artículos prohibidos o restringidos. Asegúrese de cumplir con las regulaciones de importación.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Compra Previsoria
                  </h4>
                  <p>Realice tus compras con suficiente tiempo de antelación para evitar complicaciones ajenas a nuestro servicio y sus pedidos puedan llegar en a tiempo</p>
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
                  <p>Para medicamentos y alimentos, asegúrese de cumplir estrictamente con los requisitos sanitarios y de importación.</p>
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
                  <p>Al recibir tu envío, revise inmediatamente y reporte cualquier empaque dañado o discrepancia para una rápida resolución.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="border border-blue-100 dark:border-primary/50 rounded-lg p-4 flex items-center gap-3">
            <Info className="w-6 h-6 text-primary shrink-0" />
            <p className="text-gray-800 dark:text-gray-200 text-sm">
              Estas recomendaciones ayudan a garantizar un proceso de envío seguro y sin complicaciones. Ante cualquier duda, nuestro equipo está disponible para asesorarl@.
            </p>
          </div>
        </div>


        {/* Articulos Prohibidos */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Artículos Prohibidos
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningList.map((item) => (<li className="flex items-center group justify-start gap-3">
              <span className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <item.icon className="text-primary group-hover:scale-110 w-8 h-8 transition-transform" />
              </span>
              <span className="font-semibold text-gray-200 group-hover:text-white mb-1">
                {item.text}
              </span>
            </li>
            ))
            }
          </ul>
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
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                ¿Cuánto tarda en llegar mi paquete?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Una vez el paquete este entregado en EEUU,
                el pedido estará listo para ser recogido por usted en el plazo <span className="font-bold text-primary">de 3 a 5 días.</span>
                El tiempo total va a depender de la demora de entrega de la tienda a nuestro almacén en EEUU.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-2"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                ¿Que hago si mi paquete llega dañado o me faltan articulos?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Debe contactar de inmediato con el gestor de compras para realizar una investigación y darle solución lo antes posible a su problema.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-3"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                ¿Que seguridad tengo de que mis compras llegaran a mis manos?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 text-base leading-relaxed">
                Llevamos años trabajando en compras online, tenemos una amplia comunidad de clientes fieles q repiten sus compras, puede solocitar referencias e
                indagar antes de realizar su pedido. Puede estar seguro q nuestro equipo trabaja mano a mano para asegurar ma felicidad de nuestros clientes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-4"
              className="border-b border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                ¿Como debo realizar el pago de mi compra?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Una vez el gestor genere su factura, debera pagar el <span className="font-bold text-primary">100%</span> de esta para q su compra sea realizada. El costo de envio de su paquete debe pagarlo cuando se le sea entregado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-5"
              className="border-b border-gray-200 dark:border-gray-700 pb-4"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                ¿Puedo traer con ustedes paquetes que ya tengo comprados o q mi familiar en EEUU quiere mandarme?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Por supuesto q si, le facilitamos la dirección a la que deben mandar el paquete, debe enviarnos fotos y todos los articulos que desee traer con nosotros.
                Una vez lo recibamos lo procesamos y en menos de 5 dias lo tiene listo para recogerlo.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </section>
    </div>
  );
}
