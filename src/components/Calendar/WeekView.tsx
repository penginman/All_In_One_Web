import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useCalendarContext } from '../../context/CalendarContext'
import { CalendarEvent } from '../../types/calendar'

interface WeekViewProps {
  onEventClick: (event: CalendarEvent) => void
}

function WeekView({ onEventClick }: WeekViewProps) {
  const { state, dispatch, allEvents } = useCalendarContext()
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // 添加触摸滑动状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

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

  // 获取一周内所有有事件的时间段
  const getActiveTimeSlots = () => {
    const activeHours = new Set<number>()
    
    weekDates.forEach(date => {
      const timedEvents = getTimedEventsForDate(date)
      timedEvents.forEach(event => {
        if (event.startTime) {
          const [startHour] = event.startTime.split(':').map(Number)
          activeHours.add(startHour)
          
          // 如果有结束时间，也添加结束时间的小时
          if (event.endTime) {
            const [endHour] = event.endTime.split(':').map(Number)
            // 添加事件持续时间内的所有小时
            for (let i = startHour; i <= endHour; i++) {
              activeHours.add(i)
            }
          }
        }
      })
    })

    // 如果没有任何定时事件，返回空数组（只显示全天事件）
    if (activeHours.size === 0) {
      return []
    }

    // 转换为排序数组并生成时间槽
    return Array.from(activeHours).sort((a, b) => a - b).map(hour => 
      `${hour.toString().padStart(2, '0')}:00`
    )
  }

  const activeTimeSlots = getActiveTimeSlots()

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

  // 滚轮支持
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      if (e.deltaY > 0) {
        navigateWeek('next')
      } else {
        navigateWeek('prev')
      }
    }

    const calendarElement = calendarRef.current
    if (calendarElement) {
      calendarElement.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        calendarElement.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentDate])

  // 处理触摸滑动
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
        navigateWeek('next')
      } else {
        navigateWeek('prev')
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 周导航 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <h2 className="text-sm lg:text-xl font-bold text-gray-900">
            {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-0.5 lg:p-1.5 hover:bg-gray-100 rounded transition-all duration-200 active:scale-95"
            >
              <ChevronLeftIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-0.5 lg:p-1.5 hover:bg-gray-100 rounded transition-all duration-200 active:scale-95"
            >
              <ChevronRightIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-1.5 py-0.5 lg:px-3 lg:py-1.5 text-xs font-medium bg-blue-500 text-white rounded lg:rounded-lg hover:bg-blue-600 transition-all duration-200 active:scale-95 shadow-sm"
        >
          今天
        </button>
      </div>

      {/* 日期标题 */}
      <div className="grid grid-cols-8 gap-0.5 lg:gap-2 mb-1 lg:mb-3 bg-gray-50 rounded lg:rounded-lg overflow-hidden">
        <div className="p-1.5 lg:p-3 text-xs font-medium text-gray-500 flex items-center justify-center">
          时间
        </div>
        {weekDates.map((date, index) => (
          <div
            key={index}
            className={`p-1.5 lg:p-3 text-center transition-all duration-300 ${
              isToday(date) 
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <div className="text-xs font-medium">
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][index]}
            </div>
            <div className={`text-sm lg:text-lg font-semibold ${
              isToday(date) ? 'text-white' : 'text-gray-900'
            }`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* 全天事件区域 */}
      <div className="mb-1 lg:mb-4">
        <div className="grid grid-cols-8 gap-0.5 lg:gap-2 bg-gray-200 rounded lg:rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-1 lg:p-2 text-xs font-medium text-gray-500 flex items-center justify-center">
            全天
          </div>
          {weekDates.map((date, dayIndex) => {
            const allDayEvents = getAllDayEventsForDate(date)
            const isTodayDate = isToday(date)
            
            return (
              <div key={dayIndex} className={`p-0.5 lg:p-1 min-h-[30px] lg:min-h-[60px] transition-all ${
                isTodayDate ? 'bg-blue-50' : 'bg-white'
              }`}>
                <div className="space-y-0.5">
                  {allDayEvents.slice(0, window.innerWidth < 640 ? 1 : 3).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 lg:p-2 rounded cursor-pointer transition-all hover:shadow-sm active:scale-95"
                      style={{
                        backgroundColor: event.color + '20',
                        borderLeft: `2px lg:3px solid ${event.color}`,
                        color: event.color
                      }}
                      onClick={() => onEventClick(event)}
                      title={event.title}
                    >
                      <div className="truncate font-medium leading-none">
                        {window.innerWidth < 480 ? 
                          event.title.substring(0, 3) + (event.title.length > 3 ? '.' : '') : 
                          window.innerWidth < 640 ?
                          event.title.substring(0, 5) + (event.title.length > 5 ? '..' : '') :
                          event.title
                        }
                      </div>
                      {event.description && window.innerWidth >= 1024 && (
                        <div className="truncate text-xs opacity-75 mt-1">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {allDayEvents.length > (window.innerWidth < 640 ? 1 : 3) && (
                    <div className="text-xs text-gray-500 text-center py-0.5 rounded bg-gray-100/50 leading-none">
                      +{allDayEvents.length - (window.innerWidth < 640 ? 1 : 3)}
                    </div>
                  )}
                  {allDayEvents.length === 0 && window.innerWidth >= 1024 && (
                    <div className="text-xs text-gray-400 p-2 text-center opacity-50">
                      无全天事件
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 时间轴网格 */}
      {activeTimeSlots.length > 0 ? (
        <div 
          ref={calendarRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-8 gap-0.5 lg:gap-2 bg-gray-200 rounded lg:rounded-lg overflow-hidden min-h-full">
            {/* 时间列 */}
            <div className="bg-gray-50">
              {activeTimeSlots.map(time => (
                <div
                  key={time}
                  className="h-12 lg:h-16 border-b border-gray-200 flex items-start justify-end pr-1 lg:pr-2 pt-1"
                >
                  <span className="text-xs lg:text-sm font-medium text-gray-600">{time}</span>
                </div>
              ))}
            </div>

            {/* 日期列 */}
            {weekDates.map((date, dayIndex) => {
              const timedEvents = getTimedEventsForDate(date)
              const isTodayDate = isToday(date)
              const dateKey = date.toDateString()
              const isHovered = hoveredDate === dateKey
              
              return (
                <div 
                  key={dayIndex} 
                  className={`relative transition-all duration-300 ${
                    isTodayDate ? 'bg-blue-50' : 'bg-white'
                  } ${isHovered ? 'bg-blue-25 shadow-lg transform lg:scale-105 z-10' : ''}`}
                  onMouseEnter={() => setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  {/* 时间网格线 */}
                  {activeTimeSlots.map((time, timeIndex) => (
                    <div
                      key={time}
                      className={`h-12 lg:h-16 border-b transition-colors ${
                        isTodayDate ? 'border-blue-200 hover:bg-blue-100' : 'border-gray-100 hover:bg-blue-50'
                      }`}
                    />
                  ))}
                  
                  {/* 事件块 */}
                  {timedEvents.map(event => {
                    const position = getEventPosition(event, activeTimeSlots)
                    if (!position) return null
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0.5 right-0.5 lg:left-1 lg:right-1 rounded p-0.5 lg:p-1 cursor-pointer transition-all hover:shadow-md group active:scale-95"
                        style={{
                          ...position,
                          backgroundColor: event.color + '20',
                          borderLeft: `2px lg:3px solid ${event.color}`,
                          zIndex: 1
                        }}
                        onClick={() => onEventClick(event)}
                        title={`${event.title}\n${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`}
                      >
                        <div className="text-xs font-medium truncate leading-tight" style={{ color: event.color }}>
                          {window.innerWidth < 480 ? 
                            event.title.substring(0, 4) + (event.title.length > 4 ? '.' : '') : 
                            event.title
                          }
                        </div>
                        <div className="text-xs opacity-75 leading-tight" style={{ color: event.color }}>
                          {event.startTime}
                          {event.endTime && window.innerWidth >= 640 && ` - ${event.endTime}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-white rounded lg:rounded-lg shadow-sm">
          <div className="text-center p-4 lg:p-8">
            <div className="text-base lg:text-lg font-medium mb-2">无定时事件</div>
            <div className="text-sm text-gray-400">本周没有安排定时事件</div>
          </div>
        </div>
      )}

      {/* 手机端滑动提示 */}
      <div className="lg:hidden text-center mt-1">
        <div className="text-xs text-gray-400">
          左滑下周 · 右滑上周
        </div>
      </div>
    </div>
  )
}

// 修改事件位置计算函数
const getEventPosition = (event: CalendarEvent, activeTimeSlots: string[]) => {
  if (!event.startTime) return null
  
  const [startHour, startMinute] = event.startTime.split(':').map(Number)
  const eventStartTime = `${startHour.toString().padStart(2, '0')}:00`
  
  const slotIndex = activeTimeSlots.indexOf(eventStartTime)
  if (slotIndex === -1) return null
  
  let duration = 1
  if (event.endTime) {
    const [endHour, endMinute] = event.endTime.split(':').map(Number)
    duration = (endHour + endMinute / 60) - (startHour + startMinute / 60)
  }
  
  const heightInSlots = Math.max(1, Math.ceil(duration))
  const slotHeight = window.innerWidth >= 1024 ? 64 : 48 // lg:h-16 : h-12
  
  return {
    top: `${slotIndex * slotHeight}px`,
    height: `${heightInSlots * slotHeight}px`
  }
}

export default WeekView
