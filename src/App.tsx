import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Learning from './pages/Pomodoro/PomodoroTimer'
import Tasks from './pages/Tasks/Tasks'
import Calendar from './pages/Calendar/Calendar'
import Habits from './pages/Habits/Habits'
import Settings from './pages/Settings/Settings'
import { AppProvider } from './context/AppContext'
import { TaskProvider } from './context/TaskContext'
import { CalendarProvider } from './context/CalendarContext'
import { HabitProvider } from './context/HabitContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { PomodoroProvider } from './context/PomodoroContext'

function App() {
  return (
    <AppProvider>
      <TaskProvider>
        <HabitProvider>
          <CalendarProvider>
            <BookmarkProvider>
              <PomodoroProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </PomodoroProvider>
            </BookmarkProvider>
          </CalendarProvider>
        </HabitProvider>
      </TaskProvider>
    </AppProvider>
  )
}

export default App
