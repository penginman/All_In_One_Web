import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNavigation from './BottomNavigation'
import { useAppContext } from '../../context/AppContext'
import { useIsMobile } from '../../hooks/useIsMobile'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { state } = useAppContext()
  const isMobile = useIsMobile()

  if (isMobile) {
    // 移动端布局：隐藏侧边栏，使用底部导航
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 safe-area-inset-top">
        <main className="flex-1 pb-16 mobile-scroll">
          <div className="p-4 max-w-full safe-area-inset-left safe-area-inset-right">
            {children}
          </div>
        </main>
        <BottomNavigation />
      </div>
    )
  }

  // 桌面端布局：保持原有的侧边栏布局
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          state.sidebarCollapsed ? 'ml-16' : 'ml-40'
        }`}
      >
        <div className="p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
