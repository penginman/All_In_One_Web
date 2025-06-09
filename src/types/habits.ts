export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  weekdays?: number[] // 0-6 (Sunday-Saturday) for weekly habits
  startDate: Date
  endDate?: Date // undefined means forever
  color: string
  isActive: boolean
  createdAt: Date
}

export interface HabitRecord {
  id: string
  habitId: string
  date: Date // Date when the habit was completed
  createdAt: Date
}

export interface DailyNote {
  id: string
  date: Date
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface HabitStats {
  habitId: string
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  completionRate: number // percentage
}

export interface HabitState {
  habits: Habit[]
  records: HabitRecord[]
  dailyNotes: DailyNote[]
  currentDate: Date
  view: 'week' | 'month'
}
