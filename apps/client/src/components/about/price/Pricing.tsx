import { CheckIcon } from "lucide-react"


const tiers = [
  {
    name: 'Medicamentos, Aseo y Alimentos',
    id: 'tier-med',
    href: '#',
    priceMonthly: '$6',
    description: "Esta categoría incluye tanto medicamentos de venta libre. ",
    features: [
      'Analgesicos',
      'Descongestionantes',
      'Complejos vitaminicos',
      'Tratamientos para la piel',
      'Productos de higiene personal',
    ],
    featured: false,
  },
  {
    name: 'Miscelaneas',
    id: 'tier-misc',
    href: '#',
    priceMonthly: '$8',
    description: 'Esto puede abarcar una infinidad de productos de todo tipo.',
    features: [
      'Artículos de limpieza',
      'Productos de cuidado infantil',
      'Repuestos para vehiculos',
      'Accesorios para el hogar',
      'Productos de tecnología',
      'Productos de entretenimiento',
    ],
    featured: true,
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Pricing() {
  return (
    <div className="relative isolate px-6 lg:px-8 ">
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-1155/678 w-288.75 bg-linear-to-tr from-[#ffab4a] to-[#e67519] opacity-30 dark:opacity-20"
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-semibold text-primary">
          Precios</h1>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl dark:text-white">
          Deacuerdo a la categoria de los productos
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">
        Seleciona la categoria de los productos que desea encargar.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured
                  ? 'relative bg-black/50 shadow-none'
                  : 'sm:mx-8 lg:mx-0 bg-white/2.5 hover:bg-white/5',
                tier.featured
                  ? ''
                  : tierIdx === 0
                    ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                    : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
                'rounded-3xl p-8 ring-1 sm:p-10 ring-white/10',
                // Hover effect: escala y z-index
                'relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl',
                // Border radius uniforme en hover
                'hover:rounded-3xl',
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
