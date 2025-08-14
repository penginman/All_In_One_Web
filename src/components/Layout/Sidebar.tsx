import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { useAppContext } from '../../context/AppContext'
import { useIsMobile } from '../../hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  // 移动端不显示侧边栏
  if (isMobile) {
    return null
  }

  const getSyncStatusIcon = () => {
    if (!state.gitConnected) {
      return null
    }

    if (state.syncStatus === 'syncing') {
      return (
        <ArrowPathIcon 
          className="w-4 h-4 text-blue-500 animate-spin" 
          title="同步中..."
        />
      )
    }

    if (state.pendingChanges) {
      return (
        <CloudArrowUpIcon 
          className="w-4 h-4 text-orange-500 animate-pulse" 
          title="有待同步的更改"
        />
      )
    }

    if (state.syncStatus === 'success') {
      return (
        <CheckBadgeIcon 
          className="w-4 h-4 text-green-500" 
          title="同步成功"
        />
      )
    }

    if (state.syncStatus === 'error') {
      return (
        <ExclamationTriangleIcon 
          className="w-4 h-4 text-red-500" 
          title="同步失败"
        />
      )
    }

    return (
      <CloudIcon 
        className="w-4 h-4 text-gray-400" 
        title="云同步已连接"
      />
    )
  }

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-blue-50 border-r border-blue-100 transition-all duration-300 ease-in-out z-10 ${
        state.sidebarCollapsed ? 'w-14' : 'w-40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100 h-16">
        {!state.sidebarCollapsed && (
          <h1 className="text-lg font-semibold text-blue-800 truncate">一站能流</h1>
        )}
        <div className="flex items-center space-x-2">
          {getSyncStatusIcon()}
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

      {/* 新增：自动同步状态显示 */}
      {state.gitConnected && !state.sidebarCollapsed && (
        <div className="absolute bottom-4 left-2 right-2">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">自动同步</span>
              <div className="flex items-center space-x-1">
                {state.autoSync ? (
                  <>
                    <div className={`w-2 h-2 rounded-full ${
                      state.autoSyncActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-green-600">开启</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span className="text-gray-500">关闭</span>
                  </>
                )}
              </div>
            </div>
            {state.syncMessage && (
              <div className="mt-2 text-xs text-gray-500 truncate">
                {state.syncMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
