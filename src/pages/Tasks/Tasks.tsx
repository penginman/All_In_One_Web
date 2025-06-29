import { useState, useEffect } from 'react'
import { TaskProvider } from '../../context/TaskContext'
import TaskDesktop from './TaskDesktop'
import TaskMobile from './TaskMobile'

function Tasks() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <TaskProvider>
      {isMobile ? <TaskMobile /> : <TaskDesktop />}
    </TaskProvider>
  )
}

export default Tasks