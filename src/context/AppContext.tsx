import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { webdavClient, WebDAVConfig } from '../utils/webdav'

interface AppState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  searchEngine: 'bing' | 'google'
  webdavConfig: WebDAVConfig | null
  webdavConnected: boolean
  autoSync: boolean
  lastSyncTime: string | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  syncMessage: string
}

type AppAction = 
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_SEARCH_ENGINE'; payload: 'bing' | 'google' }
  | { type: 'SET_WEBDAV_CONFIG'; payload: WebDAVConfig | null }
  | { type: 'SET_WEBDAV_CONNECTED'; payload: boolean }
  | { type: 'SET_AUTO_SYNC'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: { status: AppState['syncStatus']; message?: string } }

const initialState: AppState = {
  sidebarCollapsed: false,
  theme: 'light',
  searchEngine: 'google',
  webdavConfig: null,
  webdavConnected: false,
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
    case 'SET_WEBDAV_CONFIG':
      return { ...state, webdavConfig: action.payload }
    case 'SET_WEBDAV_CONNECTED':
      return { ...state, webdavConnected: action.payload }
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
  testWebDAVConnection: () => Promise<{ success: boolean; message: string }>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 初始化WebDAV配置
  useEffect(() => {
    const config = webdavClient.loadConfig()
    if (config) {
      dispatch({ type: 'SET_WEBDAV_CONFIG', payload: config })
      // 自动测试连接
      testWebDAVConnection().then(result => {
        if (result.success) {
          // 连接成功后可以触发文件列表加载
          console.log('WebDAV auto-connected successfully')
        }
      })
    }

    // 从本地存储加载其他设置
    const savedAutoSync = localStorage.getItem('autoSync')
    if (savedAutoSync !== null) {
      dispatch({ type: 'SET_AUTO_SYNC', payload: JSON.parse(savedAutoSync) })
    }

    const savedLastSync = localStorage.getItem('lastSyncTime')
    if (savedLastSync) {
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: savedLastSync })
    }
  }, [])

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('autoSync', JSON.stringify(state.autoSync))
  }, [state.autoSync])

  useEffect(() => {
    if (state.lastSyncTime) {
      localStorage.setItem('lastSyncTime', state.lastSyncTime)
    }
  }, [state.lastSyncTime])

  // 自动同步检查
  useEffect(() => {
    if (state.webdavConnected && state.autoSync) {
      const checkSync = async () => {
        try {
          const result = await webdavClient.needsSync()
          if (result.needsSync && result.cloudData) {
            // 可以在这里添加提示用户是否同步的逻辑
            console.log('Cloud data is newer, consider syncing')
          }
        } catch (error) {
          console.error('Auto sync check failed:', error)
        }
      }

      // 每5分钟检查一次
      const interval = setInterval(checkSync, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [state.webdavConnected, state.autoSync])

  const testWebDAVConnection = async () => {
    if (!state.webdavConfig) {
      return { success: false, message: '请先配置WebDAV服务器信息' }
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '测试连接中...' } })
    
    const result = await webdavClient.testConnection()
    
    dispatch({ type: 'SET_WEBDAV_CONNECTED', payload: result.success })
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
    if (!state.webdavConnected) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: 'WebDAV未连接' } })
      return
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '同步到云端中...' } })

    try {
      // 获取本地数据
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const taskGroups = JSON.parse(localStorage.getItem('taskGroups') || '[]')
      const bookmarksData = JSON.parse(localStorage.getItem('bookmarks-data') || '{"bookmarks":[],"groups":[]}')
      const calendarEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]')

      const success = await webdavClient.syncToCloud({
        tasks,
        taskGroups,
        habits: [], // TODO: 当habits功能完成后添加
        bookmarks: bookmarksData.bookmarks || [],
        bookmarkGroups: bookmarksData.groups || [],
        calendarEvents
      })

      if (success) {
        const now = new Date().toISOString()
        dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now })
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '同步成功' } })
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '同步失败' } })
      }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '同步出错' } })
    }
  }

  const syncFromCloud = async () => {
    if (!state.webdavConnected) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: 'WebDAV未连接' } })
      return
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing', message: '从云端同步中...' } })

    try {
      const cloudData = await webdavClient.syncFromCloud()
      
      if (cloudData) {
        // 更新本地数据
        localStorage.setItem('tasks', JSON.stringify(cloudData.tasks))
        localStorage.setItem('taskGroups', JSON.stringify(cloudData.taskGroups))
        localStorage.setItem('bookmarks-data', JSON.stringify({
          bookmarks: cloudData.bookmarks,
          groups: cloudData.bookmarkGroups
        }))
        localStorage.setItem('calendar-events', JSON.stringify(cloudData.calendarEvents))

        const now = new Date().toISOString()
        dispatch({ type: 'SET_LAST_SYNC_TIME', payload: now })
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '同步成功，请刷新页面查看最新数据' } })
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '云端无数据或下载失败' } })
      }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '同步出错' } })
    }
  }

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      syncToCloud, 
      syncFromCloud, 
      testWebDAVConnection 
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
