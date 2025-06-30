import React, { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { SearchEngine, SearchEngineKey } from '../../types/bookmarks'

import BookmarkManager from '../../components/Bookmarks/BookmarkManager'


export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  {
    key: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '🔍',
    color: 'bg-blue-500'
  },
  {
    key: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: '🅱️',
    color: 'bg-green-500'
  },
  {
    key: 'bilibili',
    name: 'Bilibili',
    url: 'https://search.bilibili.com/all?keyword=',
    icon: '📺',
    color: 'bg-pink-500'
  },
  {
    key: 'taobao',
    name: '淘宝',
    url: 'https://s.taobao.com/search?q=',
    icon: '🛒',
    color: 'bg-orange-500'
  }
]

export class SearchEngineManager {

  static getAvailableEngines(): SearchEngine[] {
    const customEngine = this.getCustomEngine()
    return customEngine ? [...DEFAULT_SEARCH_ENGINES, customEngine] : DEFAULT_SEARCH_ENGINES
  }

  static getCurrentEngine(): SearchEngineKey {
    const saved = localStorage.getItem('app-currentSearchEngine')
    return (saved && this.isValidEngineKey(saved)) ? saved as SearchEngineKey : 'google'
  }

  static setCurrentEngine(key: SearchEngineKey): void {
    localStorage.setItem('app-currentSearchEngine', key)
  }

  static getCustomEngine(): SearchEngine | null {
    try {
      const saved = localStorage.getItem('app-customSearchEngine')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  static setCustomEngine(engine: SearchEngine): void {
    localStorage.setItem('app-customSearchEngine', JSON.stringify(engine))
  }

  static getEngineByKey(key: SearchEngineKey): SearchEngine | null {
    if (key === 'custom') {
      return this.getCustomEngine()
    }
    return DEFAULT_SEARCH_ENGINES.find(e => e.key === key) || null
  }

  static getSearchUrl(query: string, engineKey?: SearchEngineKey): string {
    const key = engineKey || this.getCurrentEngine()
    const engine = this.getEngineByKey(key)
    return engine ? `${engine.url}${encodeURIComponent(query)}` : ''
  }

  private static isValidEngineKey(key: string): boolean {
    return ['google', 'bing', 'bilibili', 'taobao', 'custom'].includes(key)
  }
}

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomEngineForm, setShowCustomEngineForm] = useState(false)
  const [customEngine, setCustomEngine] = useState({ name: '', url: '', icon: '🔍' })
  const [currentEngineKey, setCurrentEngineKey] = useState<SearchEngineKey>(SearchEngineManager.getCurrentEngine())
  const inputRef = useRef<HTMLInputElement>(null)

  // 获取当前搜索引擎和可用引擎列表
  const currentEngine = SearchEngineManager.getEngineByKey(currentEngineKey)
  const availableEngines = SearchEngineManager.getAvailableEngines()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    const searchUrl = SearchEngineManager.getSearchUrl(searchQuery, currentEngineKey)
    window.open(searchUrl, '_blank')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const currentIndex = availableEngines.findIndex(engine => engine.key === currentEngineKey)
      const nextIndex = (currentIndex + 1) % availableEngines.length
      const nextEngine = availableEngines[nextIndex]
      setCurrentEngineKey(nextEngine.key as SearchEngineKey)
      SearchEngineManager.setCurrentEngine(nextEngine.key as SearchEngineKey)
    }
  }

  const handleEngineClick = (engineKey: SearchEngineKey) => {
    setCurrentEngineKey(engineKey)
    SearchEngineManager.setCurrentEngine(engineKey)
    inputRef.current?.focus()
  }

  const handleAddCustomEngine = () => {
    if (!customEngine.name || !customEngine.url) return
    
    const newEngine: SearchEngine = {
      key: 'custom',
      name: customEngine.name,
      url: customEngine.url.endsWith('=') ? customEngine.url : customEngine.url + '=',
      icon: customEngine.icon || '🔍',
      color: 'bg-gray-500'
    }
    
    SearchEngineManager.setCustomEngine(newEngine)
    setCurrentEngineKey('custom')
    SearchEngineManager.setCurrentEngine('custom')
    setShowCustomEngineForm(false)
    setCustomEngine({ name: '', url: '', icon: '🔍' })
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* 网站图标 */}
        <img src="/icon/总图标.png" alt="网站图标" className="w-15 h-15" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">一站能流</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
      
      {/* 搜索区域 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">快速搜索</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>💡 按 Tab 键切换搜索引擎</span>
            <button
              onClick={() => setShowCustomEngineForm(!showCustomEngineForm)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
              <span>自定义</span>
            </button>
          </div>
        </div>

        {/* 自定义搜索引擎表单 */}
        {showCustomEngineForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">添加自定义搜索引擎</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="引擎名称"
                value={customEngine.name}
                onChange={(e) => setCustomEngine({ ...customEngine, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="搜索URL (如: https://example.com/search?q=)"
                value={customEngine.url}
                onChange={(e) => setCustomEngine({ ...customEngine, url: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="图标"
                  value={customEngine.icon}
                  onChange={(e) => setCustomEngine({ ...customEngine, icon: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAddCustomEngine}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 搜索引擎切换 - 居中显示 */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {availableEngines.map((engine) => (
              <button
                key={engine.key}
                onClick={() => handleEngineClick(engine.key as SearchEngineKey)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentEngineKey === engine.key
                    ? `${engine.color} text-white shadow-md transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <span className="text-base">{engine.icon}</span>
                <span>{engine.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 搜索输入框 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <span className="text-lg">{currentEngine?.icon}</span>
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`在 ${currentEngine?.name} 中搜索...`}
                className="w-full pl-16 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-lg font-medium whitespace-nowrap"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 书签管理区域 */}
      <div className="card">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
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

export default Home
