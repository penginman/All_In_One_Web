import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { PomodoroState, PomodoroAction, PomodoroSession, PomodoroSettings, PomodoroStats } from '../types/pomodoro'

const STORAGE_KEY = 'pomodoro-data'

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true
}

const initialState: PomodoroState = {
  currentSession: {
    type: null,
    timeLeft: 0,
    isRunning: false,
    isPaused: false,
    sessionCount: 0,
    startTimestamp: null,
    pausedTimestamp: null,
    totalPausedTime: 0
  },
  sessions: [],
  settings: defaultSettings,
  stats: {
    today: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 },
    week: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 },
    allTime: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 }
  },
  isPlayingSound: false
}

function calculateStats(sessions: PomodoroSession[]): PomodoroStats {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const todaySessions = sessions.filter(s => new Date(s.completedAt) >= today)
  const weekSessions = sessions.filter(s => new Date(s.completedAt) >= weekStart)

  return {
    today: {
      workSessions: todaySessions.filter(s => s.type === 'work' && !s.interrupted).length,
      totalFocusTime: todaySessions.filter(s => s.type === 'work').reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: todaySessions.filter(s => s.type !== 'work').reduce((sum, s) => sum + s.duration, 0)
    },
    week: {
      workSessions: weekSessions.filter(s => s.type === 'work' && !s.interrupted).length,
      totalFocusTime: weekSessions.filter(s => s.type === 'work').reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: weekSessions.filter(s => s.type !== 'work').reduce((sum, s) => sum + s.duration, 0)
    },
    allTime: {
      workSessions: sessions.filter(s => s.type === 'work' && !s.interrupted).length,
      totalFocusTime: sessions.filter(s => s.type === 'work').reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: sessions.filter(s => s.type !== 'work').reduce((sum, s) => sum + s.duration, 0)
    }
  }
}

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case 'START_SESSION': {
      const { sessionType } = action.payload
      const duration = sessionType === 'work'
        ? state.settings.workDuration
        : sessionType === 'shortBreak'
        ? state.settings.shortBreakDuration
        : state.settings.longBreakDuration

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          type: sessionType,
          timeLeft: duration * 60,
          isRunning: true,
          isPaused: false,
          startTimestamp: Date.now(),
          pausedTimestamp: null,
          totalPausedTime: 0
        }
      }
    }

    case 'PAUSE_SESSION': {
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          isRunning: false,
          isPaused: true,
          pausedTimestamp: Date.now()
        }
      }
    }

    case 'RESUME_SESSION': {
      const now = Date.now()
      const pausedDuration = state.currentSession.pausedTimestamp
        ? now - state.currentSession.pausedTimestamp
        : 0

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          isRunning: true,
          isPaused: false,
          pausedTimestamp: null,
          totalPausedTime: state.currentSession.totalPausedTime + pausedDuration
        }
      }
    }

    case 'TICK': {
      if (!state.currentSession.isRunning || state.currentSession.timeLeft <= 0) {
        return state
      }

      const newTimeLeft = state.currentSession.timeLeft - 1
      
      if (newTimeLeft <= 0) {
        return {
          ...state,
          currentSession: {
            ...state.currentSession,
            timeLeft: 0,
            isRunning: false
          }
        }
      }

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          timeLeft: newTimeLeft
        }
      }
    }

    case 'COMPLETE_SESSION': {
      if (!state.currentSession.type) return state

      const sessionDuration = state.currentSession.type === 'work' 
        ? state.settings.workDuration 
        : state.currentSession.type === 'shortBreak' 
        ? state.settings.shortBreakDuration 
        : state.settings.longBreakDuration

      const newSession: PomodoroSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: state.currentSession.type,
        duration: sessionDuration,
        completedAt: new Date(),
        interrupted: false
      }

      const newSessions = [...state.sessions, newSession]
      // 只有完成的工作会话才计入会话计数
      const newSessionCount = state.currentSession.type === 'work' 
        ? state.currentSession.sessionCount + 1 
        : state.currentSession.sessionCount

      return {
        ...state,
        sessions: newSessions,
        stats: calculateStats(newSessions),
        currentSession: {
          type: null,
          timeLeft: 0,
          isRunning: false,
          isPaused: false,
          sessionCount: newSessionCount,
          startTimestamp: null,
          pausedTimestamp: null,
          totalPausedTime: 0
        }
      }
    }

    case 'STOP_SESSION': {
      if (!state.currentSession.type) return state

      const { interrupted } = action.payload
      
      if (interrupted && state.currentSession.type) {
        const originalDuration = state.currentSession.type === 'work' 
          ? state.settings.workDuration 
          : state.currentSession.type === 'shortBreak' 
          ? state.settings.shortBreakDuration 
          : state.settings.longBreakDuration

        const actualDuration = Math.ceil((originalDuration * 60 - state.currentSession.timeLeft) / 60)
        
        if (actualDuration > 0) {
          const newSession: PomodoroSession = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: state.currentSession.type,
            duration: actualDuration,
            completedAt: new Date(),
            interrupted: true
          }

          const newSessions = [...state.sessions, newSession]
          
          return {
            ...state,
            sessions: newSessions,
            stats: calculateStats(newSessions),
            currentSession: {
              type: null,
              timeLeft: 0,
              isRunning: false,
              isPaused: false,
              sessionCount: state.currentSession.sessionCount, // 手动结束不增加会话计数
              startTimestamp: null,
              pausedTimestamp: null,
              totalPausedTime: 0
            }
          }
        }
      }

      return {
        ...state,
        currentSession: {
          type: null,
          timeLeft: 0,
          isRunning: false,
          isPaused: false,
          sessionCount: state.currentSession.sessionCount,
          startTimestamp: null,
          pausedTimestamp: null,
          totalPausedTime: 0
        }
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      }
    }

    case 'LOAD_FROM_STORAGE': {
      const newSessions = action.payload.sessions.map(s => ({
        ...s,
        completedAt: new Date(s.completedAt)
      }))

      return {
        ...state,
        sessions: newSessions,
        settings: { ...defaultSettings, ...action.payload.settings },
        stats: calculateStats(newSessions)
      }
    }

    case 'CORRECT_TIME': {
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          timeLeft: Math.max(0, action.payload.correctedTimeLeft)
        }
      }
    }

    case 'START_SOUND': {
      return {
        ...state,
        isPlayingSound: true
      }
    }

    case 'STOP_SOUND': {
      return {
        ...state,
        isPlayingSound: false
      }
    }

    default:
      return state
  }
}

