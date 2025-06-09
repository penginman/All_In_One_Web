import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAppContext } from '../../context/AppContext'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { state } = useAppContext()

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
