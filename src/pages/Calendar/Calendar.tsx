import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, EyeIcon, EyeSlashIcon, Bars3Icon } from '@heroicons/react/24/outline' // Added Bars3Icon
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
  const [isEventListVisible, setIsEventListVisible] = useState(true); // Renamed and controls visibility

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
    setDefaultDate(date)
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
    <div className="h-[calc(100vh-6rem)] flex"> {/* Removed space-x-6 */}
      {/* 左侧：日程列表 */}
      {isEventListVisible && (
        <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out mr-6"> {/* Added mr-6 */}
          <EventList
            onEventEdit={handleEventEdit}
            onEventAdd={handleNewEvent}
            onCollapse={() => setIsEventListVisible(false)} // Pass onCollapse to hide
          />
        </div>
      )}

      {/* 右侧：日历视图 */}
      <div className="flex-1 flex flex-col">
        {/* 头部控制栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {!isEventListVisible && (
              <button
                onClick={() => setIsEventListVisible(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2" // Added mr-2 for spacing from title
                title="显示日程列表"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">日程管理</h1>
            
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'month' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  state.view === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                月视图
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'week' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  state.view === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                周视图
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 显示选项 */}
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_TASKS', payload: !state.showTasks })}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                  state.showTasks 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {state.showTasks ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                <span>任务</span>
              </button>
              
              <button
                onClick={() => dispatch({ type: 'TOGGLE_HABITS', payload: !state.showHabits })}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                  state.showHabits 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {state.showHabits ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                <span>习惯</span>
              </button>
            </div>

            {/* 新建日程按钮 */}
            <button
              onClick={handleNewEvent}
              className="btn-primary flex items-center space-x-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>新建日程</span>
            </button>
          </div>
        </div>

        {/* 日历视图 */}
        <div className="flex-1 overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
