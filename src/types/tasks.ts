export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | null
  dueDate?: Date
  startTime?: string
  endTime?: string
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
  groupId: string
  createdAt: Date
  completedAt?: Date
  deletedAt?: Date
}

export interface TaskGroup {
  id: string
  name: string
  color: string
  order: number
  createdAt: Date
}

export type TaskFilter = 'all' | 'pending' | 'completed' | 'deleted'
