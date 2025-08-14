import { useState } from 'react'
import { 
  PlusIcon, 
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { useTaskContext } from '../../context/TaskContext'
import TaskModal from '../../components/Tasks/TaskModal'
import Checkbox from '../../components/Common/Checkbox'
import { Task } from '../../types/tasks'

function TaskDesktop() {
  const { state, dispatch } = useTaskContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState<string | null>(null)

  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [dragOverTask, setDragOverTask] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)

  // 过滤和排序任务
  const filteredTasks = state.tasks
    .filter(task => {
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
    .sort((a, b) => {
      // 按创建时间排序，越早创建的越靠前
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

  // 限制回收站显示条数
  const displayTasks = state.showDeleted ? filteredTasks.slice(0, 10) : filteredTasks

  // 获取任务所属分组信息
  const getTaskGroup = (groupId: string) => {
    return state.groups.find(g => g.id === groupId)
  }

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

  // 任务拖拽排序处理函数
  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    if (task.deletedAt) return
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('task-id', task.id)
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
    setDragOverGroup(null)
    setDragOverTask(null)
    setDropPosition(null)
  }

  const handleTaskDragOver = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.id === targetTask.id) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position = e.clientY < midY ? 'before' : 'after'
    
    setDragOverTask(targetTask.id)
    setDropPosition(position)
  }

  const handleTaskDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTask(null)
      setDropPosition(null)
    }
  }

  const handleTaskDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedTask || draggedTask.id === targetTask.id) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position = e.clientY < midY ? 'before' : 'after'
    
    // 获取当前显示的任务列表（按当前顺序）
    const currentTasks = displayTasks
    const draggedTaskIndex = currentTasks.findIndex(t => t.id === draggedTask.id)
    const targetTaskIndex = currentTasks.findIndex(t => t.id === targetTask.id)
    
    if (draggedTaskIndex === -1 || targetTaskIndex === -1) return
    
    // 计算新的时间戳来重新排序
    let newTimestamp: number
    
    if (position === 'before') {
      // 插入到目标任务前面
      if (targetTaskIndex === 0) {
        // 插入到第一个位置
        newTimestamp = targetTask.createdAt.getTime() - 60000 // 减少1分钟
      } else {
        // 插入到两个任务之间
        const prevTask = currentTasks[targetTaskIndex - 1]
        newTimestamp = (prevTask.createdAt.getTime() + targetTask.createdAt.getTime()) / 2
      }
    } else {
      // 插入到目标任务后面
      if (targetTaskIndex === currentTasks.length - 1) {
        // 插入到最后一个位置
        newTimestamp = targetTask.createdAt.getTime() + 60000 // 增加1分钟
      } else {
        // 插入到两个任务之间
        const nextTask = currentTasks[targetTaskIndex + 1]
        newTimestamp = (targetTask.createdAt.getTime() + nextTask.createdAt.getTime()) / 2
      }
    }
    
    // 更新拖拽任务的时间戳
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: draggedTask.id,
        updates: { createdAt: new Date(newTimestamp) }
      }
    })
    
    setDraggedTask(null)
    setDragOverTask(null)
    setDropPosition(null)
  }

  // 分组拖拽处理函数（保持原有逻辑）
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (task.deletedAt) return
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverGroup(null)
  }

  const handleGroupDragOver = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault()
    setDragOverGroup(groupId)
  }

  const handleGroupDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverGroup(null)
    }
  }

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault()
    if (!draggedTask) return
    
    const actualTargetGroupId = targetGroupId || '1'
    
    if (draggedTask.groupId !== actualTargetGroupId) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: draggedTask.id,
          updates: { groupId: actualTargetGroupId }
        }
      })
    }
    
    setDraggedTask(null)
    setDragOverGroup(null)
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] relative">
      {/* 左侧分组栏 */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">分组</h2>
            
            {/* 分组列表 */}
            <div
              onDragOver={(e) => handleGroupDragOver(e, null)}
              onDragLeave={handleGroupDragLeave}
              onDrop={(e) => handleGroupDrop(e, '1')} // 拖到"所有任务"时移动到默认分组
            >
              <button
                onClick={() => dispatch({ type: 'SELECT_GROUP', payload: null })}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  state.selectedGroupId === null
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } `}
              >
                所有任务
              </button>
            </div>
              
              {state.groups.map(group => (
                <div
                    key={group.id}
                    className="relative"
                    onDragOver={(e) => handleGroupDragOver(e, group.id)}
                    onDragLeave={handleGroupDragLeave}
                    onDrop={(e) => handleGroupDrop(e, group.id)}
                  >
                    <div
                      className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        state.selectedGroupId === group.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${
                        dragOverGroup === group.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                      }`}
                    >
                      {/* 分组选择按钮区域 */}
                      <button
                        onClick={() => dispatch({ type: 'SELECT_GROUP', payload: group.id })}
                        className="flex items-center flex-1 text-left min-w-0"
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="flex-1 truncate">{group.name}</span>
                      </button>

                      {/* 分组菜单按钮 */}
                      {group.id !== '1' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setGroupMenuOpen(groupMenuOpen === group.id ? null : group.id)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* 待办数量徽章 */}
                      <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 text-xs font-medium flex-shrink-0 min-w-[24px] text-center">
                        {state.tasks.filter(t => t.groupId === group.id && !t.deletedAt && !t.completed).length}
                      </span>
                    </div>

                    {/* 分组菜单下拉框 */}
                    {group.id !== '1' && groupMenuOpen === group.id && (
                      <div
                        className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-32"
                        style={{ zIndex: 9999 }}
                      >
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
              <div className="mt-3 flex gap-2">
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <button
                  onClick={handleAddGroup}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="w-full mt-3 px-3 py-2 text-left text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                新建分组
              </button>
            )}
          </div>

        {/* 筛选选项 */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">显示选项</div>
          <div className="space-y-3">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {state.selectedGroupId 
                  ? state.groups.find(g => g.id === state.selectedGroupId)?.name 
                  : '所有任务'
                }
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {displayTasks.length} 个任务
                {state.showDeleted && filteredTasks.length > 10 && (
                  <span className="text-gray-400 ml-1">
                    (共 {filteredTasks.length} 个，显示前 10 个)
                  </span>
                )}
              </p>
            </div>
            
            {!state.showDeleted && (
              <button
                onClick={() => {
                  setEditingTask(null)
                  setIsModalOpen(true)
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>新建任务</span>
              </button>
            )}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {state.showDeleted ? '🗑️' : state.showCompleted ? '✅' : '📝'}
              </div>
              <p className="text-gray-500 mb-4">
                {state.showDeleted ? '回收站为空' : state.showCompleted ? '暂无已完成任务' : '暂无待办任务'}
              </p>
              {!state.showDeleted && !state.showCompleted && (
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setIsModalOpen(true)
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  创建第一个任务
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayTasks.map(task => {
                const taskGroup = getTaskGroup(task.groupId)
                const isDragOver = dragOverTask === task.id
                const showDropIndicator = isDragOver && dropPosition && draggedTask?.id !== task.id
                
                return (
                  <div key={task.id} className="relative">
                    {/* 拖拽指示器 - 上方 */}
                    {showDropIndicator && dropPosition === 'before' && (
                      <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                    )}
                    
                    <div
                      draggable={!task.deletedAt}
                      onDragStart={(e) => {
                        // 检查是否有分组选择，如果有则只能排序不能移动分组
                        if (state.selectedGroupId) {
                          handleTaskDragStart(e, task)
                        } else {
                          handleDragStart(e, task)
                        }
                      }}
                      onDragEnd={() => {
                        handleTaskDragEnd()
                        handleDragEnd()
                      }}
                      onDragOver={(e) => state.selectedGroupId ? handleTaskDragOver(e, task) : undefined}
                      onDragLeave={(e) => state.selectedGroupId ? handleTaskDragLeave(e) : undefined}
                      onDrop={(e) => state.selectedGroupId ? handleTaskDrop(e, task) : undefined}
                      className={`group bg-white rounded-lg border border-gray-200 p-4 transition-all ${
                        task.deletedAt ? 'opacity-60' : 'hover:shadow-md cursor-pointer '
                      } ${ 
                        draggedTask?.id === task.id ? 'opacity-30 scale-95 rotate-1' : ''
                      } ${
                        !task.deletedAt ? 'cursor-move' : ''
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
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">  
                              <h3 className={`font-medium ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              {/* 任务描述：放在标题下方，浅灰小字 */}
                              {task.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {/* 拖拽提示 */}
                              {!task.deletedAt && (
                                <div className="flex items-center gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                  <span className="text-xs">
                                    {state.selectedGroupId ? '拖拽排序' : '拖拽移动'}
                                  </span>
                                </div>
                              )}
                              {/* 分组标签 */}
                              {!state.selectedGroupId && taskGroup && (
                                <div className="mt-2">
                                  <span 
                                    className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: taskGroup.color }}
                                  >
                                    {taskGroup.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* 操作按钮：删除/恢复 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                task.deletedAt ? handleRestoreTask(task.id) : handleDeleteTask(task.id)
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                task.deletedAt 
                                  ? 'text-green-500 hover:bg-green-50' 
                                  : 'text-red-500 hover:bg-red-50'
                              }`}
                              title={task.deletedAt ? '恢复任务' : '删除任务'}
                            >
                              {task.deletedAt ? (
                                <ArrowPathIcon className="w-4 h-4" />
                              ) : (
                                <TrashIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {/* 任务元信息 */}
                          <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-gray-500">
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                            )}
                            
                            {task.startTime && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>
                                  {task.startTime}
                                  {task.endTime && ` - ${task.endTime}`}
                                </span>
                              </div>
                            )}
                            
                            {task.priority && (
                              <div className="flex items-center gap-1">
                                <FlagIcon className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                                <span className={getPriorityColor(task.priority)}>
                                  {getPriorityText(task.priority)}
                                </span>
                              </div>
                            )}

                            {task.repeat && task.repeat !== 'none' && (
                              <div className="flex items-center gap-1">
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

                    {/* 拖拽指示器 - 下方 */}
                    {showDropIndicator && dropPosition === 'after' && (
                      <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                    )}
                  </div>
                )})}
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

export default TaskDesktop
