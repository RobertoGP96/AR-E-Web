import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCategories } from "@/hooks/useCategories"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Pricing() {
  const { categories, isLoading } = useCategories()

  return (
    <div className="relative isolate px-6 lg:px-8 flex flex-col gap-y-3 ">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-semibold text-primary">
          Precios</h1>
        <p className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-white">
          De acuerdo a la categoría de los productos
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">
        Elige la categoría de los productos que desea encargar.
      </p>

      {isLoading ? (
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-x-2 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl p-8 sm:p-10 ring-1 ring-white/10 bg-white/2.5 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-x-2 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {categories.map((category, index) => {
            const isFeatured = categories.length >= 3 && index === Math.floor(categories.length / 2)
            return (
              <div
                key={category.id}
                className={classNames(
                  isFeatured
                    ? 'relative bg-black/50 shadow-none'
                    : 'sm:mx-8 lg:mx-0 bg-white/2.5 hover:bg-white/5',
                  'rounded-3xl p-8 ring-1 sm:p-10 ring-white/10',
                  'relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl',
                  'hover:rounded-3xl h-full',
                  'z-10',
                )}
              >
                <h3 className="text-base/7 font-semibold text-primary">
                  {category.name}
                </h3>
                <p className="mt-4 flex items-baseline gap-x-2">
                  <span
                    className={classNames(
                      isFeatured ? 'text-white' : 'text-gray-900 dark:text-white',
                      'text-5xl font-semibold tracking-tight',
                    )}
                  >
                    ${category.client_shipping_charge}
                  </span>
                  <span
                    className={classNames(
                      isFeatured ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400',
                      'text-base',
                    )}
                  >
                    USD/Lb
                  </span>
                </p>
                <p
                  className={classNames(
                    isFeatured ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300',
                    'mt-6 text-base/7',
                  )}
                >
                  Tarifa de envío para productos en la categoría {category.name}.
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 w-full flex justify-center items-center">
        <Card className="w-full bg-white/2.5 border-0 hover:bg-white/5 ring-1 ring-white/10 rounded-3xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary font-bold tracking-tight">
              Envío por carga
            </CardTitle>
            <CardDescription>
              Esta categoría de servicio de envío representa una solución económica pero con
              tiempos de entrega más extensos. Abarca todos los artículos de las categorías de envío previas, con una característica
              distintiva fundamental: la utilización del transporte marítimo como medio principal de traslado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm  flex items-end leading-6">
            <span className="text-4xl leading-none font-bold">
              $4
            </span>
            <span className="ml-0.5 mr-1.5">USD/Lb</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
