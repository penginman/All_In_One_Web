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
    sessionCount: 0
  },
  sessions: [],
  settings: defaultSettings,
  stats: {
    today: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 },
    week: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 },
    allTime: { workSessions: 0, totalFocusTime: 0, totalBreakTime: 0 }
  }
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
          isPaused: false
        }
      }
    }

    case 'PAUSE_SESSION': {
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          isRunning: false,
          isPaused: true
        }
      }
    }

    case 'RESUME_SESSION': {
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          isRunning: true,
          isPaused: false
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
          sessionCount: newSessionCount
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
              sessionCount: state.currentSession.sessionCount // 手动结束不增加会话计数
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
          sessionCount: state.currentSession.sessionCount
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
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pomodoroReducer, initialState)
  const initializeRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
      if (state.settings.soundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzCa0fPTRhcMVqzk9J5NDAxQpuPwtmMcBzCa0fPTRhcMVqzk9J5NDAwLkiDrwGNQCAYeNJKF6MR5TgIVdZzf6X2SBgQbNJGF6sN5TgIVdJzm6H2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2SBwQbNJGG6sN5TgQVdJzm6X2b')
        audio.play().catch(() => {})
      }
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
      getNextSessionType
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
