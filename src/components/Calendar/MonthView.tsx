import React, { useState, useEffect, useRef } from 'react'
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // 添加触摸滑动状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const currentDate = state.currentDate
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 获取月份第一天和最后一天
  const firstDay = new Date(year, month, 1)
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
    e.dataTransfer.setData('text/plain', eventId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const draggedEventId = draggedEvent || e.dataTransfer.getData('text/plain')
    
    if (draggedEventId) {
      const event = allEvents.find(e => e.id === draggedEventId)
      
      if (event && event.category === 'event') {
        // 计算日期差异
        const originalStartDate = new Date(event.startDate)
        originalStartDate.setHours(0, 0, 0, 0)
        const targetDateNormalized = new Date(targetDate)
        targetDateNormalized.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((targetDateNormalized.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 0) {
          setDraggedEvent(null)
          setHoveredDate(null)
          return
        }
        
        // 计算新的开始和结束日期
        const newStartDate = new Date(targetDate)
        newStartDate.setHours(12, 0, 0, 0)
        
        const newEndDate = new Date(event.endDate)
        newEndDate.setDate(newEndDate.getDate() + daysDiff)
        
        dispatch({
          type: 'UPDATE_EVENT',
          payload: {
            id: draggedEventId,
            updates: {
              startDate: newStartDate,
              endDate: newEndDate
            }
          }
        })
      }
    }
    setDraggedEvent(null)
    setHoveredDate(null)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  // 简化的滚轮支持 - 直接按月滚动
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const newDate = new Date(currentDate)
      if (e.deltaY > 0) {
        // 向下滚动 - 下个月
        newDate.setMonth(month + 1)
      } else {
        // 向上滚动 - 上个月
        newDate.setMonth(month - 1)
      }
      
      dispatch({ type: 'SET_DATE', payload: newDate })
    }

    const calendarElement = calendarRef.current
    if (calendarElement) {
      calendarElement.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        calendarElement.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentDate, dispatch, month])

  const handleDateDoubleClick = (date: Date) => {
    const clickedDate = new Date(date)
    clickedDate.setHours(12, 0, 0, 0)
    onDateDoubleClick(clickedDate)
  }

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const minSwipeDistance = 50

    // 判断是否为有效的水平滑动（左右滑动）
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault() // 阻止默认行为
      if (deltaX < 0) {
        // 向左滑动 - 下个月
        navigateMonth('next')
      } else {
        // 向右滑动 - 上个月
        navigateMonth('prev')
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <h2 className="text-sm lg:text-xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </h2>
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-0.5 lg:p-1.5 hover:bg-gray-100 rounded transition-all duration-200 active:scale-95"
            >
              <ChevronLeftIcon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
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

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-0.5 lg:gap-2 mb-0.5 lg:mb-3">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <div key={day} className="text-center py-0.5 lg:py-1">
            <span className={`text-xs font-medium ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-gray-700'
            }`}>
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div 
        ref={calendarRef}
        className="flex-1 grid grid-cols-7 gap-0.5 lg:gap-2 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {calendarDays.map((date, index) => {
          const events = getEventsForDate(date)
          const isCurrentMonthDate = isCurrentMonth(date)
          const isTodayDate = isToday(date)
          const dateKey = date.toDateString()
          const isHovered = hoveredDate === dateKey
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          
          return (
            <div
              key={index}
              className={`
                relative min-h-[40px] lg:min-h-[90px] p-0.5 lg:p-2 rounded lg:rounded-xl 
                transition-all duration-300 ease-out cursor-pointer
                ${!isCurrentMonthDate 
                  ? 'bg-gray-50/50 opacity-40' 
                  : 'bg-white shadow-sm hover:shadow-md active:shadow-lg'
                }
                ${isTodayDate 
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-400 shadow-md' 
                  : ''
                }
                ${isHovered && isCurrentMonthDate
                  ? 'transform scale-105 shadow-xl bg-gradient-to-br from-blue-25 to-blue-50 ring-1 lg:ring-2 ring-blue-300 z-20'
                  : ''
                }
                border border-gray-100/50
                active:scale-95 lg:active:scale-105
              `}
              onDoubleClick={() => handleDateDoubleClick(date)}
              onTouchEnd={(e) => {
                // 手机端双击处理 - 不阻止事件冒泡，让父级处理滑动
                const now = Date.now()
                const lastTap = e.currentTarget.dataset.lastTap
                if (lastTap && now - parseInt(lastTap) < 300) {
                  e.stopPropagation() // 只在双击时阻止冒泡
                  handleDateDoubleClick(date)
                }
                e.currentTarget.dataset.lastTap = now.toString()
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
              onDragEnter={() => setHoveredDate(dateKey)}
              onMouseEnter={() => setHoveredDate(dateKey)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {/* 日期数字 */}
              <div className="flex items-center justify-between mb-0.5">
                <span className={`
                  text-xs font-bold
                  ${!isCurrentMonthDate 
                    ? 'text-gray-300' 
                    : isTodayDate 
                      ? 'text-blue-700' 
                      : isWeekend 
                        ? 'text-red-500' 
                        : 'text-gray-800'
                  }
                `}>
                  {date.getDate()}
                </span>
                
                {isTodayDate && (
                  <div className="w-0.5 h-0.5 lg:w-1.5 lg:h-1.5 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              {/* 事件列表 - 手机端显示更紧凑 */}
              <div className="space-y-0.8">
                {events.slice(0, window.innerWidth < 640 ? 1 : 2).map(event => (
                  <div
                    key={event.id}
                    draggable={event.category === 'event' && window.innerWidth >= 1024}
                    onDragStart={(e) => handleDragStart(e, event.id)}
                    onClick={(e) => {
                      e.stopPropagation() // 阻止事件冒泡到日期格子
                      onEventClick(event)
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation() // 阻止事件冒泡到日期格子和日历网格
                    }}
                    className={`
                      text-xs p-0.5 rounded cursor-pointer transition-all duration-300
                      ${event.category === 'event' ? 'hover:shadow-sm active:scale-95' : ''}
                      ${draggedEvent === event.id ? 'opacity-50 scale-95' : ''}
                      truncate
                    `}
                    style={{ 
                      backgroundColor: event.color + '15',
                      borderLeft: `1px solid ${event.color}`,
                      color: event.color
                    }}
                    title={`${event.title}${event.startTime ? ` ${event.startTime}` : ''}`}
                  >
                    <div className="flex items-center space-x-0.5">
                      <span className="truncate font-medium text-xs leading-none">
                        {window.innerWidth < 480 ? 
                          event.title.substring(0, 3) + (event.title.length > 3 ? '.' : '') : 
                          window.innerWidth < 640 ?
                          event.title.substring(0, 5) + (event.title.length > 5 ? '..' : '') :
                          event.title.substring(0, 8) + (event.title.length > 8 ? '..' : '')
                        }
                      </span>
                    </div>
                  </div>
                ))}
                
                {events.length > (window.innerWidth < 640 ? 1 : 2) && (
                  <div 
                    className="text-xs text-gray-500 text-center py-0.5 rounded bg-gray-100/50 leading-none"
                    onTouchEnd={(e) => {
                      e.stopPropagation() // 阻止事件冒泡
                    }}
                  >
                    +{events.length - (window.innerWidth < 640 ? 1 : 2)}
                  </div>
                )}
              </div>
              
              {/* 底部装饰线 */}
              {isCurrentMonthDate && events.length > 0 && (
                <div className={`
                  absolute bottom-0.5 left-0.5 right-0.5 lg:bottom-1.5 lg:left-2 lg:right-2 h-0.5 rounded-full
                  ${isTodayDate ? 'bg-blue-400' : 'bg-gray-200'}
                `}></div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* 手机端滑动提示 - 更新为左右滑动 */}
      <div className="lg:hidden text-center mt-1">
        <div className="text-xs text-gray-400">
          左滑下月 · 右滑上月
        </div>
      </div>
    </div>
  )
}

export default MonthView

