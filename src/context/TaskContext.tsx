import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Task, TaskGroup, TaskFilter } from '../types/tasks'
import useLocalStorage from '../hooks/useLocalStorage'

interface TaskState {
  tasks: Task[]
  groups: TaskGroup[]
  selectedGroupId: string | null
  filter: TaskFilter
  showCompleted: boolean
  showDeleted: boolean
}

type TaskAction = 
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'RESTORE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'ADD_GROUP'; payload: Omit<TaskGroup, 'id' | 'createdAt'> }
  | { type: 'UPDATE_GROUP'; payload: { id: string; updates: Partial<TaskGroup> } }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'SELECT_GROUP'; payload: string | null }
  | { type: 'SET_FILTER'; payload: TaskFilter }
  | { type: 'TOGGLE_COMPLETED'; payload: boolean }
  | { type: 'TOGGLE_DELETED'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: { tasks: Task[]; groups: TaskGroup[] } }

const defaultGroups: TaskGroup[] = [
  { id: '1', name: '通用事件', color: '#3b82f6', order: 0, createdAt: new Date() },
  { id: '2', name: '工作任务', color: '#ef4444', order: 1, createdAt: new Date() },
  { id: '3', name: '个人备忘', color: '#10b981', order: 2, createdAt: new Date() },
  { id: '4', name: '心愿清单', color: '#f59e0b', order: 3, createdAt: new Date() },
]

const initialState: TaskState = {
  tasks: [],
  groups: defaultGroups,
  selectedGroupId: '1',
  filter: 'all',
  showCompleted: false,
  showDeleted: false
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, {
          ...action.payload,
          id: Date.now().toString(),
          createdAt: new Date()
        }]
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, deletedAt: new Date() }
            : task
        )
      }
    case 'RESTORE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, deletedAt: undefined }
            : task
        )
      }
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { 
                ...task, 
                completed: !task.completed,
                completedAt: task.completed ? undefined : new Date()
              }
            : task
        )
      }
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, {
          ...action.payload,
          id: Date.now().toString(),
          createdAt: new Date()
        }]
      }
    case 'SELECT_GROUP':
      return { ...state, selectedGroupId: action.payload }
    case 'SET_FILTER':
      return { ...state, filter: action.payload }
    case 'TOGGLE_COMPLETED':
      return { ...state, showCompleted: action.payload }
    case 'TOGGLE_DELETED':
      return { ...state, showDeleted: action.payload }
    case 'DELETE_GROUP':
      const groupToDelete = action.payload
      // 将该分组下的任务移到通用事件
      const updatedTasks = state.tasks.map(task =>
        task.groupId === groupToDelete
          ? { ...task, groupId: '1' }
          : task
      )
      return {
        ...state,
        tasks: updatedTasks,
        groups: state.groups.filter(group => group.id !== groupToDelete),
        selectedGroupId: state.selectedGroupId === groupToDelete ? '1' : state.selectedGroupId
      }
    case 'LOAD_DATA':
      return {
        ...state,
        tasks: action.payload.tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          deletedAt: task.deletedAt ? new Date(task.deletedAt) : undefined
        })),
        groups: action.payload.groups.map(group => ({
          ...group,
          createdAt: new Date(group.createdAt)
        }))
      }
    default:
      return state
  }
}

const TaskContext = createContext<{
  state: TaskState
  dispatch: React.Dispatch<TaskAction>
} | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const [storedTasks, setStoredTasks] = useLocalStorage<Task[]>('tasks', [])
  const [storedGroups, setStoredGroups] = useLocalStorage<TaskGroup[]>('taskGroups', defaultGroups)

  // 初始化时加载本地数据
  useEffect(() => {
    if (storedTasks.length > 0 || storedGroups.length > 0) {
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          tasks: storedTasks,
          groups: storedGroups.length > 0 ? storedGroups : defaultGroups
        }
      })
    }
  }, [])

  // 数据变化时保存到本地存储
  useEffect(() => {
    setStoredTasks(state.tasks)
  }, [state.tasks, setStoredTasks])

  useEffect(() => {
    setStoredGroups(state.groups)
  }, [state.groups, setStoredGroups])

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider')
  }
  return context
}
