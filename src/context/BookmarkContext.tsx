import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { BookmarkState, BookmarkAction, Bookmark, BookmarkGroup } from '../types/bookmarks'

const STORAGE_KEY = 'bookmarks-data'

const initialState: BookmarkState = {
  bookmarks: [],
  groups: [
    {
      id: '1',
      name: '常用',
      color: '#3b82f6',
      order: 0,
      collapsed: false,
      createdAt: new Date()
    }
  ],
  draggedBookmark: null,
  draggedGroup: null,
  selectedTags: [],
  searchQuery: ''
}

function bookmarkReducer(state: BookmarkState, action: BookmarkAction): BookmarkState {
  switch (action.type) {
    case 'ADD_BOOKMARK': {
      const newBookmark: Bookmark = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return {
        ...state,
        bookmarks: [...state.bookmarks, newBookmark]
      }
    }
    
    case 'ADD_BROWSER_BOOKMARK': {
      const { title, url, groupId } = action.payload
      
      // 检查是否已存在相同URL的书签
      const existingBookmark = state.bookmarks.find(b => b.url === url)
      if (existingBookmark) {
        console.log('Bookmark already exists:', url)
        return state
      }
      
      const targetGroupBookmarksCount = state.bookmarks.filter(b => b.groupId === groupId).length
      const newBookmark: Bookmark = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: title || '新书签',
        url: url,
        description: '',
        favicon: `https://favicone.com${new URL(url).hostname}`,
        tags: [],
        groupId: groupId,
        order: targetGroupBookmarksCount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Adding browser bookmark:', newBookmark)
      
      return {
        ...state,
        bookmarks: [...state.bookmarks, newBookmark]
      }
    }

    case 'UPDATE_BOOKMARK': {
      return {
        ...state,
        bookmarks: state.bookmarks.map(bookmark =>
          bookmark.id === action.payload.id
            ? { ...bookmark, ...action.payload.updates, updatedAt: new Date() }
            : bookmark
        )
      }
    }

    case 'DELETE_BOOKMARK': {
      return {
        ...state,
        bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== action.payload)
      }
    }

    case 'MOVE_BOOKMARK': {
      const { bookmarkId, targetGroupId, newOrder } = action.payload
      return {
        ...state,
        bookmarks: state.bookmarks.map(bookmark => {
          if (bookmark.id === bookmarkId) {
            return { ...bookmark, groupId: targetGroupId, order: newOrder, updatedAt: new Date() }
          }
          return bookmark
        })
      }
    }

    case 'ADD_GROUP': {
      const newGroup: BookmarkGroup = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      }
      return {
        ...state,
        groups: [...state.groups, newGroup]
      }
    }

    case 'UPDATE_GROUP': {
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.id
            ? { ...group, ...action.payload.updates }
            : group
        )
      }
    }

    case 'DELETE_GROUP': {
      // 将被删除分组的书签移动到常用
      const updatedBookmarks = state.bookmarks.map(bookmark =>
        bookmark.groupId === action.payload
          ? { ...bookmark, groupId: '1', updatedAt: new Date() }
          : bookmark
      )
      
      return {
        ...state,
        bookmarks: updatedBookmarks,
        groups: state.groups.filter(group => group.id !== action.payload)
      }
    }

    case 'TOGGLE_GROUP_COLLAPSED': {
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload
            ? { ...group, collapsed: !group.collapsed }
            : group
        )
      }
    }

    case 'SET_DRAGGED_BOOKMARK': {
      return { ...state, draggedBookmark: action.payload }
    }

    case 'SET_DRAGGED_GROUP': {
      return { ...state, draggedGroup: action.payload }
    }

    case 'SET_SELECTED_TAGS': {
      return { ...state, selectedTags: action.payload }
    }

    case 'SET_SEARCH_QUERY': {
      return { ...state, searchQuery: action.payload }
    }

    case 'IMPORT_BOOKMARKS': {
      return {
        ...state,
        bookmarks: [...state.bookmarks, ...action.payload]
      }
    }

    case 'LOAD_FROM_STORAGE': {
      console.log('Loading from storage:', action.payload)
      return {
        ...state,
        bookmarks: action.payload.bookmarks || [],
        groups: action.payload.groups && action.payload.groups.length > 0 
          ? action.payload.groups 
          : state.groups
      }
    }

    default:
      return state
  }
}

interface BookmarkContextType {
  state: BookmarkState
  dispatch: React.Dispatch<BookmarkAction>
  getAllTags: () => string[]
  getFilteredBookmarks: () => Bookmark[]
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined)

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookmarkReducer, initialState)
  const initializeRef = useRef(false)

  // 初始化加载数据 - 只执行一次
  useEffect(() => {
    if (initializeRef.current) return
    initializeRef.current = true

    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const { bookmarks, groups } = JSON.parse(savedData)
        if (bookmarks?.length > 0 || groups?.length > 0) {
          dispatch({
            type: 'LOAD_FROM_STORAGE',
            payload: {
              bookmarks: (bookmarks || []).map((b: unknown) => {
                const bookmark = b as import('../types/bookmarks').Bookmark
                return {
                  ...bookmark,
                  createdAt: new Date(bookmark.createdAt),
                  updatedAt: new Date(bookmark.updatedAt)
                }
              }),
              groups: (groups || initialState.groups).map((g: unknown) => {
                const group = g as import('../types/bookmarks').BookmarkGroup
                return {
                  ...group,
                  createdAt: new Date(group.createdAt)
                }
              })
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }, [])

  // 自动保存数据 - 防抖处理
  useEffect(() => {
    if (!initializeRef.current) return
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          bookmarks: state.bookmarks,
          groups: state.groups,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (error) {
        console.error('Failed to save bookmarks:', error)
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [state.bookmarks, state.groups])

  const getAllTags = () => {
    const allTags = new Set<string>()
    state.bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags).sort()
  }

  const getFilteredBookmarks = () => {
    return state.bookmarks.filter(bookmark => {
      const matchesSearch = state.searchQuery === '' || 
        bookmark.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(state.searchQuery.toLowerCase())

      const matchesTags = state.selectedTags.length === 0 ||
        state.selectedTags.every(tag => bookmark.tags.includes(tag))

      return matchesSearch && matchesTags
    })
  }

  return (
    <BookmarkContext.Provider value={{ state, dispatch, getAllTags, getFilteredBookmarks }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarkContext() {
  const context = useContext(BookmarkContext)
  if (context === undefined) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider')
  }
  return context
}
