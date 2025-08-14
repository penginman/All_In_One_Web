/**
 * 移动端触摸交互工具函数
 */

// 导入 CSS 类型扩展
import '../types/css'

/**
 * 获取触摸反馈的CSS类名
 * @param type 反馈类型
 * @returns CSS类名字符串
 */
export function getTouchFeedbackClasses(type: 'button' | 'card' | 'item' = 'button'): string {
  const baseClasses = 'touch-target transition-all duration-200'
  
  switch (type) {
    case 'button':
      return `${baseClasses} btn-touch hover:shadow-md active:shadow-sm`
    case 'card':
      return `${baseClasses} card-touch hover:shadow-lg active:shadow-md`
    case 'item':
      return `${baseClasses} touch-feedback hover:bg-gray-50 active:bg-gray-100`
    default:
      return baseClasses
  }
}

/**
 * 检测是否为触摸设备
 * @returns boolean
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * 添加触摸反馈事件监听器
 * @param element HTML元素
 * @param options 配置选项
 */
export function addTouchFeedback(
  element: HTMLElement,
  options: {
    scale?: number
    duration?: number
    className?: string
  } = {}
): () => void {
  const { scale = 0.95, duration = 150, className = 'touch-active' } = options

  const handleTouchStart = () => {
    element.style.transform = `scale(${scale})`
    element.style.transition = `transform ${duration}ms ease`
    element.classList.add(className)
  }

  const handleTouchEnd = () => {
    element.style.transform = 'scale(1)'
    setTimeout(() => {
      element.classList.remove(className)
    }, duration)
  }

  // 添加事件监听器
  element.addEventListener('touchstart', handleTouchStart, { passive: true })
  element.addEventListener('touchend', handleTouchEnd, { passive: true })
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true })

  // 返回清理函数
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchEnd)
  }
}

/**
 * 防抖函数，用于优化触摸事件
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数，用于优化滚动等高频事件
 * @param func 要节流的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 获取安全区域内边距
 * @returns 安全区域内边距对象
 */
export function getSafeAreaInsets(): {
  top: number
  bottom: number
  left: number
  right: number
} {
  // 尝试获取CSS环境变量
  const computedStyle = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
  }
}

/**
 * 优化移动端滚动体验
 * @param element 要优化的元素
 */
export function optimizeScrolling(element: HTMLElement): void {
  // 启用硬件加速
  element.style.transform = 'translateZ(0)'
  element.style.willChange = 'scroll-position'

  // 优化滚动行为 - WebKit 特有属性
  element.style.webkitOverflowScrolling = 'touch'
  element.style.overscrollBehavior = 'contain'

  // 添加滚动优化类
  element.classList.add('mobile-scroll')
}

/**
 * 创建触摸友好的点击处理器
 * @param handler 点击处理函数
 * @param options 配置选项
 * @returns 优化后的事件处理器
 */
export function createTouchHandler(
  handler: () => void,
  options: {
    debounceTime?: number
    preventDefault?: boolean
  } = {}
): (event: Event) => void {
  const { debounceTime = 300, preventDefault = true } = options
  
  const debouncedHandler = debounce(handler, debounceTime)
  
  return (event: Event) => {
    if (preventDefault) {
      event.preventDefault()
    }
    debouncedHandler()
  }
}
