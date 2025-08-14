import { useState, useEffect } from 'react'

/**
 * 移动端检测Hook
 * 检测当前设备是否为移动端，支持响应式变化
 * 
 * @param breakpoint 移动端断点，默认768px (md断点)
 * @returns boolean 是否为移动端
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // 初始化时检测，避免服务端渲染问题
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // 初始检测
    checkMobile()

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile)
    
    // 监听设备方向变化（移动端）
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [breakpoint])

  return isMobile
}

/**
 * 获取当前屏幕尺寸分类
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function useScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }
    return 'desktop'
  })

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    window.addEventListener('orientationchange', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
      window.removeEventListener('orientationchange', checkScreenSize)
    }
  }, [])

  return screenSize
}

/**
 * 响应式断点Hook
 * 提供更详细的断点信息
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      return {
        width,
        isXs: width >= 475,
        isSm: width >= 640,
        isMd: width >= 768,
        isLg: width >= 1024,
        isXl: width >= 1280,
        is2Xl: width >= 1536,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        current: width < 475 ? 'xs' :
                width < 640 ? 'sm' :
                width < 768 ? 'md' :
                width < 1024 ? 'lg' :
                width < 1280 ? 'xl' : '2xl'
      }
    }
    return {
      width: 1024,
      isXs: true,
      isSm: true,
      isMd: true,
      isLg: true,
      isXl: false,
      is2Xl: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      current: 'lg' as const
    }
  })

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      setBreakpoint({
        width,
        isXs: width >= 475,
        isSm: width >= 640,
        isMd: width >= 768,
        isLg: width >= 1024,
        isXl: width >= 1280,
        is2Xl: width >= 1536,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        current: width < 475 ? 'xs' :
                width < 640 ? 'sm' :
                width < 768 ? 'md' :
                width < 1024 ? 'lg' :
                width < 1280 ? 'xl' : '2xl'
      })
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    window.addEventListener('orientationchange', updateBreakpoint)

    return () => {
      window.removeEventListener('resize', updateBreakpoint)
      window.removeEventListener('orientationchange', updateBreakpoint)
    }
  }, [])

  return breakpoint
}
