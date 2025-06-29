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
    <div className="space-y-4 lg:space-y-6">
      {/* 筛选器 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">习惯列表</h3>
          <div className="flex space-x-1 lg:space-x-2">
            {[{
              key: 'all',
              label: '全部',
              count: state.habits.length
            },
            {
              key: 'active',
              label: '活跃',
              count: state.habits.filter(h => h.isActive).length
            },
            {
              key: 'inactive',
              label: '已停用',
              count: state.habits.filter(h => !h.isActive).length
            }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex-1 lg:flex-none px-2 lg:px-3 py-1.5 lg:py-1 text-xs lg:text-sm rounded-lg transition-all duration-200 active:scale-95 ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
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
      <div className="space-y-3 lg:space-y-4">
        {filteredHabits.length === 0 ? (
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 text-center py-8 lg:py-12">
            <div className="w-14 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm lg:text-base">
              {filter === 'active' ? '暂无活跃习惯' : 
               filter === 'inactive' ? '暂无停用习惯' : '暂无习惯'}
            </p>
            <p className="text-gray-300 text-xs lg:text-sm mt-1">
              {filter === 'all' ? '创建第一个习惯开始养成好习惯' : ''}
            </p>
          </div>
        ) : (
          filteredHabits.map(habit => {
            const stats = getHabitStats(habit.id)
            
            return (
              <div key={habit.id} className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center justify-between">
                  <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                    <div 
                      className="w-3 h-3 lg:w-4 lg:h-4 rounded-full flex-shrink-0 mt-1 lg:mt-0 shadow-sm"
                      style={{ backgroundColor: habit.color }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-3 mb-3 lg:mb-2">
                        <h4 className={`font-medium text-base lg:text-base truncate ${
                          habit.isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {habit.name}
                        </h4>
                        {!habit.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full self-start">
                            已停用
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm lg:text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs lg:text-sm text-gray-500">频率</span>
                          <span className="mt-0.5">
                            {habit.frequency === 'daily' ? '每天' : 
                             `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs lg:text-sm text-gray-500">时间</span>
                          <span className="mt-0.5">{formatDateRange(habit.startDate, habit.endDate)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs lg:text-sm text-gray-500">连续</span>
                          <span className="mt-0.5">{stats.currentStreak}天</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs lg:text-sm text-gray-500">完成率</span>
                          <span className="mt-0.5">{stats.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end lg:justify-start space-x-2 lg:space-x-2 ml-0 lg:ml-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <button
                      onClick={() => toggleHabitActive(habit.id, !habit.isActive)}
                      className={`flex-1 lg:flex-none px-3 py-2 lg:p-2 rounded-lg transition-all duration-200 active:scale-95 text-sm lg:text-base ${
                        habit.isActive
                            ? 'text-green-600 bg-green-50 hover:bg-green-100 lg:text-green-500 lg:bg-transparent lg:hover:bg-green-50'
                            : 'text-orange-600 bg-orange-50 hover:bg-orange-100 lg:text-orange-500 lg:bg-transparent lg:hover:bg-orange-50'
                      }`}
                      title={habit.isActive ? '停用习惯' : '启用习惯'}
                    >
                      <span className="lg:hidden">{habit.isActive ? '停用' : '启用'}</span>
                      <span className="hidden lg:inline">
                        {habit.isActive ? 
                          <EyeIcon className="w-5 lg:h-5" /> : 
                          <EyeSlashIcon className="w-5 lg:h-5" />
                        }
                      </span>
                    </button>
                    
                    <button
                      onClick={() => onEditHabit(habit)}
                      className="flex-1 lg:flex-none px-3 py-2 lg:p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 lg:text-blue-500 lg:bg-transparent lg:hover:bg-blue-50 rounded-lg transition-all duration-200 active:scale-95 text-sm lg:text-base"
                      title="编辑习惯"
                    >
                      <span className="lg:hidden">编辑</span>
                      <PencilSquareIcon className="hidden lg:inline w-5 lg:h-5" />
                    </button>
                    
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="flex-1 lg:flex-none px-3 py-2 lg:p-2 text-red-600 bg-red-50 hover:bg-red-100 lg:text-red-500 lg:bg-transparent lg:hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-95 text-sm lg:text-base"
                      title="删除习惯"
                    >
                      <span className="lg:hidden">删除</span>
                      <TrashIcon className="hidden lg:inline w-5 lg:h-5" />
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                {habit.isActive && (
                  <div className="mt-4 lg:mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>近30天完成率</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 lg:h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 lg:h-2 rounded-full transition-all duration-500"
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
