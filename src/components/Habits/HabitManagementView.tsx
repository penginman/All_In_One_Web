import React, { useState } from 'react'
import { 
  PencilSquareIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useHabitContext } from '../../context/HabitContext'
import { Habit } from '../../types/habits'

interface HabitManagementViewProps {
  onEditHabit: (habit: Habit) => void
  onDeleteHabit: (habitId: string) => void
}

function HabitManagementView({ onEditHabit, onDeleteHabit }: HabitManagementViewProps) {
  const { state, dispatch, getHabitStats } = useHabitContext()
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredHabits = state.habits.filter(habit => {
    switch (filter) {
      case 'active':
        return habit.isActive
      case 'inactive':
        return !habit.isActive
      default:
        return true
    }
  })

  const toggleHabitActive = (habitId: string, isActive: boolean) => {
    dispatch({
      type: 'UPDATE_HABIT',
      payload: { id: habitId, updates: { isActive } }
    })
  }

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = startDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    if (endDate) {
      const end = endDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      return `${start} - ${end}`
    }
    return `${start} - 永远`
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">习惯列表</h3>
          <div className="flex space-x-1">
            {[
              { key: 'all', label: '全部', count: state.habits.length },
              { key: 'active', label: '活跃', count: state.habits.filter(h => h.isActive).length },
              { key: 'inactive', label: '已停用', count: state.habits.filter(h => !h.isActive).length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 习惯列表 */}
      <div className="space-y-4">
        {filteredHabits.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'active' ? '暂无活跃习惯' : 
               filter === 'inactive' ? '暂无停用习惯' : '暂无习惯'}
            </p>
          </div>
        ) : (
          filteredHabits.map(habit => {
            const stats = getHabitStats(habit.id)
            
            return (
              <div key={habit.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className={`font-medium truncate ${
                          habit.isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {habit.name}
                        </h4>
                        {!habit.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            已停用
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">频率: </span>
                          {habit.frequency === 'daily' ? '每天' : 
                           `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                        </div>
                        <div>
                          <span className="font-medium">时间: </span>
                          {formatDateRange(habit.startDate, habit.endDate)}
                        </div>
                        <div>
                          <span className="font-medium">连续: </span>
                          {stats.currentStreak}天
                        </div>
                        <div>
                          <span className="font-medium">完成率: </span>
                          {stats.completionRate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleHabitActive(habit.id, !habit.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        habit.isActive
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-orange-500 hover:bg-orange-50'
                      }`}
                      title={habit.isActive ? '启用习惯' : '停用习惯'}
                    >
                      {habit.isActive ? 
                        <EyeIcon className="w-5 h-5" /> : 
                        <EyeSlashIcon  className="w-5 h-5" />
                      }
                    </button>
                    
                    <button
                      onClick={() => onEditHabit(habit)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑习惯"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除习惯"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                {habit.isActive && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>近30天完成率</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default HabitManagementView
