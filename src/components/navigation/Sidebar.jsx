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
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom';









const navigation = [
    { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
    { name: 'Consulta', href: '#', icon: RssIcon, current: false },

]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function Sidebar() {
    return (
        <div>
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        href={item.href}
                        className={classNames(
                        item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                    >
                        <item.icon
                        className={classNames(
                            item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                        />
                        {item.name}
                    </NavLink>
                ))}
        </div>
    )
}    

export default Sidebar;