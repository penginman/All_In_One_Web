import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, EyeIcon, EyeSlashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { CalendarProvider, useCalendarContext } from '../../context/CalendarContext'
import { useTaskContext } from '../../context/TaskContext'
import { CalendarEvent } from '../../types/calendar'
import MonthView from '../../components/Calendar/MonthView'
import WeekView from '../../components/Calendar/WeekView'
import EventModal from '../../components/Calendar/EventModal'
import EventList from '../../components/Calendar/EventList'

function CalendarContent() {
  const { state, dispatch } = useCalendarContext()
  const taskContext = useTaskContext()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()
  
  // 响应式默认值：电脑端默认打开，手机端默认关闭
  const [isEventListVisible, setIsEventListVisible] = useState(() => {
    return window.innerWidth >= 1024 // lg断点
  })

  const handleEventClick = (event: CalendarEvent) => {
    if (event.category === 'event') {
      setEditingEvent(event)
      setIsModalOpen(true)
    } else if (event.category === 'task' && event.sourceId) {
      // 跳转到对应的任务分组
      const task = taskContext.state.tasks.find(t => t.id === event.sourceId)
      if (task) {
        // 设置选中的分组并跳转到任务页面
        taskContext.dispatch({ type: 'SELECT_GROUP', payload: task.groupId })
        navigate('/tasks')
      }
    }
  }

  const handleDateDoubleClick = (date: Date) => {
    setEditingEvent(null)
    // 确保创建正确的日期，避免时区问题
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    console.log('Double clicked date:', selectedDate) // 调试用
    setDefaultDate(selectedDate)
    setIsModalOpen(true)
  }

  const handleNewEvent = () => {
    setEditingEvent(null)
    setDefaultDate(undefined)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setDefaultDate(undefined)
  }

  const handleEventEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row">
      {/* 桌面端侧边栏 */}
      {isEventListVisible && (
        <div className="hidden lg:block lg:w-80 lg:mr-6 flex-shrink-0">
          <EventList
            onEventEdit={handleEventEdit}
            onEventAdd={handleNewEvent}
            onCollapse={() => setIsEventListVisible(false)}
          />
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 头部控制栏 */}
        <div className="flex flex-col space-y-3 mb-4 lg:mb-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* 顶部行：标题和菜单按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={() => setIsEventListVisible(!isEventListVisible)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:inline-block hidden"
                title={isEventListVisible ? "隐藏日程列表" : "显示日程列表"}
              >
                <Bars3Icon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
              </button>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">日程管理</h1>
            </div>

            {/* 手机端新建按钮 */}
            <button
              onClick={handleNewEvent}
              className="lg:hidden p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {/* 底部行：控制选项 */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'month' })}
                className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.view === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                月视图
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'week' })}
                className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.view === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                周视图
              </button>
            </div>

            <div className="flex items-center justify-between lg:justify-start lg:space-x-4">
              {/* 显示选项 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_TASKS', payload: !state.showTasks })}
                  className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    state.showTasks 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {state.showTasks ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                  <span className="hidden sm:inline">任务</span>
                </button>
                
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_HABITS', payload: !state.showHabits })}
                  className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    state.showHabits 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {state.showHabits ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                  <span className="hidden sm:inline">习惯</span>
                </button>
              </div>

              {/* 桌面端新建按钮 */}
              <button
                onClick={handleNewEvent}
                className="hidden lg:flex btn-primary items-center space-x-2 px-4 py-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>新建日程</span>
              </button>
            </div>
          </div>
        </div>

        {/* 手机端：可滚动的页面布局 */}
        <div className="lg:hidden flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* 月视图容器 - 固定高度3/4屏 */}
            <div className="h-[calc(75vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {state.view === 'month' ? (
                <MonthView 
                  onEventClick={handleEventClick}
                  onDateDoubleClick={handleDateDoubleClick}
                />
              ) : (
                <WeekView 
                  onEventClick={handleEventClick}
                />
              )}
            </div>

            {/* 日程列表 - 完整显示 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <EventList
                onEventEdit={handleEventEdit}
                onEventAdd={handleNewEvent}
                onCollapse={() => {}} // 手机端不需要收起功能
              />
            </div>
          </div>
        </div>

        {/* 桌面端：原有布局 */}
        <div className="hidden lg:block flex-1 overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {state.view === 'month' ? (
            <MonthView 
              onEventClick={handleEventClick}
              onDateDoubleClick={handleDateDoubleClick}
            />
          ) : (
            <WeekView 
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* 日程编辑弹窗 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={editingEvent}
        defaultDate={defaultDate}
      />
    </div>
  )
}

function Calendar() {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  )
}

export default Calendar
