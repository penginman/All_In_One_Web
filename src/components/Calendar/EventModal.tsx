import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CalendarEvent } from '../../types/calendar'
import { useCalendarContext } from '../../context/CalendarContext'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event?: CalendarEvent | null
  defaultDate?: Date
}

const eventColors = [
  '#3b82f6', // 蓝色
  '#ef4444', // 红色
  '#10b981', // 绿色
  '#f59e0b', // 黄色
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#f97316', // 橙色
  '#84cc16', // 青绿色
]

function EventModal({ isOpen, onClose, event, defaultDate }: EventModalProps) {
  const { dispatch } = useCalendarContext()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    color: eventColors[0]
  })

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0],
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        color: event.color
      })
    } else if (defaultDate) {
      const dateStr = defaultDate.toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        startDate: dateStr,
        endDate: dateStr,
        startTime: '',
        endTime: '',
        color: eventColors[0]
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        startDate: today,
        endDate: today,
        startTime: '',
        endTime: '',
        color: eventColors[0]
      })
    }
  }, [event, defaultDate])

  // 确保结束日期不早于开始日期
  const handleStartDateChange = (newStartDate: string) => {
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: prev.endDate < newStartDate ? newStartDate : prev.endDate
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    // 确保结束日期不能为空且不早于开始日期
    const endDate = formData.endDate || formData.startDate

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(endDate),
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      color: formData.color,
      category: 'event' as const
    }

    if (event) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: { id: event.id, updates: eventData }
      })
    } else {
      dispatch({
        type: 'ADD_EVENT',
        payload: eventData
      })
    }

    onClose()
  }

  const handleDelete = () => {
    if (event && window.confirm('确定要删除这个日程吗？')) {
      dispatch({ type: 'DELETE_EVENT', payload: event.id })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {event ? '编辑日程' : '新建日程'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日程标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入日程标题..."
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
              placeholder="添加描述..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期 *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期 *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* 时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              颜色
            </label>
            <div className="flex space-x-2">
              {eventColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    formData.color === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex space-x-3 pt-4">
            {event && event.category === 'event' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {event ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal
