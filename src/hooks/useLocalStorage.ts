import { useState, useCallback } from 'react'

function useLocalStorage<T>(key: string, initialValue: T) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 优化的设置值函数 - 移除有问题的依赖
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        return valueToStore
      })
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key]) // 只依赖 key

  // 新增：直接获取存储值的方法
  const getStoredValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [key, initialValue])

  return [storedValue, setValue, getStoredValue] as const
}

export default useLocalStorage
