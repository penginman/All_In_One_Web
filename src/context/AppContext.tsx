import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef, useCallback } from 'react'
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
  // 新增：自动同步相关状态
  autoSyncActive: boolean
  pendingChanges: boolean
  lastChangeTime: number | null
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
  // 新增：自动同步相关 actions
  | { type: 'SET_AUTO_SYNC_ACTIVE'; payload: boolean }
  | { type: 'SET_PENDING_CHANGES'; payload: boolean }
  | { type: 'SET_LAST_CHANGE_TIME'; payload: number }

const initialState: AppState = {
  sidebarCollapsed: false,
  theme: 'light',
  searchEngine: 'google',
  gitConfig: null,
  gitConnected: false,
  autoSync: false,
  lastSyncTime: null,
  syncStatus: 'idle',
  syncMessage: '',
  // 新增：自动同步初始状态
  autoSyncActive: false,
  pendingChanges: false,
  lastChangeTime: null
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
    // 新增：处理自动同步相关 actions
    case 'SET_AUTO_SYNC_ACTIVE':
      return { ...state, autoSyncActive: action.payload }
    case 'SET_PENDING_CHANGES':
      return { ...state, pendingChanges: action.payload }
    case 'SET_LAST_CHANGE_TIME':
      return { ...state, lastChangeTime: action.payload }
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
  
  // 新增：存储变化检测相关 refs
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const storageSnapshotRef = useRef<string>('')
  const lastAutoSyncRef = useRef<number>(0)
  const AUTO_SYNC_DELAY = 5000 // 5秒后自动同步
  const STORAGE_CHECK_INTERVAL = 1000 // 每秒检测一次

  // 修复：将同步函数移到前面定义
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

  // 修复：将 syncToCloud 移到前面
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

  // 修改：获取当前存储快照 - 包含所有功能模块的数据
  const getStorageSnapshot = useCallback(() => {
    const storageData: Record<string, string> = {}
    
    // 获取所有需要同步的数据 - 根据实际使用的 localStorage 键名
    const keysToWatch = [
      // 任务相关
      'tasks', 'taskGroups',
      
      // 习惯相关
      'habit-data',
      
      // 书签相关
      'bookmarks-data',
      
      // 日历相关
      'calendar-events',
      
      // 番茄钟相关
      'pomodoro-stats', 'pomodoro-data', 'pomodoro-sessions', 'pomodoro-settings',
      
      // 应用设置
      'app-settings', 'app-theme', 'app-searchEngine', 'app-autoSync', 'app-sidebarCollapsed',
      
      // 搜索引擎相关
      'search-engines', 'current-search-engine', 'custom-search-engines',
      
      // 其他可能的数据
      'user-preferences', 'notifications', 'reminders'
    ]
    
    keysToWatch.forEach(key => {
      const data = localStorage.getItem(key)
      if (data) {
        storageData[key] = data
      }
    })
    
    return JSON.stringify(storageData)
  }, [])

  // 修改：检测存储变化 - 增加更详细的日志
  const checkStorageChanges = useCallback(() => {
    const currentSnapshot = getStorageSnapshot()
    const hasChanged = currentSnapshot !== storageSnapshotRef.current
    
    if (hasChanged && storageSnapshotRef.current !== '') {
      // 找出具体哪些键发生了变化
      try {
        const oldData = JSON.parse(storageSnapshotRef.current)
        const newData = JSON.parse(currentSnapshot)
        
        const changedKeys: string[] = []
        
        // 检查所有键的变化
        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
        allKeys.forEach(key => {
          if (oldData[key] !== newData[key]) {
            changedKeys.push(key)
          }
        })
        
        console.log('AppContext: Storage changes detected in keys:', changedKeys)
        
        dispatch({ type: 'SET_PENDING_CHANGES', payload: true })
        dispatch({ type: 'SET_LAST_CHANGE_TIME', payload: Date.now() })
      } catch (error) {
        console.log('AppContext: Storage changes detected (parse error)', error)
        dispatch({ type: 'SET_PENDING_CHANGES', payload: true })
        dispatch({ type: 'SET_LAST_CHANGE_TIME', payload: Date.now() })
      }
    }
    
    storageSnapshotRef.current = currentSnapshot
    return hasChanged
  }, [getStorageSnapshot])

  // 修复：自动同步逻辑 - 使用最新的状态值
  const performAutoSync = useCallback(async () => {
    console.log('AppContext: performAutoSync called, checking conditions...')
    
    if (!state.gitConnected) {
      console.log('AppContext: Not connected, skipping auto sync')
      return
    }
    
    if (!state.autoSync) {
      console.log('AppContext: Auto sync disabled, skipping')
      return
    }
    
    if (state.syncStatus === 'syncing') {
      console.log('AppContext: Already syncing, skipping')
      return
    }

    const now = Date.now()
    if (now - lastAutoSyncRef.current < 3000) { // 防止频繁同步
      console.log('AppContext: Too soon since last sync, skipping')
      return
    }

    console.log('AppContext: Performing auto sync...')
    lastAutoSyncRef.current = now
    
    try {
      await syncToCloud()
      dispatch({ type: 'SET_PENDING_CHANGES', payload: false })
      console.log('AppContext: Auto sync completed successfully')
    } catch (error) {
      console.error('AppContext: Auto sync failed:', error)
    }
  }, [state.gitConnected, state.autoSync, state.syncStatus, syncToCloud])

  // 修复：启动自动同步检测 - 去除状态依赖
  const startAutoSyncMonitoring = useCallback(() => {
    if (autoSyncIntervalRef.current) {
      clearInterval(autoSyncIntervalRef.current)
    }

    console.log('AppContext: Starting auto sync monitoring')
    dispatch({ type: 'SET_AUTO_SYNC_ACTIVE', payload: true })
    
    // 初始化存储快照
    storageSnapshotRef.current = getStorageSnapshot()
    
    autoSyncIntervalRef.current = setInterval(() => {
      const hasChanges = checkStorageChanges()
      
      // 如果有未处理的变化且超过延迟时间，执行自动同步
      if (hasChanges) {
        setTimeout(() => {
          performAutoSync()
        }, AUTO_SYNC_DELAY)
      }
    }, STORAGE_CHECK_INTERVAL)
  }, [getStorageSnapshot, checkStorageChanges, performAutoSync])

  // 新增：停止自动同步检测
  const stopAutoSyncMonitoring = useCallback(() => {
    if (autoSyncIntervalRef.current) {
      console.log('AppContext: Stopping auto sync monitoring')
      clearInterval(autoSyncIntervalRef.current)
      autoSyncIntervalRef.current = null
    }
    dispatch({ type: 'SET_AUTO_SYNC_ACTIVE', payload: false })
    dispatch({ type: 'SET_PENDING_CHANGES', payload: false })
  }, [])

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

  // 新增：Git配置加载后自动测试连接
  useEffect(() => {
    if (state.gitConfig && !state.gitConnected) {
      console.log('AppContext: Git config detected, auto testing connection...')
      
      // 延迟执行以避免初始化阶段的冲突
      const timer = setTimeout(async () => {
        try {
          dispatch({ 
            type: 'SET_SYNC_STATUS', 
            payload: { status: 'syncing', message: '正在验证云同步连接...' } 
          })
          
          const result = await gitSyncClient.testConnection()
          console.log('AppContext: Auto connection test result:', result)
          
          dispatch({ type: 'SET_GIT_CONNECTED', payload: result.success })
          
          if (result.success) {
            dispatch({ 
              type: 'SET_SYNC_STATUS', 
              payload: { status: 'success', message: '云同步连接正常' } 
            })
          } else {
            dispatch({ 
              type: 'SET_SYNC_STATUS', 
              payload: { 
                status: 'error', 
                message: `云同步连接失败: ${result.message}` 
              } 
            })
          }
        } catch (error) {
          console.error('AppContext: Auto connection test failed:', error)
          dispatch({ type: 'SET_GIT_CONNECTED', payload: false })
          dispatch({ 
            type: 'SET_SYNC_STATUS', 
            payload: { 
              status: 'error', 
              message: '云同步连接验证出错' 
            } 
          })
        }
      }, 1000) // 1秒延迟

      return () => clearTimeout(timer)
    }
  }, [state.gitConfig]) // 只依赖gitConfig

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

  // 修复：监听自动同步设置变化 - 简化依赖
  useEffect(() => {
    console.log('AppContext: Auto sync effect triggered, gitConnected:', state.gitConnected, 'autoSync:', state.autoSync)
    
    if (state.gitConnected && state.autoSync) {
      startAutoSyncMonitoring()
    } else {
      stopAutoSyncMonitoring()
    }
    
    // 清理函数
    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current)
        autoSyncIntervalRef.current = null
      }
    }
  }, [state.gitConnected, state.autoSync]) // 只依赖这两个关键状态

  // 新增：组件卸载时清理
  useEffect(() => {
    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current)
      }
    }
  }, [])

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
