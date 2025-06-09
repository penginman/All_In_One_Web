import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useCalendarContext } from '../../context/CalendarContext'
import { CalendarEvent } from '../../types/calendar'

interface MonthViewProps {
  onEventClick: (event: CalendarEvent) => void
  onDateDoubleClick: (date: Date) => void
}

function MonthView({ onEventClick, onDateDoubleClick }: MonthViewProps) {
  const { state, dispatch, allEvents } = useCalendarContext()
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)

  const currentDate = state.currentDate
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 获取月份第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始

  // 生成日历网格
  const generateCalendarDays = () => {
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  // 获取指定日期的事件（包括跨天事件）
  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => {
      const eventStartDate = new Date(event.startDate)
      const eventEndDate = new Date(event.endDate)
      const checkDate = new Date(date)
      
      // 重置时间部分以进行日期比较
      eventStartDate.setHours(0, 0, 0, 0)
      eventEndDate.setHours(23, 59, 59, 999)
      checkDate.setHours(12, 0, 0, 0)
      
      return checkDate >= eventStartDate && checkDate <= eventEndDate
    })
  }

  // 导航函数
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month + (direction === 'next' ? 1 : -1))
    dispatch({ type: 'SET_DATE', payload: newDate })
  }

  const goToToday = () => {
    dispatch({ type: 'SET_DATE', payload: new Date() })
  }

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEvent(eventId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    if (draggedEvent) {
      const event = allEvents.find(e => e.id === draggedEvent)
      if (event && event.category === 'event') {
        const daysDiff = Math.floor((targetDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24))
        const newStartDate = new Date(targetDate)
        const newEndDate = new Date(event.endDate)
        newEndDate.setDate(newEndDate.getDate() + daysDiff)
        
        dispatch({
          type: 'UPDATE_EVENT',
          payload: {
            id: draggedEvent,
            updates: {
              startDate: newStartDate,
              endDate: newEndDate
            }
          }
        })
      }
    }
    setDraggedEvent(null)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  return (
    <div className="flex flex-col h-full">
      {/* 月份导航 - 简化版本 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          今天
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="p-1 text-center text-xs font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200">
        {calendarDays.map((date, index) => {
          const events = getEventsForDate(date)
          const isCurrentMonthDate = isCurrentMonth(date)
          const isTodayDate = isToday(date)
          
          return (
            <div
              key={index}
              className={`bg-white p-1 min-h-[70px] border transition-all ${
                !isCurrentMonthDate ? 'bg-gray-50' : ''
              } ${
                isTodayDate 
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 border-2 shadow-md' 
                  : 'border-gray-100'
              }`}
              onDoubleClick={() => onDateDoubleClick(date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
            >
              {/* 日期数字 */}
              <div className={`text-xs font-medium mb-1 flex items-center justify-between ${
                !isCurrentMonthDate ? 'text-gray-400' : 
                isTodayDate ? 'text-blue-700 font-bold' : 'text-gray-900'
              }`}>
                <span>{date.getDate()}</span>
                {isTodayDate && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              {/* 事件列表 */}
              <div className="space-y-0.5">
                {events.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    draggable={event.category === 'event'}
                    onDragStart={(e) => handleDragStart(e, event.id)}
                    onClick={() => onEventClick(event)}
                    className={`text-xs p-0.5 rounded truncate cursor-pointer transition-all ${
                      event.category === 'event' ? 'hover:shadow-sm' : ''
                    } ${draggedEvent === event.id ? 'opacity-50' : ''}`}
                    style={{ 
                      backgroundColor: event.color + '20',
                      borderLeft: `2px solid ${event.color}`,
                      color: event.color
                    }}
                    title={`${event.title}${event.startTime ? ` ${event.startTime}` : ''}`}
                  >
                    {event.startTime && (
                      <span className="text-xs opacity-75 mr-1">
                        {event.startTime.substring(0, 5)}
                      </span>
                    )}
                    {event.title}
                  </div>
                ))}
                {events.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{events.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthView
