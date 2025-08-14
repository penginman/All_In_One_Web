import { useEffect } from 'react'
import { usePomodoroContext } from '../../context/PomodoroContext'
import PomodoroTimer from '../../components/Pomodoro/PomodoroTimer'

function Learning() {
  const { dispatch } = usePomodoroContext()

  // 监听设置更新事件
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: event.detail
      })
    }

    window.addEventListener('updatePomodoroSettings', handleSettingsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('updatePomodoroSettings', handleSettingsUpdate as EventListener)
    }
  }, [dispatch])

  return (
    <div className="responsive-container">
      <h1 className="responsive-heading text-gray-900 mb-md-gap lg:mb-lg-gap">学习</h1>

      {/* 番茄时钟 */}
      <div className="responsive-card mb-md-gap lg:mb-lg-gap">
        <div className="mb-md-gap">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2">番茄时钟</h2>
          <p className="responsive-text text-gray-600 leading-relaxed">
            使用番茄工作法提高专注力，每个工作周期25分钟，短休息5分钟，长休息15分钟
          </p>
        </div>
        <PomodoroTimer />
      </div>
    </div>
  )
}

export default Learning
