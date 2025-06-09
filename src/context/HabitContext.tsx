import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Habit, HabitRecord, DailyNote, HabitState, HabitStats } from '../types/habits'
import useLocalStorage from '../hooks/useLocalStorage'

type HabitAction =
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'createdAt'> }
  | { type: 'UPDATE_HABIT'; payload: { id: string; updates: Partial<Habit> } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT_RECORD'; payload: { habitId: string; date: Date } }
  | { type: 'ADD_DAILY_NOTE'; payload: { date: Date; content: string } }
  | { type: 'UPDATE_DAILY_NOTE'; payload: { date: Date; content: string } }
  | { type: 'SET_VIEW'; payload: 'week' | 'month' }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'LOAD_DATA'; payload: { habits: Habit[]; records: HabitRecord[]; notes: DailyNote[] } }

const initialState: HabitState = {
  habits: [],
  records: [],
  dailyNotes: [],
  currentDate: new Date(),
  view: 'week'
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
        dailyNotes: action.payload.notes.map(note => ({
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
} | null>(null)

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialState)
  const [storedHabits, setStoredHabits] = useLocalStorage<Habit[]>('habits', [])
  const [storedRecords, setStoredRecords] = useLocalStorage<HabitRecord[]>('habit-records', [])
  const [storedNotes, setStoredNotes] = useLocalStorage<DailyNote[]>('daily-notes', [])

  // Load data on mount
  useEffect(() => {
    if (storedHabits.length > 0 || storedRecords.length > 0 || storedNotes.length > 0) {
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          habits: storedHabits,
          records: storedRecords,
          notes: storedNotes
        }
      })
    }
  }, [])

  // Save data when state changes
  useEffect(() => {
    setStoredHabits(state.habits)
  }, [state.habits, setStoredHabits])

  useEffect(() => {
    setStoredRecords(state.records)
  }, [state.records, setStoredRecords])

  useEffect(() => {
    setStoredNotes(state.dailyNotes)
  }, [state.dailyNotes, setStoredNotes])

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
      if (date < habit.startDate) return false
      if (habit.endDate && date > habit.endDate) return false
      
      const dayOfWeek = date.getDay()
      if (habit.frequency === 'weekly' && !habit.weekdays?.includes(dayOfWeek)) {
        return false
      }
      
      return true
    })

    if (activeHabits.length === 0) return 100

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

  return (
    <HabitContext.Provider value={{
      state,
      dispatch,
      getHabitStats,
      isHabitCompletedOnDate,
      getDayProgress,
      getDailyNote
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
