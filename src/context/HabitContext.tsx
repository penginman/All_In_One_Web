import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react'
import { Habit, HabitRecord, DailyNote, HabitState, HabitStats } from '../types/habits'
import useLocalStorage from '../hooks/useLocalStorage'

// 整合的习惯数据结构
interface HabitData {
  habits: Habit[]
  records: HabitRecord[]
  dailyNotes: DailyNote[]
  version: string
  lastUpdated: string
}

type HabitAction =
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'createdAt'> }
  | { type: 'UPDATE_HABIT'; payload: { id: string; updates: Partial<Habit> } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT_RECORD'; payload: { habitId: string; date: Date } }
  | { type: 'ADD_DAILY_NOTE'; payload: { date: Date; content: string } }
  | { type: 'UPDATE_DAILY_NOTE'; payload: { date: Date; content: string } }
  | { type: 'SET_VIEW'; payload: 'week' | 'month' }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'LOAD_DATA'; payload: HabitData }
  | { type: 'IMPORT_DATA'; payload: HabitData }

const initialState: HabitState = {
  habits: [],
  records: [],
  dailyNotes: [],
  currentDate: new Date(),
  view: 'week'
}

const initialHabitData: HabitData = {
  habits: [],
  records: [],
  dailyNotes: [],
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
}

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'ADD_HABIT':
      return {
        ...state,
        habits: [...state.habits, {
          ...action.payload,
          id: Date.now().toString(),
          createdAt: new Date()
        }]
      }
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id
            ? { ...habit, ...action.payload.updates }
            : habit
        )
      }
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload),
        records: state.records.filter(record => record.habitId !== action.payload)
      }
    case 'TOGGLE_HABIT_RECORD':
      const { habitId, date } = action.payload
      const dateStr = date.toDateString()
      const existingRecord = state.records.find(
        record => record.habitId === habitId && record.date.toDateString() === dateStr
      )
      
      if (existingRecord) {
        return {
          ...state,
          records: state.records.filter(record => record.id !== existingRecord.id)
        }
      } else {
        return {
          ...state,
          records: [...state.records, {
            id: Date.now().toString(),
            habitId,
            date: new Date(date),
            createdAt: new Date()
          }]
        }
      }
    case 'ADD_DAILY_NOTE':
    case 'UPDATE_DAILY_NOTE':
      const noteDate = action.payload.date.toDateString()
      const existingNote = state.dailyNotes.find(
        note => note.date.toDateString() === noteDate
      )
      
      if (existingNote) {
        return {
          ...state,
          dailyNotes: state.dailyNotes.map(note =>
            note.id === existingNote.id
              ? { ...note, content: action.payload.content, updatedAt: new Date() }
              : note
          )
        }
      } else {
        return {
          ...state,
          dailyNotes: [...state.dailyNotes, {
            id: Date.now().toString(),
            date: new Date(action.payload.date),
            content: action.payload.content,
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        }
      }
    case 'SET_VIEW':
      return { ...state, view: action.payload }
    case 'SET_DATE':
      return { ...state, currentDate: action.payload }
    case 'LOAD_DATA':
    case 'IMPORT_DATA':
      return {
        ...state,
        habits: action.payload.habits.map(habit => ({
          ...habit,
          startDate: new Date(habit.startDate),
          endDate: habit.endDate ? new Date(habit.endDate) : undefined,
          createdAt: new Date(habit.createdAt)
        })),
        records: action.payload.records.map(record => ({
          ...record,
          date: new Date(record.date),
          createdAt: new Date(record.createdAt)
        })),
        dailyNotes: action.payload.dailyNotes.map(note => ({
          ...note,
          date: new Date(note.date),
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }))
      }
    default:
      return state
  }
}

