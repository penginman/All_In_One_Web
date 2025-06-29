import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  ChevronDoubleLeftIcon // Changed from ChevronUp/DownIcon
} from '@heroicons/react/24/outline'
import { useCalendarContext } from '../../context/CalendarContext'
import { CalendarEvent } from '../../types/calendar'

interface EventListProps {
  onEventEdit: (event: CalendarEvent) => void
  onEventAdd: () => void
  onCollapse: () => void // Changed from isCollapsed and onToggleCollapse
}

function EventList({ 
  onEventEdit, 
  onEventAdd, 
  onCollapse 
}: EventListProps) {
  const { dispatch, allEvents } = useCalendarContext()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all')

  // 只显示独立日程事件，不包括任务和习惯
  const calendarEvents = allEvents.filter(event => event.category === 'event')

  // 根据筛选条件过滤事件
  const getFilteredEvents = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (filter) {
      case 'today':
        return calendarEvents.filter(event => {
          const eventDate = new Date(event.startDate)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate.getTime() === today.getTime()
        })
      case 'upcoming':
        return calendarEvents.filter(event => {
          const eventDate = new Date(event.startDate)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate >= today
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      default:
        return calendarEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }
  }

  const filteredEvents = getFilteredEvents()

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('确定要删除这个日程吗？')) {
      dispatch({ type: 'DELETE_EVENT', payload: eventId })
    }
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  const formatDateRange = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start.toDateString() === end.toDateString()) {
      return formatDate(start)
    } else {
      return `${formatDate(start)} - ${formatDate(end)}`
    }
  }

  return (
    <div className="bg-white rounded-lg lg:shadow-sm lg:border lg:border-gray-200 h-full flex flex-col">
      {/* 头部 */}
      <div className="p-1.5 lg:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1.5 lg:mb-3">
          <div className="flex items-center space-x-1">
            <h3 className="text-sm lg:text-lg font-semibold text-gray-900">日程列表</h3>
            <span className="text-xs text-gray-500">({filteredEvents.length})</span>
          </div>
          {/* 只在桌面端显示收起按钮 */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={onCollapse}
              className="p-0.5 lg:p-1 hover:bg-gray-100 rounded transition-colors active:scale-95"
              title="收起日程列表"
            >
              <ChevronDoubleLeftIcon className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 筛选按钮 */}
        <div className="flex space-x-0.5 lg:space-x-1 overflow-x-auto">
          {[{
            key: 'all',
            label: '全部'
          },
          {
            key: 'today',
            label: '今天'
          },
          {
            key: 'upcoming',
            label: '即将到来'
          }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`flex-shrink-0 px-1.5 lg:px-3 py-0.5 text-xs rounded transition-colors active:scale-95 ${
                filter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 日程列表 - 手机端增加底部padding */}
      <div className="flex-1 overflow-y-auto p-1 lg:p-2 pb-4 lg:pb-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-3 lg:py-8">
            <CalendarIcon className="w-6 h-6 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-1.5 lg:mb-3" />
            <p className="text-gray-500 mb-1.5 lg:mb-3 text-xs">
              {filter === 'today' ? '今天没有日程安排' : 
               filter === 'upcoming' ? '暂无即将到来的日程' : '暂无日程安排'}
            </p>
            <button
              onClick={onEventAdd}
              className="text-blue-500 hover:text-blue-600 text-xs active:scale-95"
            >
              创建第一个日程
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="group p-1.5 lg:p-3 border border-gray-200 rounded-md lg:rounded-lg hover:shadow-md transition-all cursor-pointer active:scale-95"
                style={{ borderLeftColor: event.color, borderLeftWidth: '2px lg:3px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate mb-0.5 text-xs">
                      {event.title}
                    </h4>
                    
                    {event.description && (
                      <p className="text-xs text-gray-600 line-clamp-1 lg:line-clamp-2 mb-0.5 lg:mb-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex flex-col space-y-0.5 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-0.5">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        <span className="text-xs">{formatDateRange(event.startDate, event.endDate)}</span>
                      </div>
                      
                      {event.startTime && (
                        <div className="flex items-center space-x-0.5">
                          <ClockIcon className="w-2.5 h-2.5" />
                          <span className="text-xs">
                            {event.startTime}
                            {event.endTime && ` - ${event.endTime}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventEdit(event)
                      }}
                      className="p-0.5 text-blue-500 hover:bg-blue-50 rounded transition-colors active:scale-95"
                      title="编辑日程"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEvent(event.id)
                      }}
                      className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-colors active:scale-95"
                      title="删除日程"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventList
