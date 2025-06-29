import React, { useState, useEffect } from 'react'
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { Bookmark } from '../../types/bookmarks'
import { useBookmarkContext } from '../../context/BookmarkContext'

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  bookmark?: Bookmark | null
  groupId?: string
}

function BookmarkModal({ isOpen, onClose, bookmark, groupId }: BookmarkModalProps) {
  const { state, dispatch, getAllTags } = useBookmarkContext()
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    tags: [] as string[],
    groupId: groupId || '1'
  })
  const [newTag, setNewTag] = useState('')
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false)

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || '',
        tags: [...bookmark.tags],
        groupId: bookmark.groupId
      })
    } else {
      setFormData({
        title: '',
        url: '',
        description: '',
        tags: [],
        groupId: groupId || '1'
      })
    }
  }, [bookmark, groupId])

  const fetchFaviconAndTitle = async (url: string) => {
    if (!url) return
    
    setIsLoadingFavicon(true)
    try {
      // 如果没有标题，尝试从URL生成一个简单的标题
      if (!formData.title) {
        try {
          const urlObj = new URL(url)
          const hostname = urlObj.hostname.replace('www.', '')
          const suggestedTitle = hostname.split('.')[0] || '新书签'
          setFormData(prev => ({ 
            ...prev, 
            title: suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1) 
          }))
        } catch (error) {
          console.error('Failed to parse URL for title:', error)
          setFormData(prev => ({ ...prev, title: '新书签' }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch title:', error)
    } finally {
      setIsLoadingFavicon(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }))
    
    // 自动获取网站信息
    if (url && url.startsWith('http')) {
      fetchFaviconAndTitle(url)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.url.trim()) return

    const bookmarkData = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      tags: formData.tags,
      groupId: formData.groupId,
      order: bookmark?.order ?? state.bookmarks.filter(b => b.groupId === formData.groupId).length,
      favicon: `https://favicone.com${new URL(formData.url).hostname}`
    }

    if (bookmark) {
      dispatch({
        type: 'UPDATE_BOOKMARK',
        payload: { id: bookmark.id, updates: bookmarkData }
      })
    } else {
      dispatch({
        type: 'ADD_BOOKMARK',
        payload: bookmarkData
      })
    }

    onClose()
  }

  const allTags = getAllTags()
  const availableTags = allTags.filter(tag => !formData.tags.includes(tag))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {bookmark ? '编辑书签' : '添加书签'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网址 *
              </label>
              <div className="relative">
                <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
                {isLoadingFavicon && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="书签标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="添加书签描述..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* 分组 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分组
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {state.groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              
              {/* 已选标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 w-3 h-3 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 添加新标签 */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="添加标签..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>

              {/* 可选标签 */}
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">常用标签：</div>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex space-x-3 p-4 border-t bg-gray-50">
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
              {bookmark ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookmarkModal
