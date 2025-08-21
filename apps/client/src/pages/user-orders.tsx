'use client'

import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from '@headlessui/react'
import { CalendarDays, CreditCard, EllipsisVertical, UserCircle, } from 'lucide-react'


export default function Example() {

    return (
        <>
            <main>
                <header className="relative isolate pt-16">

                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="mx-auto flex max-w-2xl items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none">
                            <div className="flex items-center gap-x-6">
                                <img
                                    alt=""
                                    src="https://tailwindcss.com/plus-assets/img/logos/48x48/tuple.svg"
                                    className="size-16 flex-none rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                                />
                                <h1>
                                    <div className="text-sm/6 text-gray-500 dark:text-gray-400">
                                        Invoice <span className="text-gray-700 dark:text-gray-300">#00011</span>
                                    </div>
                                    <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">Tuple, Inc</div>
                                </h1>
                            </div>
                            <div className="flex items-center gap-x-4 sm:gap-x-6">
                                <button type="button" className="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white">
                                    Copy URL
                                </button>
                                <a href="#" className="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white">
                                    Edit
                                </a>
                                <a
                                    href="#"
                                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                                >
                                    Send
                                </a>

                                <Menu as="div" className="relative sm:hidden">
                                    <MenuButton className="relative block">
                                        <span className="absolute -inset-3" />
                                        <span className="sr-only">More</span>
                                        <EllipsisVertical aria-hidden="true" className="size-5 text-gray-500 dark:text-gray-400" />
                                    </MenuButton>

                                    <MenuItems
                                        transition
                                        className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                                    >
                                        <MenuItem>
                                            <button
                                                type="button"
                                                className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                                            >
                                                Copy URL
                                            </button>
                                        </MenuItem>
                                        <MenuItem>
                                            <a
                                                href="#"
                                                className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                                            >
                                                Edit
                                            </a>
                                        </MenuItem>
                                    </MenuItems>
                                </Menu>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                        {/* Invoice summary */}
                        <div className="lg:col-start-3 lg:row-end-1">
                            <h2 className="sr-only">Summary</h2>
                            <div className="rounded-lg bg-gray-50 shadow-xs outline-1 outline-gray-900/5 dark:bg-gray-800/50 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                                <dl className="flex flex-wrap">
                                    <div className="flex-auto pt-6 pl-6">
                                        <dt className="text-sm/6 font-semibold text-gray-900 dark:text-white">Amount</dt>
                                        <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">$10,560.00</dd>
                                    </div>
                                    <div className="flex-none self-end px-6 pt-4">
                                        <dt className="sr-only">Status</dt>
                                        <dd className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-green-600/20 ring-inset dark:bg-green-500/10 dark:text-green-500 dark:ring-green-500/30">
                                            Paid
                                        </dd>
                                    </div>
                                    <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6 dark:border-white/10">
                                        <dt className="flex-none">
                                            <span className="sr-only">Client</span>
                                            <UserCircle aria-hidden="true" className="h-6 w-5 text-gray-400 dark:text-gray-500" />
                                        </dt>
                                        <dd className="text-sm/6 font-medium text-gray-900 dark:text-white">Alex Curren</dd>
                                    </div>
                                    <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
                                        <dt className="flex-none">
                                            <span className="sr-only">Due date</span>
                                            <CalendarDays aria-hidden="true" className="h-6 w-5 text-gray-400 dark:text-gray-500" />
                                        </dt>
                                        <dd className="text-sm/6 text-gray-500 dark:text-gray-400">
                                            <time dateTime="2023-01-31">January 31, 2023</time>
                                        </dd>
                                    </div>
                                    <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
                                        <dt className="flex-none">
                                            <span className="sr-only">Status</span>
                                            <CreditCard aria-hidden="true" className="h-6 w-5 text-gray-400 dark:text-gray-500" />
                                        </dt>
                                        <dd className="text-sm/6 text-gray-500 dark:text-gray-400">Paid with MasterCard</dd>
                                    </div>
                                </dl>
                                <div className="mt-6 border-t border-gray-900/5 px-6 py-6 dark:border-white/10">
                                    <a href="#" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                        Download receipt <span aria-hidden="true">&rarr;</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
