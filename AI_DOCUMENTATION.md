# 项目代码结构说明 (AI参考)

本文档旨在帮助AI快速理解项目结构和核心功能逻辑。

### 0. 总体架构 (Overall Architecture)

-   **核心架构:** 应用采用基于 React Context 的模块化状态管理。每个核心功能（如任务、书签、日历等）都有自己独立的 Context Provider。
-   **入口文件:** `src/main.tsx` 是应用的入口，它使用 `BrowserRouter` 包裹根组件 `App`。
-   **Provider 注册:** `src/App.tsx` 是所有 Context Provider 的集中注册地，它将各个功能的 Provider (`TaskProvider`, `BookmarkProvider` 等) 包裹在路由组件外层，确保全局状态的可用性。
-   **路由管理:** 使用 `react-router-dom` 进行页面导航，所有路由在 `src/App.tsx` 中定义。
-   **数据类型:** 所有核心数据结构的 TypeScript 类型定义都存放在 `src/types/` 目录下，按功能模块划分 (e.g., `tasks.ts`, `bookmarks.ts`)。
-   **数据持久化:** 每个功能模块的 Context 负责将其状态持久化到浏览器的 `localStorage`，并在应用启动时加载。

### 1. 书签管理 (Bookmark Feature)

书签功能是应用的核心，允许用户创建、管理和组织书签。

-   **类型定义:** `src/types/bookmarks.ts`
    -   定义了 `Bookmark`, `BookmarkGroup`, `BookmarkState`, `BookmarkAction` 等核心类型。

-   **核心逻辑与状态管理:** `src/context/BookmarkContext.tsx`
    -   **定义:** `BookmarkProvider` (React Context Provider) 和 `useBookmarkContext` (Hook)。这是所有书签数据的唯一真实来源 (Single Source of Truth)。
    -   **状态 (`BookmarkState`):** 包含 `bookmarks` (书签列表), `groups` (分组列表), `selectedTags` (标签过滤) 等。
    -   **数据操作:** 通过 `bookmarkReducer` 处理所有数据变更。关键 `Action` 类型包括:
        -   `ADD_BOOKMARK`, `UPDATE_BOOKMARK`, `DELETE_BOOKMARK`: 增删改书签。
        -   `ADD_GROUP`, `UPDATE_GROUP`, `DELETE_GROUP`: 增删改分组。
        -   `MOVE_BOOKMARK`: 在分组间移动书签。
        -   `ADD_BROWSER_BOOKMARK`: 处理从浏览器拖拽进来的书签。
    -   **数据持久化:** 自动将状态同步到浏览器的 `localStorage` (key: `bookmarks-data`)。
    -   **输入:** `dispatch` 一个 `BookmarkAction` 对象。
    -   **输出:** 更新后的 `state`，并通过 Context 提供给所有子组件。

-   **UI - 书签管理器:** `src/components/Bookmarks/BookmarkManager.tsx`
    -   **定义:** `BookmarkManager` 组件，负责渲染所有书签分组和书签项。
    -   **功能:**
        -   显示分组和书签列表。
        -   处理书签和分组的拖拽排序/移动。
        -   支持从外部浏览器拖拽链接直接创建书签。
        -   提供添加、重命名、删除分组的UI交互。
        -   提供编辑、删除单个书签的快捷按钮。
        -   调用 `BookmarkModal` 来添加/编辑书签。
    -   **依赖:** 使用 `useBookmarkContext` 来获取数据和 `dispatch` 方法。

-   **UI - 书签编辑弹窗:** `src/components/Bookmarks/BookmarkModal.tsx`
    -   **定义:** `BookmarkModal` 组件，一个用于添加或编辑书签的模态框表单。
    -   **功能:**
        -   提供表单输入项：URL、标题、描述、标签、所属分组。
        -   当输入URL时，会自动尝试获取网站标题。
    -   **输入 (Props):** `isOpen`, `onClose`, `bookmark` (编辑模式), `groupId` (添加模式)。
    -   **输出:** 用户提交表单后，通过 `useBookmarkContext` 的 `dispatch` 方法发送 `ADD_BOOKMARK` 或 `UPDATE_BOOKMARK` action。

