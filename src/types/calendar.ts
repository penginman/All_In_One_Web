export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  startTime?: string
  endTime?: string
  color: string
  category: 'event' | 'task' | 'habit'
  sourceId?: string // 关联的任务或习惯ID
  createdAt: Date
}

export type CalendarView = 'month' | 'week'

export interface CalendarState {
  events: CalendarEvent[]
  currentDate: Date
  view: CalendarView
  showTasks: boolean
  showHabits: boolean
}
