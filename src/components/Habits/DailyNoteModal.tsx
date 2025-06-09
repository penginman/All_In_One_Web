import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useHabitContext } from '../../context/HabitContext'

interface DailyNoteModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
}

function DailyNoteModal({ isOpen, onClose, date }: DailyNoteModalProps) {
  const { dispatch, getDailyNote } = useHabitContext()
  const [content, setContent] = useState('')

  useEffect(() => {
    if (isOpen) {
      setContent(getDailyNote(date))
    }
  }, [isOpen, date, getDailyNote])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (content.trim()) {
      dispatch({
        type: 'UPDATE_DAILY_NOTE',
        payload: { date, content: content.trim() }
      })
    }
    
    onClose()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {formatDate(date)} 的小记
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录今天的想法、感受或收获..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DailyNoteModal