const HabitContext = createContext<{
  state: HabitState
  dispatch: React.Dispatch<HabitAction>
  getHabitStats: (habitId: string) => HabitStats
  isHabitCompletedOnDate: (habitId: string, date: Date) => boolean
  getDayProgress: (date: Date) => number
  getDailyNote: (date: Date) => string
  exportHabitData: () => HabitData
  importHabitData: (data: HabitData) => void
} | null>(null)

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialState)
  const [storedData, setStoredData] = useLocalStorage<HabitData>('habit-data', initialHabitData)

  // 迁移旧数据 - 只在初始化时执行一次
  useEffect(() => {
    const migrateOldData = () => {
      try {
        // 检查是否有旧的分离数据
        const oldHabits = localStorage.getItem('habits')
        const oldRecords = localStorage.getItem('habit-records')
        const oldNotes = localStorage.getItem('daily-notes')
        
        if ((oldHabits && oldHabits !== '[]') || 
            (oldRecords && oldRecords !== '[]') || 
            (oldNotes && oldNotes !== '[]')) {
          
          console.log('HabitContext: Migrating old habit data...')
          
          const habits = oldHabits ? JSON.parse(oldHabits) : []
          const records = oldRecords ? JSON.parse(oldRecords) : []
          const dailyNotes = oldNotes ? JSON.parse(oldNotes) : []
          
          const migratedData: HabitData = {
            habits,
            records,
            dailyNotes,
            version: '1.0.0',
            lastUpdated: new Date().toISOString()
          }
          
          setStoredData(migratedData)
          
          // 删除旧数据
          localStorage.removeItem('habits')
          localStorage.removeItem('habit-records')
          localStorage.removeItem('daily-notes')
          
          console.log('HabitContext: Migration completed')
          return migratedData
        }
        
        return storedData
      } catch (error) {
        console.error('HabitContext: Migration failed:', error)
        return storedData
      }
    }
    
    const dataToLoad = migrateOldData()
    if (dataToLoad.habits.length > 0 || dataToLoad.records.length > 0 || dataToLoad.dailyNotes.length > 0) {
      dispatch({ type: 'LOAD_DATA', payload: dataToLoad })
    }
  }, []) // 空依赖，只在挂载时执行

  // 自动保存数据 - 只在数据变化时保存，移除定时器
  useEffect(() => {
    // 跳过初始渲染和数据加载时的保存
    if (state.habits.length === 0 && state.records.length === 0 && state.dailyNotes.length === 0) {
      return
    }

    const habitData: HabitData = {
      habits: state.habits,
      records: state.records,
      dailyNotes: state.dailyNotes,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
    setStoredData(habitData)
    console.log('HabitContext: Data saved automatically')
  }, [state.habits, state.records, state.dailyNotes, setStoredData])

  // 监听来自云端同步的数据更新
  useEffect(() => {
    const handleStorageChange = (event: CustomEvent | StorageEvent) => {
      if ('detail' in event && event.detail?.key === 'habit-data') {
        // 来自云端同步的更新
        try {
          const newData = JSON.parse(event.detail.newValue)
          console.log('HabitContext: Received cloud sync update')
          dispatch({ type: 'IMPORT_DATA', payload: newData })
        } catch (error) {
          console.error('HabitContext: Failed to parse cloud sync data:', error)
        }
      } else if (event instanceof StorageEvent && event.key === 'habit-data' && event.newValue) {
        // 来自其他标签页的更新
        try {
          const newData = JSON.parse(event.newValue)
          console.log('HabitContext: Received cross-tab update')
          dispatch({ type: 'IMPORT_DATA', payload: newData })
        } catch (error) {
          console.error('HabitContext: Failed to parse cross-tab data:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange as EventListener)
    window.addEventListener('storage', handleStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener)
      window.removeEventListener('storage', handleStorageChange as EventListener)
    }
  }, [])

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    return state.records.some(
      record => record.habitId === habitId && record.date.toDateString() === date.toDateString()
    )
  }

  const getHabitStats = (habitId: string): HabitStats => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) {
      return { habitId, currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 }
    }

    const habitRecords = state.records
      .filter(record => record.habitId === habitId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    const totalCompletions = habitRecords.length

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (isHabitCompletedOnDate(habitId, checkDate)) {
        currentStreak++
      } else if (i > 0) { // Don't break on today if not completed yet
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    const sortedDates = habitRecords.map(r => r.date).sort((a, b) => a.getTime() - b.getTime())
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0 || sortedDates[i].getTime() - sortedDates[i-1].getTime() === 86400000) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    let possibleDays = 0
    let completedDays = 0
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate >= habit.startDate && (!habit.endDate || checkDate <= habit.endDate)) {
        const dayOfWeek = checkDate.getDay()
        const shouldTrack = habit.frequency === 'daily' || 
          (habit.frequency === 'weekly' && habit.weekdays?.includes(dayOfWeek))
        
        if (shouldTrack) {
          possibleDays++
          if (isHabitCompletedOnDate(habitId, checkDate)) {
            completedDays++
          }
        }
      }
    }

    const completionRate = possibleDays > 0 ? (completedDays / possibleDays) * 100 : 0

    return {
      habitId,
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate: Math.round(completionRate)
    }
  }

  const getDayProgress = (date: Date) => {
    const activeHabits = state.habits.filter(habit => {
      if (!habit.isActive) return false
      
      // 标准化日期进行比较，避免时区问题
      const checkDate = new Date(date)
      checkDate.setHours(12, 0, 0, 0) // 设置为中午避免时区问题
      
      const habitStartDate = new Date(habit.startDate)
      habitStartDate.setHours(0, 0, 0, 0)
      
      const habitEndDate = habit.endDate ? new Date(habit.endDate) : null
      if (habitEndDate) {
        habitEndDate.setHours(23, 59, 59, 999)
      }
      
      if (checkDate < habitStartDate) return false
      if (habitEndDate && checkDate > habitEndDate) return false
      
      const dayOfWeek = checkDate.getDay()
      if (habit.frequency === 'weekly' && !habit.weekdays?.includes(dayOfWeek)) {
        return false
      }
      
      return true
    })

    if (activeHabits.length === 0) return 0

    const completedHabits = activeHabits.filter(habit =>
      isHabitCompletedOnDate(habit.id, date)
    )

    return Math.round((completedHabits.length / activeHabits.length) * 100)
  }

  const getDailyNote = (date: Date) => {
    const note = state.dailyNotes.find(
      note => note.date.toDateString() === date.toDateString()
    )
    return note?.content || ''
  }

  // 导出习惯数据
  const exportHabitData = (): HabitData => {
    return {
      habits: state.habits,
      records: state.records,
      dailyNotes: state.dailyNotes,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  }

  // 导入习惯数据
  const importHabitData = (data: HabitData) => {
    dispatch({ type: 'IMPORT_DATA', payload: data })
  }

  return (
    <HabitContext.Provider value={{
      state,
      dispatch,
      getHabitStats,
      isHabitCompletedOnDate,
      getDayProgress,
      getDailyNote,
      exportHabitData,
      importHabitData
    }}>
      {children}
    </HabitContext.Provider>
  )
}

export function useHabitContext() {
  const context = useContext(HabitContext)
  if (!context) {
    throw new Error('useHabitContext must be used within HabitProvider')
  }
  return context
}
