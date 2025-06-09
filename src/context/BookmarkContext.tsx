import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { BookmarkState, BookmarkAction, Bookmark, BookmarkGroup } from '../types/bookmarks'

const STORAGE_KEY = 'bookmarks-data'

const initialState: BookmarkState = {
  bookmarks: [],
  groups: [
    {
      id: '1',
      name: '默认分组',
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
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
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
      // 将被删除分组的书签移动到默认分组
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
  const [isLoaded, setIsLoaded] = React.useState(false)

  // 从本地存储加载数据
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY)
        console.log('Raw saved data:', savedData)
        
        if (savedData) {
          const { bookmarks, groups } = JSON.parse(savedData)
          console.log('Parsed data:', { bookmarks, groups })
          
          dispatch({
            type: 'LOAD_FROM_STORAGE',
            payload: {
              bookmarks: (bookmarks || []).map((b: any) => ({
                ...b,
                createdAt: new Date(b.createdAt),
                updatedAt: new Date(b.updatedAt)
              })),
              groups: (groups || []).map((g: any) => ({
                ...g,
                createdAt: new Date(g.createdAt)
              }))
            }
          })
        }
      } catch (error) {
        console.error('Failed to load bookmarks from storage:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadFromStorage()
  }, [])

  // 保存到本地存储
  useEffect(() => {
    if (!isLoaded) return // 避免在首次加载时覆盖数据
    
    const dataToSave = {
      bookmarks: state.bookmarks,
      groups: state.groups,
      timestamp: new Date().toISOString()
    }
    
    console.log('Saving to storage:', dataToSave)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  }, [state.bookmarks, state.groups, isLoaded])

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

  console.log('Current state:', { bookmarks: state.bookmarks.length, groups: state.groups.length })

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