### 2. 快速搜索 (Search Feature)

快速搜索功能提供了一个集成的搜索框，支持切换多个搜索引擎。

-   **类型定义:** `src/types/bookmarks.ts`
    -   定义了 `SearchEngine` 和 `SearchEngineKey` 类型。

-   **核心逻辑与UI:** `src/pages/Home/Home.tsx`
    -   **逻辑定义:** `SearchEngineManager` 静态类。
        -   **功能:** 封装了所有与搜索引擎相关的操作，如获取可用引擎、获取/设置当前引擎、获取/设置自定义引擎、生成搜索URL。
        -   **数据源:** 默认引擎硬编码在 `DEFAULT_SEARCH_ENGINES` 常量中，自定义引擎和当前引擎选择存储在 `localStorage`。
    -   **UI定义:** `Home` 组件。
        -   **功能:**
            -   渲染搜索输入框和搜索引擎切换按钮。
            -   管理搜索词 (`searchQuery`) 状态。
            -   处理搜索事件 (`handleSearch`) 和键盘事件 (回车搜索, Tab切换引擎)。
            -   渲染添加自定义搜索引擎的表单。
        -   **依赖:** 调用 `SearchEngineManager` 的静态方法来驱动逻辑。

### 3. 任务管理 (Task Feature)

-   **类型定义:** `src/types/tasks.ts`
    -   定义了 `Task` (任务), `TaskGroup` (分组), 和 `TaskFilter` (过滤器) 等类型。
-   **核心逻辑与状态管理:** `src/context/TaskContext.tsx`
    -   包含 `TaskProvider` 和 `useTaskContext`。
    -   通过 `taskReducer` 管理 `TaskState`，处理任务的增删改查、分组管理等操作。
    -   将任务数据持久化到 `localStorage` (推测 key: `tasks-data`)。
-   **UI:** `src/pages/Tasks/Tasks.tsx`
    -   渲染任务列表、分组。
    -   提供任务筛选、排序和创建新任务的界面。
    -   与 `TaskContext` 交互以更新和获取数据。
    -   **响应式设计**:
        -   `Tasks.tsx` 组件会根据屏幕宽度动态渲染 `TaskDesktop.tsx` 或 `TaskMobile.tsx`。
        -   **桌面版 (`TaskDesktop.tsx`):** 经典的三栏布局，左侧为分组和筛选，中间为任务列表。
        -   **移动版 (`TaskMobile.tsx`):** 移动优先设计，使用底部面板进行分组选择和筛选，优化小屏体验。

### 4. 番茄钟 (Pomodoro Feature)

-   **类型定义:** `src/types/pomodoro.ts`
    -   定义了 `PomodoroSession` (会话), `PomodoroSettings` (设置), `PomodoroState` (状态), 和 `PomodoroAction` (操作) 等类型。
-   **核心逻辑与状态管理:** `src/context/PomodoroContext.tsx`
    -   包含 `PomodoroProvider` 和 `usePomodoroContext`。
    -   通过 `pomodoroReducer` 管理计时器状态 (`currentSession`)、会话历史 (`sessions`) 和用户设置 (`settings`)。
    -   将番茄钟的会话历史和设置持久化到 `localStorage` (推测 key: `pomodoro-data`)。
-   **UI:** `src/pages/Pomodoro/PomodoroTimer.tsx`
    -   显示当前的计时器。
    -   提供控制按钮（开始、暂停、重置）。
    -   显示会话统计数据。

### 5. 习惯打卡 (Habit Feature)

