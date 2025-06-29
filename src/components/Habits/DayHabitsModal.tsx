import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid, FireIcon } from '@heroicons/react/24/solid'
import { useHabitContext } from '../../context/HabitContext'

interface DayHabitsModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  onOpenNote: (date: Date) => void
}

function DayHabitsModal({ isOpen, onClose, date, onOpenNote }: DayHabitsModalProps) {
  const { 
    state, 
    dispatch, 
    isHabitCompletedOnDate, 
    getHabitStats,
    getDailyNote 
  } = useHabitContext()

  if (!isOpen) return null

  // 获取指定日期应该进行的习惯
  const getDayHabits = () => {
    const dayOfWeek = date.getDay()
    
    return state.habits.filter(habit => {
      if (!habit.isActive) return false
      if (date < habit.startDate) return false
      if (habit.endDate && date > habit.endDate) return false
      
      if (habit.frequency === 'weekly' && !habit.weekdays?.includes(dayOfWeek)) {
        return false
      }
      
      return true
    })
  }

  const dayHabits = getDayHabits()
  const dailyNote = getDailyNote(date)
  const isToday = date.toDateString() === new Date().toDateString()

  const toggleHabitCompletion = (habitId: string) => {
    dispatch({
      type: 'TOGGLE_HABIT_RECORD',
      payload: { habitId, date }
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const completedCount = dayHabits.filter(habit => isHabitCompletedOnDate(habit.id, date)).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(date)}
            </h3>
            <p className="text-sm text-gray-500">
              习惯完成度: {completedCount}/{dayHabits.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 习惯列表 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              {isToday ? '今日习惯' : '当日习惯'}
            </h4>
            
            {dayHabits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isToday ? '今天没有需要打卡的习惯' : '当天没有安排习惯'}
              </div>
            ) : (
              <div className="space-y-3">
                {dayHabits.map(habit => {
                  const isCompleted = isHabitCompletedOnDate(habit.id, date)
                  const stats = getHabitStats(habit.id)
                  
                  return (
                    <div
                      key={habit.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleHabitCompletion(habit.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {isCompleted && <CheckCircleIconSolid className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className={`font-medium ${
                              isCompleted ? 'text-green-800' : 'text-gray-900'
                            }`}>
                              {habit.name}
                            </h5>
                            {stats.currentStreak > 0 && (
                              <div className="flex items-center space-x-1">
                                <FireIcon className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-600">{stats.currentStreak}天</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {habit.frequency === 'daily' ? '每天' : 
                             `每周 ${habit.weekdays?.map(d => ['日','一','二','三','四','五','六'][d]).join('、')}`}
                          </div>
                        </div>
                        
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 当日小记 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">当日小记</h4>
            <button
              onClick={() => onOpenNote(date)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center space-x-2">
                <PencilIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  {dailyNote || '点击添加小记...'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default DayHabitsModal
