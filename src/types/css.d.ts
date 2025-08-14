/**
 * CSS 类型扩展
 * 为 TypeScript 添加 WebKit 特有的 CSS 属性支持
 */

declare module 'react' {
  interface CSSProperties {
    /**
     * WebKit 特有的滚动优化属性
     * 用于在 iOS Safari 中启用硬件加速滚动
     */
    webkitOverflowScrolling?: 'auto' | 'touch'
    
    /**
     * WebKit 特有的字体平滑属性
     */
    WebkitFontSmoothing?: 'auto' | 'none' | 'antialiased' | 'subpixel-antialiased'
    
    /**
     * WebKit 特有的文本填充颜色
     */
    WebkitTextFillColor?: string
    
    /**
     * WebKit 特有的背景剪裁
     */
    WebkitBackgroundClip?: 'border-box' | 'padding-box' | 'content-box' | 'text'
    
    /**
     * WebKit 特有的变换样式
     */
    WebkitTransformStyle?: 'flat' | 'preserve-3d'
    
    /**
     * WebKit 特有的背面可见性
     */
    WebkitBackfaceVisibility?: 'visible' | 'hidden'
    
    /**
     * WebKit 特有的用户选择
     */
    WebkitUserSelect?: 'auto' | 'none' | 'text' | 'all'
    
    /**
     * WebKit 特有的触摸动作
     */
    WebkitTouchCallout?: 'default' | 'none'
    
    /**
     * WebKit 特有的外观
     */
    WebkitAppearance?: 'none' | 'auto' | 'button' | 'textfield' | 'searchfield'
  }
}

// 扩展 HTMLElement 的 style 属性
declare global {
  interface CSSStyleDeclaration {
    webkitOverflowScrolling?: string
    WebkitFontSmoothing?: string
    WebkitTextFillColor?: string
    WebkitBackgroundClip?: string
    WebkitTransformStyle?: string
    WebkitBackfaceVisibility?: string
    WebkitUserSelect?: string
    WebkitTouchCallout?: string
    WebkitAppearance?: string
  }
}

export {}
