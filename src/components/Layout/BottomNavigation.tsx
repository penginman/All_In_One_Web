import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  BookOpenIcon, 
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  CalendarIcon as CalendarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid'

const navigationItems = [
  { 
    name: '首页', 
    href: '/', 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid 
  },
  { 
    name: '学习', 
    href: '/learning', 
    icon: BookOpenIcon, 
    activeIcon: BookOpenIconSolid 
  },
  { 
    name: '代办', 
    href: '/tasks', 
    icon: ClipboardDocumentListIcon, 
    activeIcon: ClipboardDocumentListIconSolid 
  },
  { 
    name: '日程', 
    href: '/calendar', 
    icon: CalendarIcon, 
    activeIcon: CalendarIconSolid 
  },
  { 
    name: '习惯', 
    href: '/habits', 
    icon: CheckCircleIcon, 
    activeIcon: CheckCircleIconSolid 
  },
  { 
    name: '设置', 
    href: '/settings', 
    icon: Cog6ToothIcon, 
    activeIcon: Cog6ToothIconSolid 
  },
]

function BottomNavigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-6 h-16 safe-area-inset-left safe-area-inset-right">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href
          const IconComponent = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center px-1 py-2 transition-all duration-200 touch-target btn-touch ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100 active:text-gray-900'
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1 transition-transform duration-150" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
