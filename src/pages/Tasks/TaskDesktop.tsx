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

  // 2. 添加拖拽处理函数
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleGroupDragOver = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault()
    setDragOverGroup(groupId)
  }

  const handleGroupDragLeave = (e: React.DragEvent) => {
    // 只有当离开整个分组区域时才清除高亮
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverGroup(null)
    }
  }

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault()
    if (!draggedTask) return
    
    const actualTargetGroupId = targetGroupId || '1' // 默认分组
    
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
                    <button
                      onClick={() => dispatch({ type: 'SELECT_GROUP', payload: group.id })}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                        state.selectedGroupId === group.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${
                        dragOverGroup === group.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="flex-1 truncate">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {state.tasks.filter(t => t.groupId === group.id && !t.deletedAt && !t.completed).length}
                      </span>
                    </button>
                    
                  
                  {/* 分组菜单 */}
                  {group.id !== '1' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGroupMenuOpen(groupMenuOpen === group.id ? null : group.id)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                      
                      {groupMenuOpen === group.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-32">
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            删除分组
                          </button>
                        </div>
                      )}
                    </>
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
                return (
                  <div
                    key={task.id}
                    draggable={!task.deletedAt}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={`group bg-white rounded-lg border border-gray-200 p-4 transition-all ${
                      task.deletedAt ? 'opacity-60' : 'hover:shadow-md cursor-pointer '
                    } ${ 
                      // 拖拽时，缩放和透明度变化，倾斜
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
                                {!task.deletedAt && (
                                  <div className="flex items-center gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                    <span className="text-xs">拖拽移动</span>
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
                          
                          {/* 操作按钮 */}
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

                        {/* 任务描述 */}
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

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
                )
              })}
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
