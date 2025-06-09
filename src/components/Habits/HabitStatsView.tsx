import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, FireIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { useHabitContext } from '../../context/HabitContext'

function HabitStatsView() {
  const { state, getHabitStats, getDayProgress, getDailyNote } = useHabitContext()
  const [currentDate, setCurrentDate] = useState(new Date())

  // 获取月份日期
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const dates = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  const monthDates = getMonthDates(currentDate)
  const currentMonth = currentDate.getMonth()
  const today = new Date()

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    if (progress > 0) return 'bg-red-500'
    return 'bg-gray-200'
  }

  // 计算总体统计
  const activeHabits = state.habits.filter(h => h.isActive)
  const totalStats = activeHabits.map(habit => getHabitStats(habit.id))
  const avgCompletionRate = totalStats.length > 0 
    ? Math.round(totalStats.reduce((sum, stat) => sum + stat.completionRate, 0) / totalStats.length)
    : 0

  return (
    <div className="space-y-6">
      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{activeHabits.length}</div>
          <div className="text-sm text-gray-600">活跃习惯</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{avgCompletionRate}%</div>
          <div className="text-sm text-gray-600">平均完成率</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.max(...totalStats.map(s => s.currentStreak), 0)}
          </div>
          <div className="text-sm text-gray-600">最长连续</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalStats.reduce((sum, stat) => sum + stat.totalCompletions, 0)}
          </div>
          <div className="text-sm text-gray-600">总完成次数</div>
        </div>
      </div>

      {/* 月视图热力图 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">月度完成热力图</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h4 className="text-lg font-medium text-gray-900">
                {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {monthDates.map((date, index) => {
            const progress = getDayProgress(date)
            const note = getDailyNote(date)
            const isTodayDate = isToday(date)
            const isCurrentMonthDate = isCurrentMonth(date)
            
            return (
              <div
                key={index}
                className={`aspect-square p-1 rounded transition-all relative ${
                  !isCurrentMonthDate ? 'opacity-30' : ''
                } ${
                  isTodayDate ? 'ring-2 ring-blue-400' : ''
                }`}
                title={`${date.toLocaleDateString('zh-CN')} - 完成度: ${progress}%${note ? '\n小记: ' + note : ''}`}
              >
                <div 
                  className={`w-full h-full rounded flex items-center justify-center text-xs font-medium ${
                    getProgressColor(progress)
                  } ${
                    progress > 50 ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </div>
                {note && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>0%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>1-24%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>25-49%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>50-74%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>75-99%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 习惯详细统计 */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">习惯详细统计</h3>
        
        {activeHabits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无活跃习惯
          </div>
        ) : (
          <div className="space-y-4">
            {activeHabits.map(habit => {
              const stats = getHabitStats(habit.id)
              
              return (
                <div key={habit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <h4 className="font-medium text-gray-900">{habit.name}</h4>
                    </div>
                    <div className="text-sm text-gray-500">
                      {habit.frequency === 'daily' ? '每天' : 
                       `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <FireIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {stats.currentStreak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">当前连续</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <TrophyIcon className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {stats.longestStreak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">最长连续</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {stats.completionRate}%
                      </div>
                      <div className="text-xs text-gray-600">完成率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {stats.totalCompletions}
                      </div>
                      <div className="text-xs text-gray-600">总完成</div>
                    </div>
                  </div>
                  
                  {/* 完成率进度条 */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HabitStatsView