-   **类型定义:** `src/types/habits.ts`
    -   定义了 `Habit` (习惯), `HabitRecord` (打卡记录), `DailyNote` (日志), 和 `HabitState` (状态) 等类型。
-   **核心逻辑与状态管理:** `src/context/HabitContext.tsx`
    -   包含 `HabitProvider` 和 `useHabitContext`。
    -   通过 `habitReducer` 管理习惯列表 (`habits`)、打卡记录 (`records`) 和每日笔记 (`dailyNotes`)。
    -   将习惯数据持久化到 `localStorage` (推测 key: `habits-data`)。
-   **UI:** `src/pages/Habits/Habits.tsx`
    -   以周或月视图显示习惯。
    -   允许用户完成当天的习惯打卡。
    -   展示习惯的统计数据（如连续打卡天数）。
    -   **多视图架构**:
        -   **主视图 (`main`):** 核心打卡界面，包含周视图和今日习惯列表。
        -   **统计视图 (`stats`):** 展示所有习惯的详细统计数据。
        -   **管理视图 (`management`):** 集中管理所有习惯的列表。
    -   **交互弹窗**: 使用 `HabitModal` (编辑/添加习惯), `DailyNoteModal` (每日小记), `DayHabitsModal` (查看某日习惯详情) 增强交互。

### 6. 日历 (Calendar Feature)

-   **类型定义:** `src/types/calendar.ts`
    -   定义了 `CalendarEvent` (日历事件), `CalendarView` (视图), 和 `CalendarState` (状态) 等类型。
-   **核心逻辑与状态管理:** `src/context/CalendarContext.tsx`
    -   包含 `CalendarProvider` 和 `useCalendarContext`。
    -   管理 `CalendarEvent` 列表，并集成来自任务和习惯模块的数据（通过 `showTasks`, `showHabits` 状态控制）。
    -   处理视图切换（月/周）和日期导航。
    -   将日历数据持久化到 `localStorage` (推测 key: `calendar-data`)。
-   **UI:** `src/pages/Calendar/Calendar.tsx`
    -   渲染一个全功能的日历组件。
    -   在日历上显示事件、任务截止日期和习惯。

### 7. Git 同步 (Git Sync Feature)

-   **核心工具:** `src/utils/gitSync.ts`
    -   定义了 `gitSyncClient` 类，封装了与 Git 服务商 (GitHub/Gitee) 的所有 API 交互。
    -   负责配置的保存/加载 (`localStorage` key: `git-sync-config`)、文件操作（读、写、删除、列出）和连接测试。
-   **核心逻辑与状态管理:** `src/context/AppContext.tsx`
    -   Git 同步是一个应用级功能，其状态和操作由 `AppContext` 管理。
    -   `state` 中包含 `gitConfig`, `gitConnected`, `syncStatus`, `syncMessage` 等。
    -   提供 `syncToCloud` 和 `syncFromCloud` 方法，这些方法会调用各个功能模块的 `exportData` 和 `importData` 方法，实现全量数据的同步。
-   **UI:** `src/pages/Settings/GitSyncSettings.tsx`
    -   提供完整的 Git 同步配置界面（服务商、Token、仓库信息）。
    -   允许用户测试连接、保存/清除配置。
    -   显示同步状态和云端文件列表，并提供文件管理功能（查看、删除）。

### 8. 通用/应用级 (App-level)

-   **核心逻辑与状态管理:** `src/context/AppContext.tsx`
    -   **定义:** `AppProvider` 和 `useAppContext`。
    -   **目的:** 管理不属于任何特定功能模块的全局状态和操作。
    -   **管理内容:**
        -   **Git 同步:** 如上一节所述，管理所有与 Git 同步相关的状态和顶层操作。
        -   **全局设置:** 未来可用于管理主题、语言等应用级设置。
        -   **跨模块协调:** 作为协调器，调用其他 Context 的方法（如 `syncToCloud` 协调所有模块的数据导出）。
