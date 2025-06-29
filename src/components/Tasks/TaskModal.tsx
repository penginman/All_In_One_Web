import React, { useState, useEffect } from 'react'
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Task } from '../../types/tasks'
import { useTaskContext } from '../../context/TaskContext'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  groupId?: string
}

const priorityOptions = [
  {
    value: null,
    label: '无',
    color: 'bg-gray-100 text-gray-700'
  },
  {
    value: 'low',
    label: '低',
    color: 'bg-green-100 text-green-700'
  },
  {
    value: 'medium',
    label: '中',
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    value: 'high',
    label: '高',
    color: 'bg-red-100 text-red-700'
  }
]

function TaskModal({ isOpen, onClose, task, groupId }: TaskModalProps) {
  const { state, dispatch } = useTaskContext()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: null as 'low' | 'medium' | 'high' | null,
    dueDate: '',
    startTime: '',
    endTime: '',
    repeat: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    groupId: groupId || state.selectedGroupId || '1'
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        repeat: task.repeat || 'none',
        groupId: task.groupId
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: null,
        dueDate: '',
        startTime: '',
        endTime: '',
        repeat: 'none',
        groupId: groupId || state.selectedGroupId || '1'
      })
    }
  }, [task, groupId, state.selectedGroupId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      repeat: formData.repeat,
      groupId: formData.groupId,
      completed: false
    }

    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, updates: taskData }
      })
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: taskData
      })
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {task ? '编辑任务' : '新建任务'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入任务标题..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="添加任务描述..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* 分组和优先级 - 横向排列 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分组
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {state.groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <div className="flex space-x-1">
                  {priorityOptions.map(priority => (
                    <button
                      key={priority.value ?? 'none'}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: priority.value as typeof formData.priority })}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        formData.priority === priority.value
                          ? priority.color
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 日期和重复 - 横向排列 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  重复
                </label>
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="none">不重复</option>
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
            </div>

            {/* 时间段 - 横向排列 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  开始时间
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* 固定在底部的按钮 */}
          <div className="flex space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {task ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
