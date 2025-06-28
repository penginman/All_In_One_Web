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
  autoSync: true,
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

  // 初始化所有设置
  useEffect(() => {
    console.log('Initializing app settings...')
    
    // 加载 Git 配置
    const config = gitSyncClient.loadConfig()
    if (config) {
      console.log('Git config loaded:', { ...config, token: '***' })
      dispatch({ type: 'SET_GIT_CONFIG', payload: config })
      
      // 延迟自动测试连接，避免与页面加载冲突
      setTimeout(() => {
        testGitConnection().then(result => {
          if (result.success) {
            console.log('Git sync auto-connected successfully')
          } else {
            console.log('Git sync auto-connection failed:', result.message)
          }
        }).catch(error => {
          console.error('Auto test connection error:', error)
        })
      }, 1000)
    }

    // 从本地存储加载其他设置
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      dispatch({ type: 'SET_THEME', payload: savedTheme })
    }

    const savedSearchEngine = localStorage.getItem('app-searchEngine') 
    if (savedSearchEngine && (savedSearchEngine === 'google' || savedSearchEngine === 'bing')) {
      dispatch({ type: 'SET_SEARCH_ENGINE', payload: savedSearchEngine })
    }

    const savedAutoSync = localStorage.getItem('app-autoSync')
    if (savedAutoSync !== null) {
      dispatch({ type: 'SET_AUTO_SYNC', payload: JSON.parse(savedAutoSync) })
    }

    const savedLastSync = localStorage.getItem('app-lastSyncTime')
    if (savedLastSync) {
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: savedLastSync })
    }

    const savedSidebarCollapsed = localStorage.getItem('app-sidebarCollapsed')
    if (savedSidebarCollapsed !== null) {
      dispatch({ type: 'TOGGLE_SIDEBAR' })
    }

    console.log('App settings initialized')
  }, [])

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('app-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    localStorage.setItem('app-searchEngine', state.searchEngine)
  }, [state.searchEngine])

  useEffect(() => {
    localStorage.setItem('app-autoSync', JSON.stringify(state.autoSync))
  }, [state.autoSync])

  useEffect(() => {
    if (state.lastSyncTime) {
      localStorage.setItem('app-lastSyncTime', state.lastSyncTime)
    }
  }, [state.lastSyncTime])

  useEffect(() => {
    localStorage.setItem('app-sidebarCollapsed', JSON.stringify(state.sidebarCollapsed))
  }, [state.sidebarCollapsed])

  // 自动同步检查
  useEffect(() => {
    if (state.gitConnected && state.autoSync) {
      const checkSync = async () => {
        try {
          // 初始化同步系统（如果还没有初始化）
          await gitSyncClient.initializeSync()
          
          // 执行自动同步
          const result = await gitSyncClient.autoSync()
          if (result.success) {
            console.log('Auto sync completed successfully')
            dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() })
          } else {
            console.log('Auto sync completed with some errors:', result.results)
          }
        } catch (error) {
          console.error('Auto sync check failed:', error)
        }
      }

      // 每5分钟检查一次
      const interval = setInterval(checkSync, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [state.gitConnected, state.autoSync])

  const testGitConnection = async () => {
    if (!state.gitConfig) {
      return { success: false, message: '请先配置Git同步信息' }
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '测试连接中...' } })
    
    const result = await gitSyncClient.testConnection()
    
    dispatch({ type: 'SET_GIT_CONNECTED', payload: result.success })
    dispatch({ 
      type: 'SET_SYNC_STATUS', 
      payload: { 
        status: result.success ? 'success' : 'error',
        message: result.message
      }
    })

    return result
  }

  const syncToCloud = async () => {
    if (!state.gitConnected) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: 'Git同步未连接' } })
      return
    }

    console.log('Starting manual sync to cloud...')
    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '同步到云端中...' } })

    try {
      // 初始化同步系统
      await gitSyncClient.initializeSync()
      
      // 使用新的同步API
      const result = await gitSyncClient.syncAllToCloud()

      console.log('Sync to cloud result:', result)

      if (result.success) {
        const now = new Date().toISOString()
        dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now })
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '同步成功' } })
      } else {
        const failedModules = Object.entries(result.results)
          .filter(([_, success]) => !success)
          .map(([module]) => module)
        
        const message = failedModules.length > 0 
          ? `部分模块同步失败: ${failedModules.join(', ')}`
          : '同步失败'
        
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message } })
      }
    } catch (error: any) {
      console.error('Sync to cloud error:', error)
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: error.message || '同步出错' } })
    }
  }

  const syncFromCloud = async () => {
    if (!state.gitConnected) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: 'Git同步未连接' } })
      return
    }

    console.log('Starting manual sync from cloud...')
    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '从云端同步中...' } })

    try {
      // 初始化同步系统
      await gitSyncClient.initializeSync()
      
      // 使用新的同步API
      const result = await gitSyncClient.syncAllFromCloud()
      
      console.log('Sync from cloud result:', result)

      if (result.success) {
        const now = new Date().toISOString()
        dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now })
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '同步成功，请刷新页面查看最新数据' } })
        
        // 自动刷新页面来加载新数据
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const failedModules = Object.entries(result.results)
          .filter(([_, success]) => !success)
          .map(([module]) => module)
        
        const message = failedModules.length > 0 
          ? `部分模块同步失败: ${failedModules.join(', ')}`
          : '云端无数据或下载失败'
        
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message } })
      }
    } catch (error: any) {
      console.error('Sync from cloud error:', error)
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: error.message || '同步出错' } })
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
