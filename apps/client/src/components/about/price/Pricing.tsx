import { CheckIcon } from "lucide-react"


const tiers = [
  {
    name: 'Medicamentos, Aseo y Alimentos',
    id: 'tier-med',
    href: '#',
    priceMonthly: '$6',
    description: "Esta categoría incluye tanto medicamentos de venta libre como: ",
    features: [
      'Analgesicos',
      'Descongestionantes',
      'Complejos vitaminicos',
      'Tratamientos para la piel',
      'Productos de higiene personal',
      'Alimentos no perecederos',
    ],
    featured: false,
  },
  {
    name: 'Miscelaneas',
    id: 'tier-misc',
    href: '#',
    priceMonthly: '$7',
    description: 'Esto puede abarcar una infinidad de productos de todo tipo.',
    features: [
      'Artículos de limpieza',
      'Productos de cuidado infantil',
      'Accesorios para el hogar',
      'Productos de entretenimiento',
      'Ropa y accesorios',
      'Artículos deportivos',
    ],
    featured: true,
  },
  {
    name: 'Electrónicos',
    id: 'tier-elect',
    href: '#',
    priceMonthly: '$8',
    description: 'Esta categoría abarca una amplia gama de dispositivos y accesorios tecnológicos.',
    features: [
      'Productos de tecnología',
      'Repuestos para vehículos',
      'Electrodomésticos pequeños',
      'Gadgets y dispositivos',
      'Accesorios electrónicos',
      'Herramientas eléctricas',
    ],
    featured: false,
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Pricing() {
  return (
    <div className="relative isolate px-6 lg:px-8 flex flex-col gap-y-3 ">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-semibold text-primary">
          Precios</h1>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl dark:text-white">
          De acuerdo a la categoría de los productos
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">
        Elige la categoría de los productos que desea encargar.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-x-2 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
        {tiers.map((tier,) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured
                ? 'relative bg-black/50 shadow-none'
                : 'sm:mx-8 lg:mx-0 bg-white/2.5 hover:bg-white/5',
              tier.featured
                ? ''
                : '',
              'rounded-3xl p-8 ring-1 sm:p-10 ring-white/10',
              // Hover effect: escala y z-index
              'relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl',
              // Border radius uniforme en hover
              'hover:rounded-3xl h-full ',
              // z-index base para no interferir
              'z-10',
            )}
          >
            <h3
              id={tier.id}
              className={'text-base/7 font-semibold text-primary'}
            >
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900 dark:text-white',
                  'text-5xl font-semibold tracking-tight',
                )}
              >
                {tier.priceMonthly}
              </span>
              <span
                className={classNames(
                  tier.featured ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400',
                  'text-base',
                )}
              >
                USD/Lb
              </span>
            </p>
            <p
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300',
                'mt-6 text-base/7',
              )}
            >
              {tier.description}
            </p>
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300',
                'mt-8 space-y-3 text-sm/6 sm:mt-10',
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    aria-hidden="true"
                    className={'h-6 w-5 flex-none text-primary'}
                  />
                  {feature}
                </li>
              ))}
            </ul>

          </div>
        ))}
      </div>
    </div>
  )
}
