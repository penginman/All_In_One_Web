import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useCalendarContext } from '../../context/CalendarContext'
import { CalendarEvent } from '../../types/calendar'

interface WeekViewProps {
  onEventClick: (event: CalendarEvent) => void
}

function WeekView({ onEventClick }: WeekViewProps) {
  const { state, dispatch, allEvents } = useCalendarContext()
  const currentDate = state.currentDate

  // 获取当前周的开始和结束日期
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

  const weekDates = getWeekDates(currentDate)

  // 生成时间轴
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // 获取指定日期的定时事件
  const getTimedEventsForDate = (date: Date) => {
    return allEvents.filter(event => {
      const eventDate = event.startDate
      return eventDate.toDateString() === date.toDateString() && event.startTime
    })
  }

  // 获取指定日期的全天事件
  const getAllDayEventsForDate = (date: Date) => {
    return allEvents.filter(event => {
      const eventStartDate = new Date(event.startDate)
      const eventEndDate = new Date(event.endDate)
      const checkDate = new Date(date)
      
      // 重置时间部分以进行日期比较
      eventStartDate.setHours(0, 0, 0, 0)
      eventEndDate.setHours(23, 59, 59, 999)
      checkDate.setHours(12, 0, 0, 0)
      
      return checkDate >= eventStartDate && checkDate <= eventEndDate && !event.startTime
    })
  }

  // 计算事件在时间轴上的位置
  const getEventPosition = (event: CalendarEvent) => {
    if (!event.startTime) return null
    
    const [startHour, startMinute] = event.startTime.split(':').map(Number)
    const startPercent = (startHour + startMinute / 60) / 24 * 100
    
    let duration = 1 // 默认1小时
    if (event.endTime) {
      const [endHour, endMinute] = event.endTime.split(':').map(Number)
      duration = (endHour + endMinute / 60) - (startHour + startMinute / 60)
    }
    
    const heightPercent = duration / 24 * 100
    
    return {
      top: `${startPercent}%`,
      height: `${Math.max(heightPercent, 2)}%` // 最小高度2%
    }
  }

  // 导航函数
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    dispatch({ type: 'SET_DATE', payload: newDate })
  }

  const goToToday = () => {
    dispatch({ type: 'SET_DATE', payload: new Date() })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="flex flex-col h-full">
      {/* 周导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
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

      {/* 日期标题 */}
      <div className="grid grid-cols-8 gap-px mb-4 bg-gray-50 rounded-lg overflow-hidden">
        <div className="p-3 text-sm font-medium text-gray-500">时间</div>
        {weekDates.map((date, index) => (
          <div
            key={index}
            className={`p-3 text-center transition-all ${
              isToday(date) 
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-900'
            }`}
          >
            <div className="text-xs font-medium">
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][index]}
            </div>
            <div className={`text-lg font-semibold ${
              isToday(date) ? 'text-white' : 'text-gray-900'
            }`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* 全天事件区域 */}
      <div className="mb-4">
        <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-2 text-xs font-medium text-gray-500 flex items-center">
            全天
          </div>
          {weekDates.map((date, dayIndex) => {
            const allDayEvents = getAllDayEventsForDate(date)
            
            return (
              <div key={dayIndex} className="bg-white p-1 min-h-[40px]">
                <div className="space-y-1">
                  {allDayEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: event.color + '20',
                        borderLeft: `3px solid ${event.color}`,
                        color: event.color
                      }}
                      onClick={() => onEventClick(event)}
                      title={event.title}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 时间轴网格 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 gap-px bg-gray-200 min-h-full">
          {/* 时间列 */}
          <div className="bg-gray-50">
            {timeSlots.map(time => (
              <div
                key={time}
                className="h-12 border-b border-gray-200 flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-xs text-gray-500">{time}</span>
              </div>
            ))}
          </div>

          {/* 日期列 */}
          {weekDates.map((date, dayIndex) => {
            const timedEvents = getTimedEventsForDate(date)
            const isTodayDate = isToday(date)
            
            return (
              <div key={dayIndex} className={`relative ${
                isTodayDate ? 'bg-blue-50' : 'bg-white'
              }`}>
                {/* 时间网格线 */}
                {timeSlots.map((time, timeIndex) => (
                  <div
                    key={time}
                    className={`h-12 border-b transition-colors ${
                      isTodayDate ? 'border-blue-200 hover:bg-blue-100' : 'border-gray-100 hover:bg-blue-50'
                    }`}
                  />
                ))}
                
                {/* 事件块 */}
                {timedEvents.map(event => {
                  const position = getEventPosition(event)
                  if (!position) return null
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded p-1 cursor-pointer transition-all hover:shadow-md group"
                      style={{
                        ...position,
                        backgroundColor: event.color + '20',
                        borderLeft: `3px solid ${event.color}`,
                        zIndex: 1
                      }}
                      onClick={() => onEventClick(event)}
                      title={`${event.title}\n${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`}
                    >
                      <div className="text-xs font-medium truncate" style={{ color: event.color }}>
                        {event.title}
                      </div>
                      <div className="text-xs opacity-75" style={{ color: event.color }}>
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeekView
