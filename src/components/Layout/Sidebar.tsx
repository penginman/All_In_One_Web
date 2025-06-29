import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  BookOpenIcon, 
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAppContext } from '../../context/AppContext'

const navigationItems = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '学习', href: '/learning', icon: BookOpenIcon },
  { name: '代办', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: '日程', href: '/calendar', icon: CalendarIcon },
  { name: '习惯', href: '/habits', icon: CheckCircleIcon },
  { name: '设置', href: '/settings', icon: Cog6ToothIcon },
]

function Sidebar() {
  const { state, dispatch } = useAppContext()
  const location = useLocation()

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-blue-50 border-r border-blue-100 transition-all duration-300 ease-in-out z-10 ${
        state.sidebarCollapsed ? 'w-14' : 'w-40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100 h-16">
        {!state.sidebarCollapsed && (
          <h1 className="text-lg font-semibold text-blue-800 truncate">效率工具</h1>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0"
          title={state.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {state.sidebarCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1 px-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
              title={state.sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!state.sidebarCollapsed && (
                <span className="ml-3 truncate">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar
