import {
    Bars3Icon,
    CalendarIcon,
    ChartBarIcon,
    FolderIcon,
    HomeIcon,
    InboxIcon,
    UsersIcon,
    RssIcon,
    XMarkIcon,
    CogIcon,
} from '@heroicons/react/24/outline'
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
    { name: 'Dashboard', href: '/panel/nutri', icon: HomeIcon },
    { name: 'Pacientes', href: '/panel/nutri/pacientes', icon: UsersIcon },
    { name: 'Consultas', href: '/panel/nutri/consultas', icon: RssIcon },
    { name: 'Configuración', href: '/panel/nutri/configuracion', icon: CogIcon },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function Sidebar() {
    const location = useLocation();

    return (
        <div>
            {navigation.map((item) => {
                const current = location.pathname === item.href;
                return (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={classNames(
                        current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                    >
                        <item.icon
                        className={classNames(
                            current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                        />
                        {item.name}
                    </NavLink>
                )
            })}
        </div>
    )
}    

export default Sidebar;