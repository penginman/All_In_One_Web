import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { CalendarEvent, CalendarView, CalendarState } from '../types/calendar'
import { useTaskContext } from './TaskContext'
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

  // 初始化时加载本地数据
  useEffect(() => {
    if (storedEvents.length > 0) {
      dispatch({ type: 'LOAD_EVENTS', payload: storedEvents })
    }
  }, [])

  // 保存事件到本地存储
  useEffect(() => {
    setStoredEvents(state.events)
  }, [state.events, setStoredEvents])

  // 合并所有事件（日程 + 任务 + 习惯）- 实时更新
  const allEvents = React.useMemo(() => {
    const events = [...state.events]
    
    // 添加任务事件（包括有日期的任务，不管是否有具体时间）
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
    
    // TODO: 添加习惯数据
    // if (state.showHabits && habitContext) {
    //   const habitEvents = habitContext.state.habits
    //     .filter(habit => habit.isActive)
    //     .map(habit => ({
    //       id: `habit-${habit.id}`,
    //       title: habit.name,
    //       startDate: new Date(),
    //       endDate: new Date(),
    //       color: habit.color || '#10b981',
    //       category: 'habit' as const,
    //       sourceId: habit.id,
    //       createdAt: habit.createdAt
    //     }))
    //   events.push(...habitEvents)
    // }
    
    return events
  }, [state.events, state.showTasks, state.showHabits, taskContext?.state.tasks, taskContext?.state.groups])

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
