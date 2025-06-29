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
            strokeWidth="2"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progress === 100 ? "#10b981" : "#3b82f6"}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${
            progress === 100 ? "text-green-600" : "text-blue-600"
          }`} style={{ fontSize: '0.6rem' }}>
            {progress}%
          </span>
        </div>
      </div>
    )
  }

  // 根据当前视图渲染不同内容
  if (currentView === 'stats') {
    return (
      <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6 px-2 lg:px-0">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => setCurrentView('main')}
              className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              title="返回主页"
            >
              <HomeIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
            </button>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900">习惯统计</h1>
          </div>
          <div className="flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentView('main')}
              className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
            >
              <HomeIcon className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">返回主页</span>
            </button>
            <button
              onClick={() => setCurrentView('management')}
              className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
            >
              <Cog6ToothIcon className="w-3 h-3 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">习惯管理</span>
            </button>
          </div>
        </div>
        
        <HabitStatsView />
      </div>
    )
  }

  if (currentView === 'management') {
    return (
      <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6 px-2 lg:px-0">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => setCurrentView('main')}
              className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              title="返回主页"
            >
              <HomeIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
            </button>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900">习惯管理</h1>
          </div>
          <div className="flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentView('main')}
              className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
            >
              <HomeIcon className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">返回主页</span>
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
            >
              <ChartBarIcon className="w-3 h-3 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">统计分析</span>
            </button>
            <button
              onClick={() => {
                setEditingHabit(null)
                setIsHabitModalOpen(true)
              }}
              className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
            >
              <PlusIcon className="w-3 h-3 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">添加习惯</span>
            </button>
          </div>
        </div>
        
        <HabitManagementView
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
        />
        
        {/* 习惯编辑弹窗 - 在管理视图中也显示 */}
        <HabitModal
          isOpen={isHabitModalOpen}
          onClose={() => {
            setIsHabitModalOpen(false)
            setEditingHabit(null)
          }}
          habit={editingHabit}
        />
      </div>
    )
  }

  // 主视图
  return (
    <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6 px-2 lg:px-0">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">习惯打卡</h1>
        <div className="flex items-center space-x-1 lg:space-x-2">
          <button
            onClick={() => setCurrentView('stats')}
            className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
          >
            <ChartBarIcon className="w-3 h-3 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">统计分析</span>
          </button>
          <button
            onClick={() => setCurrentView('management')}
            className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
          >
            <Cog6ToothIcon className="w-3 h-3 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">习惯管理</span>
          </button>
          <button
            onClick={() => {
              setEditingHabit(null)
              setIsHabitModalOpen(true)
            }}
            className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 active:scale-95 flex items-center space-x-1 lg:space-x-2"
          >
            <PlusIcon className="w-3 h-3 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">添加习惯</span>
          </button>
        </div>
      </div>

      {/* 周视图 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <div className="flex items-center justify-between mb-3 lg:mb-6">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - 
              {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-0.5 lg:space-x-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-1 lg:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <ChevronLeftIcon className="w-3 h-3 lg:w-5 lg:h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-1 lg:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <ChevronRightIcon className="w-3 h-3 lg:w-5 lg:h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="px-2 py-1 lg:px-3 lg:py-1 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 active:scale-95 shadow-sm"
          >
            今天
          </button>
        </div>

        {/* 周日期网格 */}
        <div className="grid grid-cols-7 gap-1 lg:gap-4">
          {weekDates.map((date, index) => {
            const dayProgress = getDayProgress(date)
            const isTodayDate = isToday(date)
            const hasNote = getDailyNote(date).length > 0
            
            return (
              <div
                key={index}
                className={`text-center p-2 lg:p-4 rounded-lg lg:rounded-xl transition-all duration-300 cursor-pointer border ${
                  isTodayDate 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:shadow-sm active:scale-95'
                }`}
                onClick={() => handleDayClick(date)}
              >
                <div className={`text-xs lg:text-sm font-medium mb-1 lg:mb-2 ${
                  isTodayDate ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][index]}
                </div>
                <div className={`flex justify-center text-lg lg:text-3xl font-bold mb-2 lg:mb-3 ${
                  isTodayDate ? 'text-blue-800' : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* 圆形进度条 */}
                <div className="flex justify-center mb-1 lg:mb-2">
                  {renderCircularProgress(dayProgress, window.innerWidth >= 1024 ? 50 : 30)}
                </div>
                
                {/* 小记标识 */}
                {hasNote && (
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDailyNote(date)
                      }}
                      className="p-0.5 lg:p-1 hover:bg-orange-100 rounded transition-all duration-200 active:scale-95"
                      title="查看小记"
                    >
                      <PencilIcon className="w-2.5 h-2.5 lg:w-5 lg:h-5 text-orange-500" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 今日习惯列表 */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-6">
          今日习惯 ({todayHabits.filter(habit => isHabitCompletedOnDate(habit.id, today)).length}/{todayHabits.length})
        </h2>
        
        {todayHabits.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <div className="w-14 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm lg:text-base mb-4">今天没有需要打卡的习惯</p>
            <button
              onClick={() => {
                setEditingHabit(null)
                setIsHabitModalOpen(true)
              }}
              className="text-blue-500 hover:text-blue-600 text-sm lg:text-base transition-colors"
            >
              创建第一个习惯
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {todayHabits.map(habit => {
              const stats = getHabitStats(habit.id)
              const isCompleted = isHabitCompletedOnDate(habit.id, today)
              
              return (
                <div
                  key={habit.id}
                  className={`p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <button
                        onClick={() => toggleHabitCompletion(habit.id, today)}
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-95 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white shadow-sm'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isCompleted && <CheckCircleIconSolid className="w-3 h-3 lg:w-5 lg:h-5" />}
                      </button>
                      <div>
                        <h3 className={`font-semibold text-sm lg:text-base ${
                          isCompleted ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {habit.name}
                        </h3>
                        <div className="flex items-center space-x-2 lg:space-x-3 text-xs lg:text-sm text-gray-600">
                          {stats.currentStreak > 0 && (
                            <div className="flex items-center space-x-1">
                              <FireIcon className="w-3 h-3 lg:w-4 lg:h-4 text-orange-500" />
                              <span>{stats.currentStreak}天</span>
                            </div>
                          )}
                          <span>完成率: {stats.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-0.5 lg:space-x-1">
                      <button
                        onClick={() => handleEditHabit(habit)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-all duration-200 active:scale-95"
                        title="编辑习惯"
                      >
                        <PencilSquareIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200 active:scale-95"
                        title="删除习惯"
                      >
                        <TrashIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 习惯详情 */}
                  <div className="text-xs text-gray-500 space-y-0.5 lg:space-y-1">
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
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-100/50 p-3 lg:p-6">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h2 className="text-lg font-semibold text-gray-900">当日小记</h2>
          <span className="text-xs lg:text-sm text-gray-500">
            {today.toLocaleDateString('zh-CN', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </div>
        
        <button
          onClick={() => handleOpenDailyNote(today)}
          className="w-full p-3 lg:p-4 border-2 border-dashed border-gray-300 rounded-lg lg:rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left active:scale-95"
        >
          <div className="flex items-center space-x-2">
            <PencilSquareIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
            <span className="text-gray-500 text-sm lg:text-base">
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
