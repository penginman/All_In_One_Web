import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { CalendarEvent, CalendarView, CalendarState } from '../types/calendar'
import { useTaskContext } from './TaskContext'
import { useHabitContext } from './HabitContext'
import useLocalStorage from '../hooks/useLocalStorage'

type CalendarAction = 
  | { type: 'ADD_EVENT'; payload: Omit<CalendarEvent, 'id' | 'createdAt'> }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'TOGGLE_TASKS'; payload: boolean }
  | { type: 'TOGGLE_HABITS'; payload: boolean }
  | { type: 'LOAD_EVENTS'; payload: CalendarEvent[] }

const initialState: CalendarState = {
  events: [],
  currentDate: new Date(),
  view: 'month',
  showTasks: true,
  showHabits: true
}

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, {
          ...action.payload,
          id: Date.now().toString(),
          createdAt: new Date()
        }]
      }
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id
            ? { ...event, ...action.payload.updates }
            : event
        )
      }
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      }
    case 'SET_VIEW':
      return { ...state, view: action.payload }
    case 'SET_DATE':
      return { ...state, currentDate: action.payload }
    case 'TOGGLE_TASKS':
      return { ...state, showTasks: action.payload }
    case 'TOGGLE_HABITS':
      return { ...state, showHabits: action.payload }
    case 'LOAD_EVENTS':
      return {
        ...state,
        events: action.payload.map(event => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt)
        }))
      }
    default:
      return state
  }
}

const CalendarContext = createContext<{
  state: CalendarState
  dispatch: React.Dispatch<CalendarAction>
  allEvents: CalendarEvent[]
} | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState)
  const [storedEvents, setStoredEvents] = useLocalStorage<CalendarEvent[]>('calendar-events', [])
  const taskContext = useTaskContext()
  const habitContext = useHabitContext()

  // 初始化加载数据
  useEffect(() => {
    if (storedEvents.length > 0) {
      dispatch({ type: 'LOAD_EVENTS', payload: storedEvents })
    }
  }, []) // 空依赖，只在挂载时执行

  // 自动保存事件 - 只在数据变化时保存
  useEffect(() => {
    // 跳过初始渲染时的空数组保存
    if (state.events.length === 0) return
    
    setStoredEvents(state.events)
    console.log('CalendarContext: Events saved automatically')
  }, [state.events, setStoredEvents])

  // 合并所有事件（日程 + 任务 + 习惯）
  const allEvents = React.useMemo(() => {
    const events = [...state.events]
    
    // 添加任务事件
    if (state.showTasks && taskContext) {
      const taskEvents = taskContext.state.tasks
        .filter(task => !task.deletedAt && task.dueDate)
        .map(task => {
          const group = taskContext.state.groups.find(g => g.id === task.groupId)
          return {
            id: `task-${task.id}`,
            title: task.title,
            description: task.description,
            startDate: task.dueDate!,
            endDate: task.dueDate!,
            startTime: task.startTime,
            endTime: task.endTime,
            color: group?.color || '#3b82f6',
            category: 'task' as const,
            sourceId: task.id,
            createdAt: task.createdAt
          }
        })
      events.push(...taskEvents)
    }

    // 添加习惯事件
    if (state.showHabits && habitContext) {
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 30) // 显示过去30天的习惯完成情况
      
      const habitEvents: CalendarEvent[] = []
      
      // 为每个活跃习惯创建事件
      habitContext.state.habits
        .filter(habit => habit.isActive)
        .forEach(habit => {
          // 为过去30天中每一天检查是否完成了习惯
          for (let i = 0; i <= 30; i++) {
            const checkDate = new Date(startDate)
            checkDate.setDate(startDate.getDate() + i)
            
            const dayOfWeek = checkDate.getDay()
            const shouldShow = habit.frequency === 'daily' || 
              (habit.frequency === 'weekly' && habit.weekdays?.includes(dayOfWeek))
            
            if (shouldShow && habitContext.isHabitCompletedOnDate(habit.id, checkDate)) {
              habitEvents.push({
                id: `habit-${habit.id}-${checkDate.toDateString()}`,
                title: `✓ ${habit.name}`,
                description: `习惯完成：${habit.name}`,
                startDate: new Date(checkDate),
                endDate: new Date(checkDate),
                color: habit.color,
                category: 'habit' as const,
                sourceId: habit.id,
                createdAt: habit.createdAt
              })
            }
          }
        })
      
      events.push(...habitEvents)
    }
    
    return events
  }, [state.events, state.showTasks, state.showHabits, taskContext?.state.tasks, taskContext?.state.groups, habitContext?.state.habits, habitContext?.state.records, habitContext?.isHabitCompletedOnDate])

  return (
    <CalendarContext.Provider value={{ state, dispatch, allEvents }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider')
  }
  return context
}
