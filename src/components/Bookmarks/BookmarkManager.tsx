import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useBookmarkContext } from '../../context/BookmarkContext'
import { Bookmark } from '../../types/bookmarks'
import BookmarkModal from './BookmarkModal'

interface BookmarkManagerProps {
  onBookmarkClick?: (bookmark: Bookmark) => void
}

function BookmarkManager({ onBookmarkClick }: BookmarkManagerProps) {
  const { state, dispatch, getAllTags, getFilteredBookmarks } = useBookmarkContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  // 监听点击事件，自动关闭分组菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setGroupMenuOpen(null)
    }
    
    if (groupMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [groupMenuOpen])

  // 监听新分组输入状态变化，自动关闭分组菜单
  useEffect(() => {
    if (showNewGroupInput) {
      setGroupMenuOpen(null)
    }
  }, [showNewGroupInput])

  const filteredBookmarks = getFilteredBookmarks()
  const allTags = getAllTags()

  // 分组书签
  const getBookmarksByGroup = (groupId: string) => {
    return filteredBookmarks
      .filter(bookmark => bookmark.groupId === groupId)
      .sort((a, b) => a.order - b.order)
  }

  // 添加分组
  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      dispatch({
        type: 'ADD_GROUP',
        payload: {
          name: newGroupName.trim(),
          color: '#3b82f6',
          order: state.groups.length,
          collapsed: false
        }
      })
      setNewGroupName('')
      setShowNewGroupInput(false)
      setGroupMenuOpen(null) // 确保关闭任何打开的菜单
    }
  }

  // 删除分组
  const handleDeleteGroup = (groupId: string) => {
    if (groupId === '1') {
      alert('常用不能删除')
      return
    }
    if (window.confirm('确定要删除这个分组吗？分组中的书签将移动到常用。')) {
      dispatch({ type: 'DELETE_GROUP', payload: groupId })
      setGroupMenuOpen(null)
    }
  }

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, bookmark: Bookmark) => {
    dispatch({ type: 'SET_DRAGGED_BOOKMARK', payload: bookmark.id })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', bookmark.id)
    e.dataTransfer.setData('application/bookmark', JSON.stringify(bookmark))
  }

  const handleDragEnd = () => {
    dispatch({ type: 'SET_DRAGGED_BOOKMARK', payload: null })
    setDragOverGroup(null)
  }

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverGroup(groupId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverGroup(null)
    }
  }

  // 拖拽处理 - 改进的浏览器书签解析
  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    console.log('Drop event:', e.dataTransfer.types)
    
    const bookmarkId = e.dataTransfer.getData('text/plain')
    
    // 处理内部拖拽
    if (bookmarkId && state.draggedBookmark === bookmarkId) {
      const bookmark = state.bookmarks.find(b => b.id === bookmarkId)
      if (bookmark && bookmark.groupId !== targetGroupId) {
        const targetGroupBookmarksCount = state.bookmarks.filter(b => b.groupId === targetGroupId).length
        dispatch({
          type: 'MOVE_BOOKMARK',
          payload: {
            bookmarkId,
            targetGroupId,
            newOrder: targetGroupBookmarksCount
          }
        })
      }
    }
    // 处理从浏览器拖入的书签
    else {
      // 尝试多种方式获取 URL 和标题
      let url = e.dataTransfer.getData('text/uri-list')
      let title = ''
      
      // 如果没有 uri-list，尝试从 text/plain 获取
      if (!url) {
        const plainText = e.dataTransfer.getData('text/plain')
        if (plainText && (plainText.startsWith('http://') || plainText.startsWith('https://'))) {
          url = plainText
        }
      }
      
      // 尝试从 HTML 数据获取标题
      const htmlData = e.dataTransfer.getData('text/html')
      if (htmlData) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlData, 'text/html')
        const anchorElement = doc.querySelector('a')
        if (anchorElement) {
          title = anchorElement.textContent || anchorElement.getAttribute('title') || ''
          if (!url && anchorElement.href) {
            url = anchorElement.href
          }
        }
      }
      
      // 如果还没有标题，尝试从 text/plain 获取
      if (!title) {
        const plainText = e.dataTransfer.getData('text/plain')
        if (plainText && plainText !== url) {
          title = plainText
        }
      }
      
      console.log('Extracted data:', { url, title, htmlData: !!htmlData })
      
      // 验证是否为有效的 URL
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        try {
          const urlObj = new URL(url)
          
          // 如果仍然没有标题，从 URL 生成一个
          if (!title || title === url) {
            title = urlObj.hostname.replace('www.', '') || '新书签'
          }
          
          console.log('Adding browser bookmark:', { title: title.trim(), url: url.trim(), targetGroupId })
          
          dispatch({
            type: 'ADD_BROWSER_BOOKMARK',
            payload: {
              title: title.trim(),
              url: url.trim(),
              groupId: targetGroupId
            }
          })
        } catch (error) {
          console.error('Invalid URL:', url, error)
        }
      } else {
        console.log('No valid URL found in drop data')
      }
    }
    
    dispatch({ type: 'SET_DRAGGED_BOOKMARK', payload: null })
    setDragOverGroup(null)
  }

  // 编辑书签
  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setIsModalOpen(true)
  }

  // 删除书签
  const handleDeleteBookmark = (bookmarkId: string) => {
    if (window.confirm('确定要删除这个书签吗？')) {
      dispatch({ type: 'DELETE_BOOKMARK', payload: bookmarkId })
    }
  }

  // 标签过滤
  const toggleTag = (tag: string) => {
    const newSelectedTags = state.selectedTags.includes(tag)
      ? state.selectedTags.filter(t => t !== tag)
      : [...state.selectedTags, tag]
    dispatch({ type: 'SET_SELECTED_TAGS', payload: newSelectedTags })
  }

  const clearFilters = () => {
    dispatch({ type: 'SET_SELECTED_TAGS', payload: [] })
  }

  return (
    <div className="space-y-4">
      {/* 标签过滤 - 更紧凑 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <TagIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 flex-shrink-0">标签：</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                state.selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
          {state.selectedTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              清除
            </button>
          )}
        </div>
      )}

      {/* 书签分组 */}
      <div className="space-y-3">
        {state.groups
          .sort((a, b) => a.order - b.order)
          .map(group => {
            const groupBookmarks = getBookmarksByGroup(group.id)
            
            return (
              <div key={group.id} className="overflow-hidden">
                <div 
                  className={`transition-colors ${
                    dragOverGroup === group.id 
                      ? 'border-2 border-blue-400 bg-blue-50' 
                      : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, group.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, group.id)}
                >
                  {/* 分组头部 - 更紧凑 */}
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_GROUP_COLLAPSED', payload: group.id })}
                        className="flex items-center space-x-2 text-left hover:bg-gray-100 rounded-lg px-2 py-1 -mx-2 transition-colors"
                      >
                        {group.collapsed ? (
                          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                        )}
                        {group.collapsed ? (
                          <FolderIcon className="w-4 h-4" style={{ color: group.color }} />
                        ) : (
                          <FolderOpenIcon className="w-4 h-4" style={{ color: group.color }} />
                        )}
                        <span className="font-medium text-gray-900 text-sm">{group.name}</span>
                        <span className="text-xs text-gray-500">({groupBookmarks.length})</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingBookmark(null)
                            setEditingGroupId(group.id)
                            setIsModalOpen(true)
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                          title="添加书签"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>

                        {group.id !== '1' && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setGroupMenuOpen(groupMenuOpen === group.id ? null : group.id)
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            {groupMenuOpen === group.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-20 min-w-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setEditingGroupId(group.id)
                                    setGroupMenuOpen(null)
                                  }}
                                  className="w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  重命名
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 分组重命名 */}
                    {editingGroupId === group.id && (
                      <div className="mt-2 flex space-x-2">
                        <input
                          type="text"
                          defaultValue={group.name}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const newName = (e.target as HTMLInputElement).value.trim()
                              if (newName) {
                                dispatch({
                                  type: 'UPDATE_GROUP',
                                  payload: { id: group.id, updates: { name: newName } }
                                })
                              }
                              setEditingGroupId(null)
                            }
                          }}
                          onBlur={(e) => {
                            const newName = e.target.value.trim()
                            if (newName) {
                              dispatch({
                                type: 'UPDATE_GROUP',
                                payload: { id: group.id, updates: { name: newName } }
                              })
                            }
                            setEditingGroupId(null)
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* 书签列表 - 更紧凑 */}
                  {!group.collapsed && (
                    <div className="p-3">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {groupBookmarks.map(bookmark => (
                          <div
                            key={bookmark.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, bookmark)}
                            onDragEnd={handleDragEnd}
                            className={`group relative p-2 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                              state.draggedBookmark === bookmark.id ? 'opacity-50' : ''
                            }`}
                            onClick={() => onBookmarkClick ? onBookmarkClick(bookmark) : window.open(bookmark.url, '_blank')}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                                {bookmark.favicon ? (
                                  <img 
                                    src={bookmark.favicon} 
                                    alt=""
                                    className="w-5 h-5"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                    {bookmark.title.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs font-medium text-gray-900 truncate w-full leading-tight">
                                {bookmark.title}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditBookmark(bookmark)
                                }}
                                className="p-0.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
                                title="编辑"
                              >
                                <PencilIcon className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteBookmark(bookmark.id)
                                }}
                                className="p-0.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-red-50 transition-colors"
                                title="删除"
                              >
                                <TrashIcon className="w-3 h-3 text-red-600" />
                              </button>
                            </div>

                            {/* 标签指示器 */}
                            {bookmark.tags.length > 0 && (
                              <div className="absolute bottom-0.5 right-0.5">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 拖拽提示 */}
                      {dragOverGroup === group.id && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-600 text-center">
                            📌 释放以添加书签到此分组
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        {/* 添加分组 - 更紧凑 */}
        {showNewGroupInput ? (
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                onBlur={() => {
                  if (!newGroupName.trim()) {
                    setShowNewGroupInput(false)
                  }
                }}
                placeholder="分组名称"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                onClick={handleAddGroup}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewGroupInput(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-center text-gray-500 hover:text-blue-600"
          >
            <div className="flex items-center justify-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm">添加新分组</span>
            </div>
          </button>
        )}
      </div>

      {/* 书签编辑弹窗 */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBookmark(null)
          setEditingGroupId(null)
        }}
        bookmark={editingBookmark}
        groupId={editingGroupId || undefined}
      />
    </div>
  )
}

export default BookmarkManager
