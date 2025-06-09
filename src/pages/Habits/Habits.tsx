import React, { useState } from 'react'
import { 
  PlusIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FireIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { HabitProvider, useHabitContext } from '../../context/HabitContext'
import HabitModal from '../../components/Habits/HabitModal'
import DailyNoteModal from '../../components/Habits/DailyNoteModal'
import HabitStatsView from '../../components/Habits/HabitStatsView'
import HabitManagementView from '../../components/Habits/HabitManagementView'
import DayHabitsModal from '../../components/Habits/DayHabitsModal'
import { Habit } from '../../types/habits'

type ViewType = 'main' | 'stats' | 'management'

function HabitsContent() {
  const { 
    state, 
    dispatch, 
    getHabitStats, 
    isHabitCompletedOnDate, 
    getDayProgress,
    getDailyNote 
  } = useHabitContext()
  
  const [currentView, setCurrentView] = useState<ViewType>('main')
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [isDailyNoteModalOpen, setIsDailyNoteModalOpen] = useState(false)
  const [isDayHabitsModalOpen, setIsDayHabitsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [selectedNoteDate, setSelectedNoteDate] = useState<Date>(new Date())
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date())

  // 获取当前周的日期
  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    start.setDate(start.getDate() - day) // 从周日开始
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      dates.push(current)
    }
    return dates
  }

  const weekDates = getWeekDates(state.currentDate)
  const today = new Date()

  // 导航函数
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(state.currentDate)
    newDate.setDate(state.currentDate.getDate() + (direction === 'next' ? 7 : -7))
    dispatch({ type: 'SET_DATE', payload: newDate })
  }

  const goToToday = () => {
    dispatch({ type: 'SET_DATE', payload: new Date() })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  // 获取当日应该进行的习惯
  const getTodayHabits = () => {
    const todayDate = new Date()
    const dayOfWeek = todayDate.getDay()
    
    return state.habits.filter(habit => {
      if (!habit.isActive) return false
      if (todayDate < habit.startDate) return false
      if (habit.endDate && todayDate > habit.endDate) return false
      
      if (habit.frequency === 'weekly' && !habit.weekdays?.includes(dayOfWeek)) {
        return false
      }
      
      return true
    })
  }

  const todayHabits = getTodayHabits()

  // 切换习惯完成状态
  const toggleHabitCompletion = (habitId: string, date: Date) => {
    dispatch({
      type: 'TOGGLE_HABIT_RECORD',
      payload: { habitId, date }
    })
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setIsHabitModalOpen(true)
  }

  const handleDeleteHabit = (habitId: string) => {
    if (window.confirm('确定要删除这个习惯吗？这将删除所有相关的打卡记录。')) {
      dispatch({ type: 'DELETE_HABIT', payload: habitId })
    }
  }

  const handleOpenDailyNote = (date: Date) => {
    setSelectedNoteDate(date)
    setIsDailyNoteModalOpen(true)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDayDate(date)
    setIsDayHabitsModalOpen(true)
  }

  const renderCircularProgress = (progress: number, size: number = 60) => {
    const radius = (size - 4) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progress === 100 ? "#10b981" : "#3b82f6"}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${
            progress === 100 ? "text-green-600" : "text-blue-600"
          }`}>
            {progress}%
          </span>
        </div>
      </div>
    )
  }

  // 根据当前视图渲染不同内容
  if (currentView === 'stats') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('main')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回主页"
            >
              <HomeIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">习惯统计</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('management')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>习惯管理</span>
            </button>
          </div>
        </div>
        
        <HabitStatsView />
      </div>
    )
  }

  if (currentView === 'management') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('main')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回主页"
            >
              <HomeIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">习惯管理</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('stats')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>统计分析</span>
            </button>
            <button
              onClick={() => {
                setEditingHabit(null)
                setIsHabitModalOpen(true)
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>添加习惯</span>
            </button>
          </div>
        </div>
        
        <HabitManagementView
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
        />
      </div>
    )
  }

  // 主视图
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">习惯打卡</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('stats')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>统计分析</span>
          </button>
          <button
            onClick={() => setCurrentView('management')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>习惯管理</span>
          </button>
          <button
            onClick={() => {
              setEditingHabit(null)
              setIsHabitModalOpen(true)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>添加习惯</span>
          </button>
        </div>
      </div>

      {/* 周视图 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - 
              {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            今天
          </button>
        </div>

        {/* 周日期网格 */}
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayProgress = getDayProgress(date)
            const isTodayDate = isToday(date)
            const hasNote = getDailyNote(date).length > 0
            
            return (
              <div
                key={index}
                className={`text-center p-4 rounded-lg transition-all cursor-pointer relative ${
                  isTodayDate 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => handleDayClick(date)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDate ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][index]}
                </div>
                <div className={`text-2xl font-bold mb-3 ${
                  isTodayDate ? 'text-blue-800' : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* 圆形进度条 */}
                <div className="flex justify-center mb-2">
                  {renderCircularProgress(dayProgress, 50)}
                </div>
                
                {/* 小记标识 */}
                {hasNote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDailyNote(date)
                    }}
                    className="absolute top-2 right-2 p-1 hover:bg-orange-100 rounded"
                    title="查看小记"
                  >
                    <PencilIcon className="w-4 h-4 text-orange-500" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 今日习惯列表 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          今日习惯 ({todayHabits.filter(habit => isHabitCompletedOnDate(habit.id, today)).length}/{todayHabits.length})
        </h2>
        
        {todayHabits.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">今天没有需要打卡的习惯</p>
            <button
              onClick={() => {
                setEditingHabit(null)
                setIsHabitModalOpen(true)
              }}
              className="text-blue-500 hover:text-blue-600"
            >
              创建第一个习惯
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayHabits.map(habit => {
              const stats = getHabitStats(habit.id)
              const isCompleted = isHabitCompletedOnDate(habit.id, today)
              
              return (
                <div
                  key={habit.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleHabitCompletion(habit.id, today)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isCompleted && <CheckCircleIconSolid className="w-5 h-5" />}
                      </button>
                      <div>
                        <h3 className={`font-semibold ${
                          isCompleted ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {habit.name}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          {stats.currentStreak > 0 && (
                            <div className="flex items-center space-x-1">
                              <FireIcon className="w-4 h-4 text-orange-500" />
                              <span>{stats.currentStreak}天</span>
                            </div>
                          )}
                          <span>完成率: {stats.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditHabit(habit)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="编辑习惯"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="删除习惯"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 习惯详情 */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      频率: {habit.frequency === 'daily' ? '每天' : 
                             `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                    </div>
                    {stats.longestStreak > 0 && (
                      <div>最长连续: {stats.longestStreak}天</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 当日小记输入 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">当日小记</h2>
          <span className="text-sm text-gray-500">
            {today.toLocaleDateString('zh-CN', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </div>
        
        <button
          onClick={() => handleOpenDailyNote(today)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
        >
          <div className="flex items-center space-x-2">
            <PencilSquareIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500">
              {getDailyNote(today) || '点击添加今日小记...'}
            </span>
          </div>
        </button>
      </div>

      {/* 习惯编辑弹窗 */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false)
          setEditingHabit(null)
        }}
        habit={editingHabit}
      />

      {/* 每日小记弹窗 */}
      <DailyNoteModal
        isOpen={isDailyNoteModalOpen}
        onClose={() => setIsDailyNoteModalOpen(false)}
        date={selectedNoteDate}
      />

      {/* 当日习惯弹窗 */}
      <DayHabitsModal
        isOpen={isDayHabitsModalOpen}
        onClose={() => setIsDayHabitsModalOpen(false)}
        date={selectedDayDate}
        onOpenNote={handleOpenDailyNote}
      />
    </div>
  )
}

function Habits() {
  return (
    <HabitProvider>
      <HabitsContent />
    </HabitProvider>
  )
}

export default Habits
