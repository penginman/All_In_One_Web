export interface PomodoroSession {
  id: string
  type: 'work' | 'shortBreak' | 'longBreak'
  duration: number // 持续时间（分钟）
  completedAt: Date
  interrupted: boolean
}

export interface PomodoroStats {
  today: {
    workSessions: number
    totalFocusTime: number // 分钟
    totalBreakTime: number // 分钟
  }
  week: {
    workSessions: number
    totalFocusTime: number
    totalBreakTime: number
  }
  allTime: {
    workSessions: number
    totalFocusTime: number
    totalBreakTime: number
  }
}

export interface PomodoroSettings {
  workDuration: number // 工作时长（分钟）
  shortBreakDuration: number // 短休息时长（分钟）
  longBreakDuration: number // 长休息时长（分钟）
  longBreakInterval: number // 长休息间隔（几个工作周期后）
  autoStartBreaks: boolean // 自动开始休息
  autoStartWork: boolean // 自动开始工作
  soundEnabled: boolean // 声音提醒
}

export interface PomodoroState {
  currentSession: {
    type: 'work' | 'shortBreak' | 'longBreak' | null
    timeLeft: number // 剩余秒数
    isRunning: boolean
    isPaused: boolean
    sessionCount: number // 当前工作周期计数
  }
  sessions: PomodoroSession[]
  settings: PomodoroSettings
  stats: PomodoroStats
}

export type PomodoroAction =
  | { type: 'START_SESSION'; payload: { sessionType: 'work' | 'shortBreak' | 'longBreak' } }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION'; payload: { interrupted: boolean } }
  | { type: 'TICK' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PomodoroSettings> }
  | { type: 'LOAD_FROM_STORAGE'; payload: { sessions: PomodoroSession[]; settings: PomodoroSettings } }
