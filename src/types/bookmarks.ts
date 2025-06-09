export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  tags: string[]
  groupId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface BookmarkGroup {
  id: string
  name: string
  color: string
  order: number
  collapsed: boolean
  createdAt: Date
}

export interface BookmarkState {
  bookmarks: Bookmark[]
  groups: BookmarkGroup[]
  draggedBookmark: string | null
  draggedGroup: string | null
  selectedTags: string[]
  searchQuery: string
}

export type BookmarkAction =
  | { type: 'ADD_BOOKMARK'; payload: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_BOOKMARK'; payload: { id: string; updates: Partial<Bookmark> } }
  | { type: 'DELETE_BOOKMARK'; payload: string }
  | { type: 'MOVE_BOOKMARK'; payload: { bookmarkId: string; targetGroupId: string; newOrder: number } }
  | { type: 'ADD_GROUP'; payload: Omit<BookmarkGroup, 'id' | 'createdAt'> }
  | { type: 'UPDATE_GROUP'; payload: { id: string; updates: Partial<BookmarkGroup> } }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'MOVE_GROUP'; payload: { groupId: string; newOrder: number } }
  | { type: 'TOGGLE_GROUP_COLLAPSED'; payload: string }
  | { type: 'SET_DRAGGED_BOOKMARK'; payload: string | null }
  | { type: 'SET_DRAGGED_GROUP'; payload: string | null }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'IMPORT_BOOKMARKS'; payload: Bookmark[] }
  | { type: 'LOAD_FROM_STORAGE'; payload: { bookmarks: Bookmark[]; groups: BookmarkGroup[] } }
  | { type: 'ADD_BROWSER_BOOKMARK'; payload: { title: string; url: string; groupId: string } }
