import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Habit } from '../../types/habits'
import { useHabitContext } from '../../context/HabitContext'

interface HabitModalProps {
  isOpen: boolean
  onClose: () => void
  habit?: Habit | null
}

const habitColors = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 黄色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#f97316', // 橙色
  '#84cc16', // 青绿色
]

const weekDays = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
]

function HabitModal({ isOpen, onClose, habit }: HabitModalProps) {
  const { dispatch } = useHabitContext()
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily' as 'daily' | 'weekly',
    weekdays: [] as number[],
    startDate: '',
    endDate: '',
    hasEndDate: false,
    color: habitColors[0]
  })

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        frequency: habit.frequency,
        weekdays: habit.weekdays || [],
        startDate: habit.startDate.toISOString().split('T')[0],
        endDate: habit.endDate ? habit.endDate.toISOString().split('T')[0] : '',
        hasEndDate: !!habit.endDate,
        color: habit.color
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        name: '',
        frequency: 'daily',
        weekdays: [],
        startDate: today,
        endDate: '',
        hasEndDate: false,
        color: habitColors[0]
      })
    }
  }, [habit, isOpen])

  const handleWeekdayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort()
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (formData.frequency === 'weekly' && formData.weekdays.length === 0) {
      alert('请选择至少一个星期几')
      return
    }

    const habitData = {
      name: formData.name.trim(),
      frequency: formData.frequency,
      weekdays: formData.frequency === 'weekly' ? formData.weekdays : undefined,
      startDate: new Date(formData.startDate),
      endDate: formData.hasEndDate && formData.endDate ? new Date(formData.endDate) : undefined,
      color: formData.color,
      isActive: true
    }

    if (habit) {
      dispatch({
        type: 'UPDATE_HABIT',
        payload: { id: habit.id, updates: habitData }
      })
    } else {
      dispatch({
        type: 'ADD_HABIT',
        payload: habitData
      })
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {habit ? '编辑习惯' : '新建习惯'}
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
            {/* 习惯名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                习惯名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：阅读30分钟"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* 频率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                频率 *
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: 'daily', weekdays: [] })}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    formData.frequency === 'daily'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  每天
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: 'weekly' })}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    formData.frequency === 'weekly'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  每周
                </button>
              </div>
            </div>

            {/* 每周的具体日期 */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择星期几 *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleWeekdayToggle(day.value)}
                      className={`px-2 py-1 text-sm rounded transition-colors ${
                        formData.weekdays.includes(day.value)
                          ? 'bg-blue-100 border-blue-500 text-blue-700 border'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 border'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 开始日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期 *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* 结束日期 */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="hasEndDate"
                  checked={formData.hasEndDate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    hasEndDate: e.target.checked,
                    endDate: e.target.checked ? formData.endDate : ''
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasEndDate" className="text-sm font-medium text-gray-700">
                  设置结束日期
                </label>
              </div>
              {formData.hasEndDate && (
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              )}
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                颜色
              </label>
              <div className="flex space-x-2 flex-wrap">
                {habitColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 按钮区域 */}
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
              {habit ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HabitModal
