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
      { key: 'app-theme', action: 'SET_THEME', values: ['light', 'dark'] },
      { key: 'app-searchEngine', action: 'SET_SEARCH_ENGINE', values: ['google', 'bing'] },
      { key: 'app-lastSyncTime', action: 'SET_LAST_SYNC_TIME' }
    ]

    settings.forEach(({ key, action, values }) => {
      try {
        const saved = localStorage.getItem(key)
        if (saved !== null) {
          if (values && !values.includes(saved)) return
          dispatch({ type: action as any, payload: saved })
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

  // 监听自动同步设置变化
  useEffect(() => {
    if (state.gitConnected) {
      if (state.autoSync) {
        gitSyncClient.enableAutoSync()
      } else {
        gitSyncClient.disableAutoSync()
      }
    }
  }, [state.autoSync, state.gitConnected])

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
    } catch (error: any) {
      console.error('AppContext: Test connection error:', error)
      const errorMessage = error.message || '连接测试出错'
      
      dispatch({ type: 'SET_GIT_CONNECTED', payload: false })
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: errorMessage }
      })
      
      return { success: false, message: errorMessage }
    }
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
      const initResult = await gitSyncClient.initializeSync()
      if (!initResult) {
        throw new Error('同步系统初始化失败')
      }
      
      // 使用新的同步API
      const result = await gitSyncClient.syncAllToCloud()

      console.log('Sync to cloud result:', result)

      if (result.success) {
        const now = new Date().toISOString()
        dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now })
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '同步成功' } })
        
        // 手动同步后触发变化检测重置
        gitSyncClient.triggerChangeDetection()
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
      const initResult = await gitSyncClient.initializeSync()
      if (!initResult) {
        throw new Error('同步系统初始化失败')
      }
      
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
