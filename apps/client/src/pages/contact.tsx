import { Button } from "@/components/ui/button";

export default function Contact() {
    return (
        <div className="isolate px-6 py-24 sm:py-32 lg:px-8 ">
            <div className="mx-auto mt-1/4 max-w-2xl text-center">
                <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl dark:text-white">
                    Contáctenos
                </h2>
                <p className="mt-2 text-lg/8 text-gray-600 dark:text-gray-400">
                    Si tienes preguntas, comentarios o necesitas asistencia,
                    no dudes en ponerte en contacto con nosotros.
                </p>
            </div>
            <form action="#" method="POST" className="mx-auto mt-16 max-w-xl sm:mt-20">
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
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Email
                        </label>
                        <div className="mt-2.5">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="phone-number" className="block text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Teléfono
                        </label>
                        <div className="mt-2.5">
                            <div className="flex rounded-md bg-white outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:has-[input:focus-within]:outline-indigo-500">
                                <div className="grid shrink-0 grid-cols-1 focus-within:relative">

                                </div>
                                <input
                                    id="phone-number"
                                    name="phone-number"
                                    type="text"
                                    placeholder="+123-456-7890"
                                    className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
                                />
                            </div>
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
                                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                defaultValue={''}
                            />
                        </div>
                    </div>

                </div>
                <div className="mt-10">
                    <Button type="submit"
                        className="block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 "
                    >

                        Enviar
                    </Button>
                </div>
            </form>
        </div>
    )
}
