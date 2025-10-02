import { Mail, MapPin, Phone, User2, UserPlus, X } from "lucide-react";
import { Button } from "../ui/button";


export default function Register() {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* We've used 3xl here, but feel free to try other max-widths based on your needs */}
            <form className="mx-auto mt-1/4 py-30 max-w-3xl">
                <div className="space-y-12">
                    <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                        <h2 className="flex flex-row gap-2 text-base/7 font-semibold text-gray-900 dark:text-white">
                            <User2 />
                            Información Personal </h2>

                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="first-name" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Nombres*
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="first-name"
                                        name="first-name"
                                        type="text"
                                        autoComplete="given-name"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orangeo-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Apellidos
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="last-name"
                                        name="last-name"
                                        type="text"
                                        autoComplete="family-name"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="email" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <Phone />
                                    Teléfono*
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="phone"
                                        autoComplete="phone"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="email" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <Mail />
                                    Correo
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-500"
                                    />
                                </div>
                            </div>



                            <div className="col-span-full">
                                <label htmlFor="street-address" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <MapPin />
                                    Dirección
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="street-address"
                                        name="street-address"
                                        type="text"
                                        autoComplete="street-address"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">


                    <Button className="cursor-pointer" variant={"ghost"}>
                        <X />
                        <span>Cancel</span>

                    </Button>
                    <Button className="cursor-pointer">
                        <UserPlus />
                        <span>Registrar</span>
                    </Button>
                </div>
            </form>
        </div>

    )
}
