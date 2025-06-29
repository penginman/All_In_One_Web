import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, FireIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { useHabitContext } from '../../context/HabitContext'

function HabitStatsView() {
  const { state, getHabitStats, getDayProgress, getDailyNote } = useHabitContext()
  const [currentDate, setCurrentDate] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)
  
  // 触摸滑动状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

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

  const getProgressColor = (progress: number, hasHabits: boolean = true) => {
    if (!hasHabits) return 'bg-gray-100'
    if (progress === 0) return 'bg-gray-100'
    if (progress === 100) return 'bg-emerald-500'
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-lime-500'
    if (progress >= 25) return 'bg-yellow-500'
    if (progress > 0) return 'bg-orange-400'
    return 'bg-gray-100'
  }

  // 计算总体统计
  const activeHabits = state.habits.filter(h => h.isActive)
  const totalStats = activeHabits.map(habit => getHabitStats(habit.id))
  const avgCompletionRate = totalStats.length > 0 
    ? Math.round(totalStats.reduce((sum, stat) => sum + stat.completionRate, 0) / totalStats.length)
    : 0

  // 滚轮支持
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const newDate = new Date(currentDate)
      if (e.deltaY > 0) {
        newDate.setMonth(currentMonth + 1)
      } else {
        newDate.setMonth(currentMonth - 1)
      }
      
      setCurrentDate(newDate)
    }

    const calendarElement = calendarRef.current
    if (calendarElement) {
      calendarElement.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        calendarElement.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentDate, currentMonth])

  // 触摸处理
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const minSwipeDistance = 50

    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      if (deltaX < 0) {
        navigateMonth('next')
      } else {
        navigateMonth('prev')
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 总体统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 text-center transition-all duration-300 hover:shadow-md">
          <div className={`text-lg lg:text-2xl font-bold ${activeHabits.length > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
            {activeHabits.length}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">活跃习惯</div>
        </div>
        <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 text-center transition-all duration-300 hover:shadow-md">
          <div className={`text-lg lg:text-2xl font-bold ${avgCompletionRate > 0 ? 'text-green-600' : 'text-gray-300'}`}>
            {avgCompletionRate}%
          </div>
          <div className="text-xs lg:text-sm text-gray-600">平均完成率</div>
        </div>
        <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 text-center transition-all duration-300 hover:shadow-md">
          <div className={`text-lg lg:text-2xl font-bold ${totalStats.length > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
            {totalStats.length > 0 ? Math.max(...totalStats.map(s => s.currentStreak), 0) : 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">最长连续</div>
        </div>
        <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 text-center transition-all duration-300 hover:shadow-md">
          <div className={`text-lg lg:text-2xl font-bold ${totalStats.length > 0 ? 'text-purple-600' : 'text-gray-300'}`}>
            {totalStats.reduce((sum, stat) => sum + stat.totalCompletions, 0)}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">总完成次数</div>
        </div>
      </div>

      {/* 月视图热力图 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900">月度完成热力图</h3>
          <div className="flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 lg:p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 active:scale-95"
            >
              <ChevronLeftIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </button>
            <h4 className="text-xs lg:text-sm font-medium text-gray-900 min-w-[70px] lg:min-w-[100px] text-center">
              {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </h4>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 lg:p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 active:scale-95"
            >
              <ChevronRightIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-1 lg:mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div 
          ref={calendarRef}
          className="grid grid-cols-7 gap-1 select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {monthDates.map((date, index) => {
            const progress = getDayProgress(date)
            const note = getDailyNote(date)
            const isTodayDate = isToday(date)
            const isCurrentMonthDate = isCurrentMonth(date)
            
            // 检查该日期是否有活跃习惯 - 修复日期比较逻辑
            const dateHasActiveHabits = activeHabits.some(habit => {
              // 标准化日期进行比较，避免时区问题
              const checkDate = new Date(date)
              checkDate.setHours(12, 0, 0, 0) // 设置为中午避免时区问题
              
              const habitStartDate = new Date(habit.startDate)
              habitStartDate.setHours(0, 0, 0, 0)
              
              const habitEndDate = habit.endDate ? new Date(habit.endDate) : null
              if (habitEndDate) {
                habitEndDate.setHours(23, 59, 59, 999)
              }
              
              // 检查日期是否在习惯的有效期内
              if (checkDate < habitStartDate) return false
              if (habitEndDate && checkDate > habitEndDate) return false
              
              // 检查星期几是否匹配
              const dayOfWeek = checkDate.getDay()
              if (habit.frequency === 'weekly' && !habit.weekdays?.includes(dayOfWeek)) {
                return false
              }
              
              return true
            })
            
            // 调试：在控制台打印今天的信息
            if (isTodayDate) {
              console.log('Today debug (fixed):', {
                date: date.toDateString(),
                checkDateDay: date.getDay(),
                activeHabits: activeHabits.length,
                dateHasActiveHabits,
                progress,
                habits: activeHabits.map(h => ({
                  name: h.name,
                  frequency: h.frequency,
                  weekdays: h.weekdays,
                  startDate: h.startDate.toDateString(),
                  endDate: h.endDate?.toDateString()
                }))
              })
            }
            
            return (
              <div
                key={index}
                className={`relative ${
                  !isCurrentMonthDate ? 'opacity-30' : ''
                } ${
                  isTodayDate ? 'ring-1 ring-blue-400 rounded-lg' : ''
                }`}
                title={`${date.toLocaleDateString('zh-CN')} - 完成度: ${dateHasActiveHabits ? progress : 0}%${note ? '\n小记: ' + note : ''}`}
              >
                <div 
                  className={`w-full h-6 lg:h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 shadow-sm ${
                    getProgressColor(progress, dateHasActiveHabits)
                  } ${
                    progress > 50 && dateHasActiveHabits ? 'text-white' : 'text-gray-700'
                  } ${
                    isTodayDate ? 'shadow-md' : ''
                  }`}
                >
                  <span className="text-xs leading-none font-semibold">
                    {date.getDate()}
                  </span>
                </div>
                {note && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full shadow-sm border border-white"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-3 mt-2 lg:mt-3 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded shadow-sm"></div>
            <span className="text-xs">无/0%</span>
          </div>
          {activeHabits.length > 0 && (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-400 rounded shadow-sm"></div>
                <span className="text-xs">1-24%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded shadow-sm"></div>
                <span className="text-xs">25-49%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-lime-500 rounded shadow-sm"></div>
                <span className="text-xs">50-74%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded shadow-sm"></div>
                <span className="text-xs">75-99%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm"></div>
                <span className="text-xs">100%</span>
              </div>
            </>
          )}
        </div>

        {/* 无习惯提示 */}
        {activeHabits.length === 0 && (
          <div className="text-center mt-2 lg:mt-3">
            <p className="text-xs text-gray-400">暂无活跃习惯，所有日期显示为灰色</p>
          </div>
        )}

        {/* 手机端滑动提示 */}
        <div className="lg:hidden text-center mt-1">
          <div className="text-xs text-gray-400">
            左滑下月 · 右滑上月
          </div>
        </div>
      </div>

      {/* 习惯详细统计 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-6">习惯详细统计</h3>
        
        {activeHabits.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <div className="w-14 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FireIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm lg:text-base">暂无活跃习惯</p>
            <p className="text-gray-300 text-xs lg:text-sm mt-1">添加习惯开始统计分析</p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {activeHabits.map(habit => {
              const stats = getHabitStats(habit.id)
              
              return (
                <div key={habit.id} className="border border-gray-100 rounded-lg lg:rounded-xl p-3 lg:p-4 transition-all duration-300 hover:shadow-md bg-gradient-to-r from-white to-gray-50/30">
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div 
                        className="w-3 h-3 lg:w-4 lg:h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: habit.color }}
                      />
                      <h4 className="font-medium text-gray-900 text-sm lg:text-base">{habit.name}</h4>
                    </div>
                    <div className="text-xs lg:text-sm text-gray-500">
                      {habit.frequency === 'daily' ? '每天' : 
                       `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <FireIcon className="w-3 h-3 lg:w-4 lg:h-4 text-orange-500" />
                        <span className="text-sm lg:text-lg font-semibold text-gray-900">
                          {stats.currentStreak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">当前连续</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <TrophyIcon className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-500" />
                        <span className="text-sm lg:text-lg font-semibold text-gray-900">
                          {stats.longestStreak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">最长连续</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm lg:text-lg font-semibold text-gray-900 mb-1">
                        {stats.completionRate}%
                      </div>
                      <div className="text-xs text-gray-600">完成率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm lg:text-lg font-semibold text-gray-900 mb-1">
                        {stats.totalCompletions}
                      </div>
                      <div className="text-xs text-gray-600">总完成</div>
                    </div>
                  </div>
                  
                  {/* 完成率进度条 */}
                  <div className="mt-2 lg:mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 lg:h-2 rounded-full transition-all duration-500"
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
