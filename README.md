# All-in-One 个人效率工具

一个现代化的全功能个人效率管理工具，集成任务管理、习惯打卡、书签管理、日历事件和番茄钟等功能。

## 🌟 功能特色

### 📋 任务管理
- 灵活的任务分组管理
- 优先级设置（高/中/低）
- 截止日期和时间提醒
- 重复任务支持（每日/每周/每月）
- 任务完成状态跟踪
- 回收站功能

### 🎯 习惯打卡
- 每日/每周习惯打卡
- 连续打卡天数统计
- 习惯完成率分析
- 可视化数据统计
- 每日小记功能
- 习惯管理和编辑

### 🔖 书签管理
- 智能书签分组
- 标签系统
- 拖拽排序
- 自动获取网站图标
- 书签搜索和筛选
- 导入/导出功能

### 📅 日历事件
- 月视图日历显示
- 事件创建和管理
- 颜色标记分类
- 时间提醒设置

### 🍅 番茄钟
- 标准番茄工作法
- 自定义时长设置
- 工作/休息自动切换
- 专注统计记录
- 背景音效支持

### 🔍 智能搜索
- 多搜索引擎支持（Google、Bing、Bilibili、淘宝）
- 自定义搜索引擎
- 快捷键切换（Tab）
- 搜索历史记录

### ☁️ 云同步
- GitHub/Gitee 仓库同步
- 数据加密存储
- 自动/手动同步
- 多设备数据同步
- 备份和恢复

## 🚀 在线体验

访问：[https://we-worker.github.io/All_In_One_Web/](https://we-worker.github.io/All_In_One_Web/)

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图标**: Heroicons
- **路由**: React Router
- **状态管理**: React Context + useReducer
- **数据存储**: LocalStorage + 云同步
- **加密**: CryptoJS
- **部署**: GitHub Pages + GitHub Actions

## 📦 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/All_In_One_Web.git

# 进入项目目录
cd All_In_One_Web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 部署到 GitHub Pages

1. Fork 或克隆此仓库到你的 GitHub 账户
2. 在仓库设置中启用 GitHub Pages
3. 选择 "GitHub Actions" 作为部署源
4. 推送代码到 main 分支，GitHub Actions 会自动构建和部署

## ⚙️ 配置说明

### 云同步设置

1. **GitHub 同步**:
   - 访问 [GitHub Token 设置](https://github.com/settings/tokens)
   - 创建 Personal Access Token，选择 `repo` 权限
   - 在应用设置中配置 GitHub 信息

2. **Gitee 同步**:
   - 访问 [Gitee Token 设置](https://gitee.com/profile/personal_access_tokens)
   - 创建私人令牌，选择仓库权限
   - 在应用设置中配置 Gitee 信息

### 自定义搜索引擎

在首页搜索区域点击"自定义"按钮，添加你喜欢的搜索引擎：
- 名称：搜索引擎名称
- URL：搜索 URL（需要包含查询参数，如 `https://example.com/search?q=`）
- 图标：Emoji 或字符

## 📱 移动端支持

- 响应式设计，完美适配手机和平板
- 触摸友好的交互体验
- PWA 支持（计划中）
- 离线使用功能

## 🎨 界面特色

- 现代化 Material Design 风格
- 直观的用户交互体验
- 流畅的动画效果
- 深色/浅色主题切换（计划中）
- 自适应布局

## 📊 数据隐私

- 所有数据存储在本地浏览器
- 云同步使用你自己的 Git 仓库
- 敏感信息使用 AES 加密
- 不收集任何个人信息


---

⭐ 如果这个项目对你有帮助，请给一个 Star 支持一下！
