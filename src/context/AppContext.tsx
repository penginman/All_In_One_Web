import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { gitSyncClient, GitConfig } from '../utils/gitSync'

interface AppState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  searchEngine: 'bing' | 'google'
  gitConfig: GitConfig | null
  gitConnected: boolean
  autoSync: boolean
  lastSyncTime: string | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  syncMessage: string
}

type AppAction = 
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_SEARCH_ENGINE'; payload: 'bing' | 'google' }
  | { type: 'SET_GIT_CONFIG'; payload: GitConfig | null }
  | { type: 'SET_GIT_CONNECTED'; payload: boolean }
  | { type: 'SET_AUTO_SYNC'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: { status: AppState['syncStatus']; message?: string } }

const initialState: AppState = {
  sidebarCollapsed: false,
  theme: 'light',
  searchEngine: 'google',
  gitConfig: null,
  gitConnected: false,
  autoSync: false, // 改为 false，避免默认值覆盖用户设置
  lastSyncTime: null,
  syncStatus: 'idle',
  syncMessage: ''
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_SEARCH_ENGINE':
      return { ...state, searchEngine: action.payload }
    case 'SET_GIT_CONFIG':
      return { ...state, gitConfig: action.payload }
    case 'SET_GIT_CONNECTED':
      return { ...state, gitConnected: action.payload }
    case 'SET_AUTO_SYNC':
      return { ...state, autoSync: action.payload }
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload }
    case 'SET_SYNC_STATUS':
      return { 
        ...state, 
        syncStatus: action.payload.status,
        syncMessage: action.payload.message || state.syncMessage
      }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  syncToCloud: () => Promise<void>
  syncFromCloud: () => Promise<void>
  testGitConnection: () => Promise<{ success: boolean; message: string }>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 初始化设置 - 确保只执行一次
  useEffect(() => {
    console.log('AppContext: Starting initialization...')
    
    // 加载Git配置
    const config = gitSyncClient.loadConfig()
    console.log('AppContext: Git config loaded:', config ? 'found' : 'not found')
    
    if (config) {
      dispatch({ type: 'SET_GIT_CONFIG', payload: config })
    }

    // 加载字符串类型设置
    const settings = [
      { key: 'app-theme', action: 'SET_THEME' as const, values: ['light', 'dark'] as const },
      { key: 'app-searchEngine', action: 'SET_SEARCH_ENGINE' as const, values: ['google', 'bing'] as const },
      { key: 'app-lastSyncTime', action: 'SET_LAST_SYNC_TIME' as const }
    ]

    settings.forEach(({ key, action }) => {
      try {
        const saved = localStorage.getItem(key)
        if (saved !== null) {
          if (action === 'SET_THEME' && (saved === 'light' || saved === 'dark')) {
            dispatch({ type: 'SET_THEME', payload: saved })
          } else if (action === 'SET_SEARCH_ENGINE' && (saved === 'google' || saved === 'bing')) {
            dispatch({ type: 'SET_SEARCH_ENGINE', payload: saved })
          } else if (action === 'SET_LAST_SYNC_TIME') {
            dispatch({ type: 'SET_LAST_SYNC_TIME', payload: saved })
          }
        }
      } catch (error) {
        console.warn(`Failed to load setting ${key}:`, error)
      }
    })

    // 修复：正确处理 autoSync 设置
    try {
      const savedAutoSync = localStorage.getItem('app-autoSync')
      console.log('AppContext: Raw autoSync value from localStorage:', savedAutoSync)
      
      if (savedAutoSync !== null) {
        const autoSyncValue = JSON.parse(savedAutoSync)
        console.log('AppContext: Parsed autoSync value:', autoSyncValue)
        dispatch({ type: 'SET_AUTO_SYNC', payload: autoSyncValue })
      } else {
        // 如果没有保存的值，设置默认值为 true（只有第一次使用时）
        console.log('AppContext: No autoSync setting found, setting default: true')
        dispatch({ type: 'SET_AUTO_SYNC', payload: true })
        localStorage.setItem('app-autoSync', JSON.stringify(true)) // 立即保存默认值
      }
    } catch (error) {
      console.warn('Failed to load autoSync setting:', error)
      // 出错时设置默认值
      dispatch({ type: 'SET_AUTO_SYNC', payload: true })
      localStorage.setItem('app-autoSync', JSON.stringify(true))
    }

    // 处理侧边栏折叠状态
    try {
      const savedSidebarCollapsed = localStorage.getItem('app-sidebarCollapsed')
      if (savedSidebarCollapsed !== null) {
        const sidebarCollapsed = JSON.parse(savedSidebarCollapsed)
        if (sidebarCollapsed) {
          dispatch({ type: 'TOGGLE_SIDEBAR' })
        }
      }
    } catch (error) {
      console.warn('Failed to load sidebar setting:', error)
    }

    console.log('AppContext: Initialization completed')
  }, []) // 空依赖数组，只在挂载时执行

  // 自动保存设置 - 避免在初始化时保存
  useEffect(() => {
    // 添加一个标记，避免在初始化期间保存设置
    const isInitializing = state.autoSync === false && 
                          state.theme === 'light' && 
                          state.searchEngine === 'google' && 
                          state.sidebarCollapsed === false
    
    if (isInitializing) {
      console.log('AppContext: Skipping save during initialization')
      return
    }
    
    console.log('AppContext: Saving settings to localStorage, autoSync:', state.autoSync)
    
    try {
      localStorage.setItem('app-theme', state.theme)
      localStorage.setItem('app-searchEngine', state.searchEngine)
      localStorage.setItem('app-autoSync', JSON.stringify(state.autoSync))
      localStorage.setItem('app-sidebarCollapsed', JSON.stringify(state.sidebarCollapsed))
    } catch (error) {
      console.warn('Failed to save settings:', error)
    }
  }, [state.theme, state.searchEngine, state.autoSync, state.sidebarCollapsed])

  useEffect(() => {
    if (state.lastSyncTime) {
      localStorage.setItem('app-lastSyncTime', state.lastSyncTime)
    }
  }, [state.lastSyncTime])

  // 监听自动同步设置变化 - 暂时禁用
  // useEffect(() => {
  //   if (state.gitConnected) {
  //     if (state.autoSync) {
  //       gitSyncClient.enableAutoSync()
  //     } else {
  //       gitSyncClient.disableAutoSync()
  //     }
  //   }
  // }, [state.autoSync, state.gitConnected])

  const testGitConnection = async () => {
    console.log('AppContext: testGitConnection called with config:', state.gitConfig)
    
    if (!state.gitConfig) {
      const message = '请先配置Git同步信息'
      console.log('AppContext:', message)
      return { success: false, message }
    }

    console.log('AppContext: Testing git connection...')
    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '测试连接中...' } })
    
    try {
      const result = await gitSyncClient.testConnection()
      console.log('AppContext: Test connection result:', result)
      
      dispatch({ type: 'SET_GIT_CONNECTED', payload: result.success })
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          status: result.success ? 'success' : 'error',
          message: result.message
        }
      })

      return result
    } catch (error) {
      console.error('AppContext: Test connection error:', error)
      const errorMessage = error instanceof Error ? error.message : '连接测试出错'
      
      dispatch({ type: 'SET_GIT_CONNECTED', payload: false })
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: errorMessage }
      })
      
      return { success: false, message: errorMessage }
    }
  }

  // 同步到云端
  const syncToCloud = async () => {
    if (!state.gitConnected) return

    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '正在同步到云端...' } })

      // 使用 gitSyncClient 的 syncAllToCloud 方法来同步所有数据模块
      const result = await gitSyncClient.syncAllToCloud()
      
      if (result.success) {
        const moduleNames = gitSyncClient.getModuleNames()
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { status: 'success', message: `成功同步 ${moduleNames.length} 个数据模块到云端` } 
        })
      } else {
        const successCount = Object.values(result.results).filter(Boolean).length
        const totalCount = Object.keys(result.results).length
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { 
            status: 'error', 
            message: `部分同步失败：${successCount}/${totalCount} 个模块同步成功` 
          } 
        })
      }

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() })

    } catch (error) {
      console.error('同步到云端失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '同步到云端失败: ' + errorMessage } 
      })
    }
  }

  // 从云端同步
  const syncFromCloud = async () => {
    if (!state.gitConnected) return

    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '正在从云端同步...' } })

      // 使用 gitSyncClient 的 syncAllFromCloud 方法来同步所有数据模块
      const result = await gitSyncClient.syncAllFromCloud()
      
      if (result.success) {
        const moduleNames = gitSyncClient.getModuleNames()
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { status: 'success', message: `成功从云端同步 ${moduleNames.length} 个数据模块` } 
        })
      } else {
        const successCount = Object.values(result.results).filter(Boolean).length
        const totalCount = Object.keys(result.results).length
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { 
            status: 'error', 
            message: `部分同步失败：${successCount}/${totalCount} 个模块同步成功` 
          } 
        })
      }

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() })

      // 刷新页面以重新加载所有数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('从云端同步失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '从云端同步失败: ' + errorMessage } 
      })
    }
  }

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      syncToCloud, 
      syncFromCloud, 
      testGitConnection 
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
   