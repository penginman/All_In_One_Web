import React, { useState } from 'react'
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { TaskProvider, useTaskContext } from '../../context/TaskContext'
import TaskModal from '../../components/Tasks/TaskModal'
import Checkbox from '../../components/Common/Checkbox'
import { Task } from '../../types/tasks'

function TasksContent() {
  const { state, dispatch } = useTaskContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  // 过滤任务
  const filteredTasks = state.tasks.filter(task => {
    // 按分组过滤
    if (state.selectedGroupId && task.groupId !== state.selectedGroupId) {
      return false
    }
    
    // 按状态过滤
    if (state.showDeleted) {
      return task.deletedAt
    }
    
    if (task.deletedAt) return false
    
    if (state.showCompleted) {
      return task.completed
    }
    
    return !task.completed
  })

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      dispatch({
        type: 'ADD_GROUP',
        payload: {
          name: newGroupName.trim(),
          color: '#3b82f6',
          order: state.groups.length
        }
      })
      setNewGroupName('')
      setShowNewGroupInput(false)
    }
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

  const handleDeleteGroup = (groupId: string) => {
    if (groupId === '1') {
      alert('通用事件不能删除')
      return
    }
    if (window.confirm('确定要删除这个分组吗？分组中的任务将移动到通用事件。')) {
      dispatch({ type: 'DELETE_GROUP', payload: groupId })
      setGroupMenuOpen(null)
    }
  }

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverGroup(null)
  }

  const handleDragOver = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverGroup(groupId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // 只有当鼠标真正离开元素时才清除高亮
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverGroup(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    
    if (taskId && draggedTask === taskId) {
      const task = state.tasks.find(t => t.id === taskId)
      if (task && task.groupId !== (targetGroupId || '1')) {
        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            id: taskId,
            updates: { groupId: targetGroupId || '1' }
          }
        })
      }
    }
    
    setDraggedTask(null)
    setDragOverGroup(null)
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

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-full">
      {/* 左侧分组栏 */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="flex-1">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">分组</h2>
            
            {/* 分组列表 */}
            <div className="space-y-1">
              <button
                onClick={() => dispatch({ type: 'SELECT_GROUP', payload: null })}
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  state.selectedGroupId === null
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${
                  dragOverGroup === null && draggedTask 
                    ? 'ring-2 ring-blue-400 bg-blue-50' 
                    : ''
                }`}
              >
                所有任务
              </button>
              
              {state.groups.map(group => (
                <div 
                  key={group.id} 
                  className="relative group"
                  onMouseLeave={() => setGroupMenuOpen(null)}
                >
                  <button
                    onClick={() => dispatch({ type: 'SELECT_GROUP', payload: group.id })}
                    onDragOver={(e) => handleDragOver(e, group.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, group.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center ${
                      state.selectedGroupId === group.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${
                      dragOverGroup === group.id && draggedTask 
                        ? 'ring-2 ring-blue-400 bg-blue-50' 
                        : ''
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="flex-1 truncate">{group.name}</span>
                    <span className="text-xs text-gray-500 mr-2">
                      {state.tasks.filter(t => t.groupId === group.id && !t.deletedAt && !t.completed).length}
                    </span>
                  </button>
                  
                  {/* 分组菜单 */}
                  {group.id !== '1' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setGroupMenuOpen(groupMenuOpen === group.id ? null : group.id)
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                    >
                      <EllipsisVerticalIcon className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                  
                  {/* 删除菜单 */}
                  {groupMenuOpen === group.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-10">
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        删除分组
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 添加分组 */}
            {showNewGroupInput ? (
              <div className="mt-2 flex space-x-1">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                  onBlur={() => {
                    if (!newGroupName.trim()) {
                      setShowNewGroupInput(false)
                    }
                  }}
                  placeholder="分组名称"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <button
                  onClick={handleAddGroup}
                  className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  <CheckIcon className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="w-full mt-2 px-3 py-2 text-left text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                新建分组
              </button>
            )}

            {/* 拖拽提示 */}
            {draggedTask && (
              <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">
                  📌 拖拽到分组上可快速移动任务
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 筛选选项 - 放在底部 */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">显示选项</div>
            
            <Checkbox
              checked={state.showCompleted}
              onChange={(checked) => dispatch({ type: 'TOGGLE_COMPLETED', payload: checked })}
              label="已完成任务"
            />
            
            <Checkbox
              checked={state.showDeleted}
              onChange={(checked) => dispatch({ type: 'TOGGLE_DELETED', payload: checked })}
              label="回收站"
            />
          </div>
        </div>
      </div>

      {/* 右侧任务列表 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {state.selectedGroupId 
                  ? state.groups.find(g => g.id === state.selectedGroupId)?.name 
                  : '所有任务'
                }
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTasks.length} 个任务
              </p>
            </div>
            
            {!state.showDeleted && (
              <button
                onClick={() => {
                  setEditingTask(null)
                  setIsModalOpen(true)
                }}
                className="btn-primary flex items-center space-x-1"
              >
                <PlusIcon className="w-4 h-4" />
                <span>新建任务</span>
              </button>
            )}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                {state.showDeleted ? '🗑️' : state.showCompleted ? '✅' : '📝'}
              </div>
              <p className="text-gray-500">
                {state.showDeleted ? '回收站为空' : state.showCompleted ? '暂无已完成任务' : '暂无待办任务'}
              </p>
              {!state.showDeleted && !state.showCompleted && (
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setIsModalOpen(true)
                  }}
                  className="mt-3 text-blue-500 hover:text-blue-600 text-sm"
                >
                  创建第一个任务
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  draggable={!task.deletedAt && !state.showDeleted}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`card hover:shadow-md transition-all cursor-pointer border-l-4 ${
                    task.completed 
                      ? 'bg-gray-50 border-l-gray-300' 
                      : 'border-l-blue-400'
                  } ${task.deletedAt ? 'opacity-60' : ''} ${
                    draggedTask === task.id ? 'opacity-50 transform rotate-2' : ''
                  } ${
                    !task.deletedAt && !state.showDeleted ? 'hover:shadow-lg' : ''
                  }`}
                  onClick={() => !task.deletedAt && handleEditTask(task)}
                >
                  <div className="flex items-start space-x-3">
                    {/* 拖拽手柄提示 */}
                    {!task.deletedAt && !state.showDeleted && (
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1 h-4 bg-gray-300 rounded-full flex flex-col justify-center space-y-0.5">
                          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mx-auto"></div>
                          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mx-auto"></div>
                          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mx-auto"></div>
                        </div>
                      </div>
                    )}

                    {/* 完成状态 */}
                    {!task.deletedAt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteTask(task.id)
                        }}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {task.completed && <CheckIcon className="w-3 h-3" />}
                      </button>
                    )}

                    {/* 任务内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className={`font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-1 ml-2">
                          {task.deletedAt ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreTask(task.id)
                              }}
                              className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                              title="恢复任务"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTask(task.id)
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="删除任务"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 任务描述 */}
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* 任务元信息 */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        
                        {task.startTime && (
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>
                              {task.startTime}
                              {task.endTime && ` - ${task.endTime}`}
                            </span>
                          </div>
                        )}
                        
                        {task.priority && (
                          <div className="flex items-center space-x-1">
                            <FlagIcon className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                            <span className={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)}
                            </span>
                          </div>
                        )}

                        {task.repeat && task.repeat !== 'none' && (
                          <div className="flex items-center space-x-1">
                            <ArrowPathIcon className="w-3 h-3" />
                            <span>
                              {task.repeat === 'daily' ? '每日' :
                               task.repeat === 'weekly' ? '每周' :
                               task.repeat === 'monthly' ? '每月' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}

function Tasks() {
  return (
    <TaskProvider>
      <TasksContent />
    </TaskProvider>
  )
}

export default Tasks
