// src/hocs/layouts/NutriLayout.jsx
import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarNutri from "../../components/navigation/sidebars/SidebarNutri";
import { useDispatch } from "react-redux";
import { logout, fetchMe } from "../../features/auth/authSlice";

export default function NutriLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                dispatch(fetchMe());
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logout());
        setSidebarOpen(false);
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-white">
        {/* Sidebar móvil */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
            <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 bg-gray-600/75" />
            </Transition.Child>

            <div className="fixed inset-0 z-40 flex">
                <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
                >
                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                        type="button"
                        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="sr-only">Cerrar sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                    </div>

                    <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                    <div className="flex flex-shrink-0 items-center px-4">
                        <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                        alt="Your Company"
                        />
                    </div>
                    <nav className="mt-5 space-y-1 px-2">
                        <SidebarNutri />
                    </nav>
                    </div>

                    {/* Pie móvil con logout */}
                    <div className="border-t border-gray-200 p-4">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Cerrar sesión
                    </button>
                    </div>
                </Dialog.Panel>
                </Transition.Child>
                <div className="w-14 flex-shrink-0" />
            </div>
            </Dialog>
        </Transition.Root>

        {/* Sidebar desktop */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-gray-200 bg-white">
            <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                    alt="Your Company"
                />
                </div>
                <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                <SidebarNutri />
                </nav>
            </div>

            {/* Pie desktop con logout */}
            <div className="border-t border-gray-200 p-4">
                <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium"
                >
                Cerrar sesión
                </button>
            </div>
            </div>
        </div>

        {/* Botón abrir sidebar en móvil */}
        <div className="md:pl-64">
            <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
            <button
                type="button"
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Abrir sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            </div>

            {/* Contenido */}
            <main className="min-h-screen">
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <Outlet />
                </div>
            </div>
            </main>
        </div>
        </div>
    );
}
