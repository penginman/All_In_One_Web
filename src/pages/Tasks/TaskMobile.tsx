import React, { useState } from 'react'
import { 
  PlusIcon, 
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import { useTaskContext } from '../../context/TaskContext'
import TaskModal from '../../components/Tasks/TaskModal'
import Checkbox from '../../components/Common/Checkbox'
import { Task } from '../../types/tasks'

interface TaskMobileProps {}

function TaskMobile({}: TaskMobileProps) {
  const { state, dispatch } = useTaskContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showGroupSelect, setShowGroupSelect] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // 过滤任务
  const filteredTasks = state.tasks.filter(task => {
    if (state.selectedGroupId && task.groupId !== state.selectedGroupId) {
      return false
    }
    
    if (state.showDeleted) {
      return task.deletedAt
    }
    
    if (task.deletedAt) return false
    
    if (state.showCompleted) {
      return task.completed
    }
    
    return !task.completed
  })

  // 限制回收站显示条数
  const displayTasks = state.showDeleted ? filteredTasks.slice(0, 10) : filteredTasks

  // 获取任务所属分组信息
  const getTaskGroup = (groupId: string) => {
    return state.groups.find(g => g.id === groupId)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleCompleteTask = (taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', payload: taskId })
  }

  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId })
  }

  const handleRestoreTask = (taskId: string) => {
    dispatch({ type: 'RESTORE_TASK', payload: taskId })
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-400'
    }
  }

  const getPriorityText = (priority: string | null) => {
    switch (priority) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return ''
    }
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  const currentGroup = state.selectedGroupId 
    ? state.groups.find(g => g.id === state.selectedGroupId)
    : null

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGroupSelect(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
              >
                {currentGroup && (
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: currentGroup.color }}
                  />
                )}
                <span className="text-base font-medium text-gray-900 max-w-32 truncate">
                  {currentGroup?.name || '所有任务'}
                </span>
              </button>
              
              <button
                onClick={() => setShowFilter(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
            </div>

            {!state.showDeleted && (
              <button
                onClick={() => {
                  setEditingTask(null)
                  setIsModalOpen(true)
                }}
                className="h-10 bg-blue-500 text-white px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <PlusIcon className="w-3 h-3" />
                <span className="font-medium">新建</span>
              </button>
            )}
          </div>
          
          <div className="mt-3">
            <p className="text-sm text-gray-500">
              {displayTasks.length} 个任务
              {state.showDeleted && filteredTasks.length > 10 && (
                <span className="ml-1">(显示前 10 个)</span>
              )}
            </p>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto pb-safe">
          {displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="text-8xl mb-6">
                {state.showDeleted ? '🗑️' : state.showCompleted ? '✅' : '📝'}
              </div>
              <p className="text-gray-500 text-center mb-8 text-lg">
                {state.showDeleted ? '回收站为空' : state.showCompleted ? '暂无已完成任务' : '暂无待办任务'}
              </p>
              {!state.showDeleted && !state.showCompleted && (
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setIsModalOpen(true)
                  }}
                  className="bg-blue-500 text-white px-8 py-4 rounded-xl font-medium shadow-sm"
                >
                  创建第一个任务
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {displayTasks.map(task => {
                const taskGroup = getTaskGroup(task.groupId)
                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${
                      task.deletedAt ? 'opacity-60' : ''
                    }`}
                    onClick={() => !task.deletedAt && handleEditTask(task)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 完成状态 */}
                      {!task.deletedAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCompleteTask(task.id)
                          }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {task.completed && <CheckIcon className="w-4 h-4" />}
                        </button>
                      )}

                      {/* 任务内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-base leading-tight mb-2 ${
                              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h3>
                            
                            {/* 分组标签 */}
                            {!state.selectedGroupId && taskGroup && (
                              <div className="mb-2">
                                <span 
                                  className="inline-block px-2 py-1 rounded-md text-xs font-medium text-white"
                                  style={{ backgroundColor: taskGroup.color }}
                                >
                                  {taskGroup.name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              task.deletedAt ? handleRestoreTask(task.id) : handleDeleteTask(task.id)
                            }}
                            className={`p-2 rounded-lg ${
                              task.deletedAt 
                                ? 'text-green-500 bg-green-50' 
                                : 'text-red-500 bg-red-50'
                            }`}
                          >
                            {task.deletedAt ? (
                              <ArrowPathIcon className="w-5 h-5" />
                            ) : (
                              <TrashIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {/* 任务描述 */}
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* 任务元信息 */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          
                          {task.startTime && (
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="w-4 h-4" />
                              <span>
                                {task.startTime}
                                {task.endTime && ` - ${task.endTime}`}
                              </span>
                            </div>
                          )}
                          
                          {task.priority && (
                            <div className="flex items-center gap-1.5">
                              <FlagIcon className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                              <span className={getPriorityColor(task.priority)}>
                                {getPriorityText(task.priority)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 分组选择面板 */}
      {showGroupSelect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">选择分组</h3>
                <button
                  onClick={() => setShowGroupSelect(false)}
                  className="p-2 text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-80">
              <div className="p-6 space-y-3">
                <button
                  onClick={() => {
                    dispatch({ type: 'SELECT_GROUP', payload: null })
                    setShowGroupSelect(false)
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    state.selectedGroupId === null
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base font-medium">所有任务</span>
                </button>
                
                {state.groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      dispatch({ type: 'SELECT_GROUP', payload: group.id })
                      setShowGroupSelect(false)
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-colors flex items-center ${
                      state.selectedGroupId === group.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full mr-4"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="flex-1 text-base font-medium">{group.name}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {state.tasks.filter(t => t.groupId === group.id && !t.deletedAt && !t.completed).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选面板 */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">筛选选项</h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="p-2 text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <Checkbox
                  checked={state.showCompleted}
                  onChange={(checked) => dispatch({ type: 'TOGGLE_COMPLETED', payload: checked })}
                  label="显示已完成任务"
                />
                
                <Checkbox
                  checked={state.showDeleted}
                  onChange={(checked) => dispatch({ type: 'TOGGLE_DELETED', payload: checked })}
                  label="显示回收站"
                />
              </div>
              
              <button
                onClick={() => setShowFilter(false)}
                className="w-full bg-blue-500 text-white py-4 rounded-xl mt-8 font-medium text-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任务编辑弹窗 */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        groupId={state.selectedGroupId || undefined}
      />
    </>
  )
}

export default TaskMobile