interface PomodoroContextType {
  state: PomodoroState
  dispatch: React.Dispatch<PomodoroAction>
  startSession: (type: 'work' | 'shortBreak' | 'longBreak') => void
  pauseSession: () => void
  resumeSession: () => void
  stopSession: (interrupted?: boolean) => void
  getNextSessionType: () => 'work' | 'shortBreak' | 'longBreak'
  stopNotificationSound: () => void
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pomodoroReducer, initialState)
  const initializeRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hiddenTimestampRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 初始化加载数据
  useEffect(() => {
    if (initializeRef.current) return
    initializeRef.current = true

    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const { sessions, settings } = JSON.parse(savedData)
        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: { sessions: sessions || [], settings: settings || defaultSettings }
        })
      }
    } catch (error) {
      console.error('Failed to load pomodoro data:', error)
    }
  }, [])

  // 音频控制函数
  const playNotificationSound = () => {
    if (!state.settings.soundEnabled) return

    try {
      // 停止当前播放的音频（如果有）
      stopNotificationSound()

      // 创建新的音频对象
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzCa0fPTRhcMVqzk9J5NDAxQpuPwtmMcBzCa0fPTRhcMVqzk9J5NDAwLkiDrwGNQCAYeNJKF6MR5TgIVdZzf6X2SBgQbNJGF6sN5TgIVdJzm6H2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2b')
      audioRef.current = audio

      // 设置音频事件监听
      audio.addEventListener('play', () => {
        dispatch({ type: 'START_SOUND' })
      })

      audio.addEventListener('ended', () => {
        dispatch({ type: 'STOP_SOUND' })
        audioRef.current = null
      })

      audio.addEventListener('error', () => {
        dispatch({ type: 'STOP_SOUND' })
        audioRef.current = null
      })

      // 播放音频
      audio.play().catch(() => {
        dispatch({ type: 'STOP_SOUND' })
        audioRef.current = null
      })
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  const stopNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      dispatch({ type: 'STOP_SOUND' })
    }
  }

  // 时间校正函数
  const correctTimeIfNeeded = () => {
    if (!state.currentSession.isRunning || !state.currentSession.startTimestamp) {
      return
    }

    const now = Date.now()
    const sessionDuration = state.currentSession.type === 'work'
      ? state.settings.workDuration
      : state.currentSession.type === 'shortBreak'
      ? state.settings.shortBreakDuration
      : state.settings.longBreakDuration

    // 计算从开始到现在应该经过的总时间（秒）
    const totalElapsedMs = now - state.currentSession.startTimestamp - state.currentSession.totalPausedTime
    const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000)

    // 计算正确的剩余时间
    const correctTimeLeft = Math.max(0, (sessionDuration * 60) - totalElapsedSeconds)

    // 如果时间差异超过2秒，则进行校正
    if (Math.abs(state.currentSession.timeLeft - correctTimeLeft) > 2) {
      dispatch({
        type: 'CORRECT_TIME',
        payload: { correctedTimeLeft: correctTimeLeft }
      })
    }
  }

  // Page Visibility API 监听
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 标签页隐藏时记录时间戳
        hiddenTimestampRef.current = Date.now()
      } else {
        // 标签页重新可见时校正时间和停止音频
        if (hiddenTimestampRef.current && state.currentSession.isRunning) {
          correctTimeIfNeeded()
        }
        // 自动停止提示音
        if (state.isPlayingSound) {
          stopNotificationSound()
        }
        hiddenTimestampRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.currentSession.isRunning, state.currentSession.startTimestamp, state.currentSession.totalPausedTime, state.currentSession.timeLeft, state.settings])

  // 定时器
  useEffect(() => {
    if (state.currentSession.isRunning) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK' })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.currentSession.isRunning])

  // 会话完成检测
  useEffect(() => {
    if (state.currentSession.timeLeft === 0 && state.currentSession.type && !state.currentSession.isRunning) {
      dispatch({ type: 'COMPLETE_SESSION' })

      // 播放提醒音
      playNotificationSound()
    }
  }, [state.currentSession.timeLeft, state.currentSession.type, state.currentSession.isRunning, state.settings.soundEnabled])

  // 自动保存数据
  useEffect(() => {
    if (!initializeRef.current) return
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          sessions: state.sessions,
          settings: state.settings,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (error) {
        console.error('Failed to save pomodoro data:', error)
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [state.sessions, state.settings])

  const startSession = (type: 'work' | 'shortBreak' | 'longBreak') => {
    dispatch({ type: 'START_SESSION', payload: { sessionType: type } })
  }

  const pauseSession = () => {
    dispatch({ type: 'PAUSE_SESSION' })
  }

  const resumeSession = () => {
    dispatch({ type: 'RESUME_SESSION' })
  }

  const stopSession = (interrupted = true) => {
    dispatch({ type: 'STOP_SESSION', payload: { interrupted } })
  }

  const getNextSessionType = (): 'work' | 'shortBreak' | 'longBreak' => {
    if (!state.currentSession.type || state.currentSession.type !== 'work') {
      return 'work'
    }
    
    return state.currentSession.sessionCount % state.settings.longBreakInterval === 0 
      ? 'longBreak' 
      : 'shortBreak'
  }

  return (
    <PomodoroContext.Provider value={{
      state,
      dispatch,
      startSession,
      pauseSession,
      resumeSession,
      stopSession,
      getNextSessionType,
      stopNotificationSound
    }}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoroContext() {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider')
  }
  return context
}
