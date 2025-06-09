import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { BookmarkProvider } from '../../context/BookmarkContext'
import BookmarkManager from '../../components/Bookmarks/BookmarkManager'

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<'bing' | 'google'>('google')

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    const searchUrl = selectedEngine === 'google' 
      ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
      : `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`
    
    window.open(searchUrl, '_blank')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">首页</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
      
      {/* 搜索区域 - 更紧凑 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">快速搜索</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入搜索关键词..."
                className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button 
                  onClick={() => setSelectedEngine('bing')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedEngine === 'bing' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  Bing
                </button>
                <button 
                  onClick={() => setSelectedEngine('google')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedEngine === 'google' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  Google
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 书签管理区域 - 更紧凑 */}
      <div className="card">
        <div className="mb-4 flex items-baseline gap-x-2">
          <h2 className="text-xl font-semibold text-gray-800">书签管理</h2>
          <p className="text-sm text-gray-600">
            💡 可以直接从浏览器书签栏拖拽到分组中快速添加
          </p>
        </div>
        <BookmarkManager />
      </div>
    </div>
  )
}

function Home() {
  return (
    <BookmarkProvider>
      <HomeContent />
    </BookmarkProvider>
  )
}

export default Home
