import  { useState } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { usePomodoroContext } from '../../context/PomodoroContext'

function PomodoroTimer() {
  const { state, startSession, pauseSession, resumeSession, stopSession, getNextSessionType } = usePomodoroContext()
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionLabel = (type: string) => {
    switch (type) {
      case 'work': return '专注时间'
      case 'shortBreak': return '短休息'
      case 'longBreak': return '长休息'
      default: return '准备开始'
    }
  }

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'work': return 'bg-red-500'
      case 'shortBreak': return 'bg-green-500'
      case 'longBreak': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getCurrentProgress = () => {
    if (!state.currentSession.type) return 0
    
    const totalDuration = state.currentSession.type === 'work' 
      ? state.settings.workDuration * 60
      : state.currentSession.type === 'shortBreak' 
      ? state.settings.shortBreakDuration * 60
      : state.settings.longBreakDuration * 60
    
    return ((totalDuration - state.currentSession.timeLeft) / totalDuration) * 100
  }

  const handleStart = () => {
    if (state.currentSession.type) {
      if (state.currentSession.isPaused) {
        resumeSession()
      } else {
        pauseSession()
      }
    } else {
      const nextType = getNextSessionType()
      startSession(nextType)
    }
  }

  const handleStop = () => {
    if (state.currentSession.type) {
      stopSession(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* 主计时器 */}
      <div className="text-center">
        <div className={`inline-block px-6 py-3 rounded-full text-white font-medium mb-4 ${getSessionColor(state.currentSession.type || '')}`}>
          {getSessionLabel(state.currentSession.type || '')}
        </div>
        
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* 进度圆环 */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getCurrentProgress() / 100)}`}
              className={`transition-all duration-1000 ${
                state.currentSession.type === 'work' 
                  ? 'text-red-500' 
                  : state.currentSession.type === 'shortBreak' 
                  ? 'text-green-500' 
                  : 'text-blue-500'
              }`}
              style={{ strokeLinecap: 'round' }}
            />
          </svg>
          
          {/* 时间显示 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-gray-900">
                {state.currentSession.type ? formatTime(state.currentSession.timeLeft) : '25:00'}
              </div>
              {state.currentSession.sessionCount > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  第 {state.currentSession.sessionCount} 个番茄
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleStart}
            className={`flex items-center justify-center w-16 h-16 rounded-full text-white font-medium transition-all transform hover:scale-105 ${
              state.currentSession.isRunning 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {state.currentSession.isRunning ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8 ml-1" />
            )}
          </button>
          
          {state.currentSession.type && (
            <button
              onClick={handleStop}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-all transform hover:scale-105"
            >
              <StopIcon className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* 状态信息 */}
        {state.currentSession.isPaused && (
          <div className="mt-4 text-orange-600 font-medium">
            ⏸️ 已暂停
          </div>
        )}
      </div>

      {/* 快速开始按钮 */}
      {!state.currentSession.type && (
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => startSession('work')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            开始专注 ({state.settings.workDuration}分钟)
          </button>
          <button
            onClick={() => startSession('shortBreak')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            短休息 ({state.settings.shortBreakDuration}分钟)
          </button>
          <button
            onClick={() => startSession('longBreak')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            长休息 ({state.settings.longBreakDuration}分钟)
          </button>
        </div>
      )}

      {/* 今日统计 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2" />
          今日统计
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-500">{state.stats.today.workSessions}</div>
            <div className="text-sm text-gray-600">完成番茄</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">{state.stats.today.totalFocusTime}</div>
            <div className="text-sm text-gray-600">专注时间(分钟)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{state.stats.today.totalBreakTime}</div>
            <div className="text-sm text-gray-600">休息时间(分钟)</div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChartBarIcon className="w-4 h-4 mr-1" />
          详细统计
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Cog6ToothIcon className="w-4 h-4 mr-1" />
          设置
        </button>
      </div>

      {/* 详细统计 */}
      {showStats && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">历史统计</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">本周</h4>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-red-500">{state.stats.week.workSessions}</div>
                  <div className="text-gray-600">完成番茄</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-500">{state.stats.week.totalFocusTime}分钟</div>
                  <div className="text-gray-600">专注时间</div>
                </div>
                <div>
                  <div className="font-semibold text-green-500">{state.stats.week.totalBreakTime}分钟</div>
                  <div className="text-gray-600">休息时间</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">总计</h4>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-red-500">{state.stats.allTime.workSessions}</div>
                  <div className="text-gray-600">完成番茄</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-500">{state.stats.allTime.totalFocusTime}分钟</div>
                  <div className="text-gray-600">专注时间</div>
                </div>
                <div>
                  <div className="font-semibold text-green-500">{state.stats.allTime.totalBreakTime}分钟</div>
                  <div className="text-gray-600">休息时间</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">番茄时钟设置</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工作时长(分钟)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={state.settings.workDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 0 && value <= 60) {
                      // 通过 dispatch 更新设置
                      const event = new CustomEvent('updatePomodoroSettings', {
                        detail: { workDuration: value }
                      })
                      window.dispatchEvent(event)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  短休息(分钟)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={state.settings.shortBreakDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 0 && value <= 30) {
                      const event = new CustomEvent('updatePomodoroSettings', {
                        detail: { shortBreakDuration: value }
                      })
                      window.dispatchEvent(event)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  长休息(分钟)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={state.settings.longBreakDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value >= 5 && value <= 60) {
                      const event = new CustomEvent('updatePomodoroSettings', {
                        detail: { longBreakDuration: value }
                      })
                      window.dispatchEvent(event)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                长休息间隔(每几个番茄后)
              </label>
              <input
                type="number"
                min="2"
                max="8"
                value={state.settings.longBreakInterval}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= 2 && value <= 8) {
                    const event = new CustomEvent('updatePomodoroSettings', {
                      detail: { longBreakInterval: value }
                    })
                    window.dispatchEvent(event)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.settings.soundEnabled}
                  onChange={(e) => {
                    const event = new CustomEvent('updatePomodoroSettings', {
                      detail: { soundEnabled: e.target.checked }
                    })
                    window.dispatchEvent(event)
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">声音提醒</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.settings.autoStartBreaks}
                  onChange={(e) => {
                    const event = new CustomEvent('updatePomodoroSettings', {
                      detail: { autoStartBreaks: e.target.checked }
                    })
                    window.dispatchEvent(event)
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">自动开始休息</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.settings.autoStartWork}
                  onChange={(e) => {
                    const event = new CustomEvent('updatePomodoroSettings', {
                      detail: { autoStartWork: e.target.checked }
                    })
                    window.dispatchEvent(event)
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">自动开始工作</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PomodoroTimer
