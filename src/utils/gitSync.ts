import CryptoJS from 'crypto-js'

export interface GitConfig {
  provider: 'github' | 'gitee'
  token: string
  owner: string
  repo: string
  branch?: string
}

export interface SyncData {
  tasks: any[]
  taskGroups: any[]
  habits: any[]
  bookmarks: any[]
  bookmarkGroups: any[]
  calendarEvents: any[]
  lastSyncTime: string
  md5Hash: string
}

export interface DataModule {
  name: string
  localStorageKey: string
  filename: string
  getData: () => any
  setData: (data: any) => void
}

export interface SyncStatus {
  filename: string
  localHash: string
  cloudHash: string
  needsSync: boolean
  lastSyncTime?: string
}

export interface GitFile {
  name: string
  sha: string
  size: number
  download_url: string
  path: string
  last_modified?: string
}

class GitSyncClient {
  private config: GitConfig | null = null
  private readonly STORAGE_KEY = 'git-sync-config-encrypted'
  private readonly SECRET_KEY = 'all-in-one-git-sync-secret'
  private readonly SYNC_PREFIX = 'sync-'
  
  // 数据模块配置
  private dataModules: DataModule[] = [
    {
      name: 'tasks',
      localStorageKey: 'tasks-data',
      filename: 'tasks.json',
      getData: () => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const taskGroups = JSON.parse(localStorage.getItem('taskGroups') || '[]')
        return { tasks, taskGroups }
      },
      setData: (data) => {
        localStorage.setItem('tasks', JSON.stringify(data.tasks || []))
        localStorage.setItem('taskGroups', JSON.stringify(data.taskGroups || []))
      }
    },
    {
      name: 'habits',
      localStorageKey: 'habits',
      filename: 'habits.json', 
      getData: () => JSON.parse(localStorage.getItem('habits') || '[]'),
      setData: (data) => localStorage.setItem('habits', JSON.stringify(data))
    },
    {
      name: 'bookmarks',
      localStorageKey: 'bookmarks-data',
      filename: 'bookmarks.json',
      getData: () => {
        const data = JSON.parse(localStorage.getItem('bookmarks-data') || '{"bookmarks":[],"groups":[]}')
        return { bookmarks: data.bookmarks || [], groups: data.groups || [] }
      },
      setData: (data) => localStorage.setItem('bookmarks-data', JSON.stringify(data))
    },
    {
      name: 'calendarEvents', 
      localStorageKey: 'calendar-events',
      filename: 'calendar-events.json',
      getData: () => JSON.parse(localStorage.getItem('calendar-events') || '[]'),
      setData: (data) => localStorage.setItem('calendar-events', JSON.stringify(data))
    }
  ]

  // 本地哈希缓存，用于检测数据变化
  private localHashCache = new Map<string, string>()

  // 加密配置
  encryptConfig(config: GitConfig): string {
    return CryptoJS.AES.encrypt(JSON.stringify(config), this.SECRET_KEY).toString()
  }

  // 解密配置
  decryptConfig(encryptedConfig: string): GitConfig | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedConfig, this.SECRET_KEY)
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('Failed to decrypt Git config:', error)
      return null
    }
  }

  // 获取API基础URL
  private getApiBase(): string {
    if (!this.config) throw new Error('Git sync not configured')
    
    return this.config.provider === 'github' 
      ? 'https://api.github.com'
      : 'https://gitee.com/api/v5'
  }

  // 获取仓库API路径
  private getRepoPath(): string {
    if (!this.config) throw new Error('Git sync not configured')
    return `repos/${this.config.owner}/${this.config.repo}`
  }

  // 发送API请求
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.config) throw new Error('Git sync not configured')
    
    const url = `${this.getApiBase()}/${endpoint}`
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    // 设置认证头 - GitHub 和 Gitee 都使用 token 认证
    headers['Authorization'] = `token ${this.config.token}`

    console.log('API Request:', { method: options.method || 'GET', url, headers: { ...headers, Authorization: 'token ***' } })

    return fetch(url, {
      ...options,
      headers
    })
  }

  // 保存配置到本地存储
  saveConfig(config: GitConfig): void {
    // 对于 Gitee，默认分支通常是 master
    if (!config.branch) {
      config.branch = config.provider === 'gitee' ? 'master' : 'main'
    }
    
    const encrypted = this.encryptConfig(config)
    localStorage.setItem(this.STORAGE_KEY, encrypted)
    this.config = config
  }

  // 从本地存储加载配置
  loadConfig(): GitConfig | null {
    const encrypted = localStorage.getItem(this.STORAGE_KEY)
    if (!encrypted) return null

    const config = this.decryptConfig(encrypted)
    if (config) {
      // 确保有默认分支
      if (!config.branch) {
        config.branch = config.provider === 'gitee' ? 'master' : 'main'
      }
      this.config = config
    }
    return config
  }

  // 清除配置
  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    this.config = null
  }

  // 生成数据哈希
  private generateDataHash(data: any): string {
    return CryptoJS.MD5(JSON.stringify(data, null, 2)).toString()
  }

  // 获取本地数据哈希
  private getLocalDataHash(module: DataModule): string {
    const data = module.getData()
    return this.generateDataHash(data)
  }

  // 检查数据是否有变化
  private hasDataChanged(module: DataModule): boolean {
    const currentHash = this.getLocalDataHash(module)
    const cachedHash = this.localHashCache.get(module.name)
    
    if (cachedHash !== currentHash) {
      this.localHashCache.set(module.name, currentHash)
      return true
    }
    return false
  }

  // 初始化本地哈希缓存
  private initializeHashCache(): void {
    this.dataModules.forEach(module => {
      this.localHashCache.set(module.name, this.getLocalDataHash(module))
    })
  }

  // 测试连接和权限
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: '请先配置Git同步信息' }
    }

    try {
      // 测试仓库访问权限
      const response = await this.apiRequest(this.getRepoPath())
      
      if (response.ok) {
        const repoData = await response.json()
        
        // 检查是否有写权限 - 兼容GitHub和Gitee的权限结构
        const hasWriteAccess = 
          // GitHub 格式
          repoData.permissions?.push || repoData.permissions?.admin ||
          // Gitee 格式
          repoData.permission?.push || repoData.permission?.admin ||
          // 如果是自己的仓库或者有 master 权限
          repoData.permissions?.maintain || repoData.permission?.master ||
          false
        
        console.log('Repository permissions:', repoData.permissions || repoData.permission)
        
        if (hasWriteAccess) {
          return { 
            success: true, 
            message: `连接成功，仓库: ${repoData.full_name || repoData.path}` 
          }
        } else {
          return { 
            success: false, 
            message: '仓库访问成功但没有写权限，请检查Token权限' 
          }
        }
      } else if (response.status === 401) {
        return { success: false, message: 'Token认证失败，请检查Token是否正确' }
      } else if (response.status === 404) {
        return { success: false, message: '仓库不存在或无访问权限' }
      } else {
        return { success: false, message: `连接失败: ${response.status} ${response.statusText}` }
      }
    } catch (error: any) {
      return { success: false, message: `连接错误: ${error.message}` }
    }
  }

  // 获取文件内容
  async getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      // 修复：直接使用 apiRequest，不要重复拼接 API 基础 URL
      const endpoint = `${this.getRepoPath()}/contents/${path}?ref=${this.config?.branch || 'main'}`
      
      console.log('Getting file content:', endpoint)
      const response = await this.apiRequest(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))))
          return {
            content,
            sha: data.sha
          }
        }
      }
      return null
    } catch (error: any) {
      console.log('File not found:', path)
      return null
    }
  }

  // 创建或更新文件
async createOrUpdateFile(path: string, content: string, message: string, existingSha?: string): Promise<boolean> {
  try {
    const encodedContent = btoa(unescape(encodeURIComponent(content)))
    
    // 首先尝试获取现有文件（如果没有提供 SHA）
    let sha = existingSha
    if (!sha) {
      const existingFile = await this.getFileContent(path)
      sha = existingFile?.sha
      console.log('Existing file found:', existingFile ? 'yes' : 'no')
    }

    // 如果是 Gitee 且没有找到现有文件，使用专门的创建方法
    if (!sha && this.config?.provider === 'gitee') {
      console.log('Using Gitee-specific file creation method')
      return await this.createNewFileForGitee(path, content, message)
    }

    // 构建请求数据
    const requestData: any = {
      message,
      content: encodedContent,
      branch: this.config?.branch || (this.config?.provider === 'gitee' ? 'master' : 'main')
    }

    // 只有当有 SHA 时才添加（表示更新现有文件）
    if (sha && sha.trim()) {
      requestData.sha = sha
      console.log('Updating existing file with SHA:', sha)
    } else {
      console.log('Creating new file without SHA')
    }

    const endpoint = `${this.getRepoPath()}/contents/${path}`
    
    console.log('API Request:', {
      method: 'PUT',
      endpoint,
      data: { ...requestData, content: '[CONTENT_HIDDEN]' }
    })

    const response = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestData)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('File operation successful')
      return result.content !== undefined
    } else {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      
      // 如果是 Gitee 且出现 SHA 相关错误，尝试获取正确的 SHA 并重试
      if (this.config?.provider === 'gitee' && errorText.includes('sha')) {
        console.log('Retrying with fresh SHA for Gitee...')
        const freshFile = await this.getFileContent(path)
        if (freshFile) {
          requestData.sha = freshFile.sha
          const retryResponse = await this.apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(requestData)
          })
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json()
            return retryResult.content !== undefined
          }
        }
      }
      
      return false
    }
  } catch (error: any) {
    console.error('Create/update file failed:', error)
    return false
  }
}

// Gitee 专用的创建新文件方法
private async createNewFileForGitee(path: string, content: string, message: string): Promise<boolean> {
  try {
    const encodedContent = btoa(unescape(encodeURIComponent(content)))
    
    // 方法1：尝试 POST 请求（某些 Gitee 版本支持）
    const postResult = await this.tryPostCreate(path, content, message, encodedContent)
    if (postResult) return true
    
    // 方法2：尝试创建空文件然后更新
    const emptyCreateResult = await this.tryCreateThenUpdate(path, content, message, encodedContent)
    if (emptyCreateResult) return true
    
    // 方法3：使用 PUT 但提供空 SHA（某些情况下可能工作）
    const putEmptyResult = await this.tryPutWithEmptySha(path, content, message, encodedContent)
    if (putEmptyResult) return true
    
    console.error('All Gitee file creation methods failed')
    return false
    
  } catch (error: any) {
    console.error('Gitee create new file failed:', error)
    return false
  }
}

// 尝试使用 POST 创建文件
private async tryPostCreate(path: string, content: string, message: string, encodedContent: string): Promise<boolean> {
  try {
    const requestData = {
      message,
      content: encodedContent,
      branch: this.config?.branch || 'master'
    }

    const endpoint = `${this.getRepoPath()}/contents/${path}`
    
    console.log('Trying POST create for Gitee:', {
      method: 'POST',
      endpoint
    })

    const response = await this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestData)
    })

    if (response.ok) {
      console.log('POST create successful')
      return true
    }
    
    console.log('POST create failed:', response.status)
    return false
  } catch (error) {
    console.log('POST create error:', error)
    return false
  }
}

// 尝试先创建空文件再更新
private async tryCreateThenUpdate(path: string, content: string, message: string, encodedContent: string): Promise<boolean> {
  try {
    // 先创建一个空文件
    const emptyContent = btoa('')
    const createData = {
      message: `初始化文件: ${path}`,
      content: emptyContent,
      branch: this.config?.branch || 'master'
    }

    const endpoint = `${this.getRepoPath()}/contents/${path}`
    
    console.log('Trying create empty file then update for Gitee')
    
    const createResponse = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(createData)
    })

    if (createResponse.ok) {
      const createResult = await createResponse.json()
      const sha = createResult.content?.sha
      
      if (sha) {
        // 现在更新文件内容
        const updateData = {
          message,
          content: encodedContent,
          sha,
          branch: this.config?.branch || 'master'
        }

        const updateResponse = await this.apiRequest(endpoint, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })

        if (updateResponse.ok) {
          console.log('Create then update successful')
          return true
        }
      }
    }
    
    console.log('Create then update failed')
    return false
  } catch (error) {
    console.log('Create then update error:', error)
    return false
  }
}

// 尝试使用空 SHA 的 PUT 请求
private async tryPutWithEmptySha(path: string, content: string, message: string, encodedContent: string): Promise<boolean> {
  try {
    const requestData = {
      message,
      content: encodedContent,
      branch: this.config?.branch || 'master',
      sha: '' // 提供空 SHA
    }

    const endpoint = `${this.getRepoPath()}/contents/${path}`
    
    console.log('Trying PUT with empty SHA for Gitee')

    const response = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestData)
    })

    if (response.ok) {
      console.log('PUT with empty SHA successful')
      return true
    }
    
    console.log('PUT with empty SHA failed:', response.status)
    return false
  } catch (error) {
    console.log('PUT with empty SHA error:', error)
    return false
  }
}

// 使用 PUT 方法创建文件（不带 SHA）
private async createFileWithPUT(path: string, content: string, message: string): Promise<boolean> {
  try {
    const encodedContent = btoa(unescape(encodeURIComponent(content)))
    
    const requestData = {
      message,
      content: encodedContent,
      branch: this.config?.branch || 'master'
      // 注意：不添加 sha 字段
    }

    const endpoint = `${this.getRepoPath()}/contents/${path}`
    
    console.log('Creating file with PUT (no SHA):', {
      method: 'PUT',
      endpoint,
      data: { ...requestData, content: '[CONTENT_HIDDEN]' }
    })

    const response = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestData)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('File creation with PUT successful')
      return result.content !== undefined
    } else {
      const errorText = await response.text()
      console.error('PUT create failed:', response.status, errorText)
      return false
    }
  } catch (error: any) {
    console.error('PUT create file failed:', error)
    return false
  }
}

  // 删除文件
  async deleteFile(path: string, message: string = '删除文件'): Promise<boolean> {
    try {
      // 先获取文件的SHA
      const fileInfo = await this.getFileContent(path)
      if (!fileInfo) return true // 文件不存在，视为删除成功

      const endpoint = `${this.getRepoPath()}/contents/${path}`
      const response = await this.apiRequest(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha: fileInfo.sha,
          branch: this.config?.branch || 'main'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Delete file failed:', error)
      return false
    }
  }

  // 列出目录下的文件
  async listFiles(path: string = ''): Promise<GitFile[]> {
    try {
      const endpoint = `${this.getRepoPath()}/contents/${path}`
      const response = await this.apiRequest(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        
        // 确保返回的是数组（目录内容）
        if (Array.isArray(data)) {
          return data
            .filter((item: any) => item.type === 'file') // 只返回文件，不包括目录
            .map((item: any) => ({
              name: item.name,
              sha: item.sha,
              size: item.size,
              download_url: item.download_url,
              path: item.path
            }))
        }
      }
      
      return []
    } catch (error) {
      console.error('List files failed:', error)
      return []
    }
  }

  // 同步单个模块到云端
  async syncModuleToCloud(module: DataModule): Promise<boolean> {
    try {
      const data = module.getData()
      const syncData = {
        data,
        lastSyncTime: new Date().toISOString(),
        hash: this.generateDataHash(data)
      }
      
      const jsonString = JSON.stringify(syncData, null, 2)
      const filename = `${this.SYNC_PREFIX}${module.filename}`
      
      console.log(`Syncing ${module.name} to cloud...`)
      const existingFile = await this.getFileContent(filename)
      
      const success = await this.createOrUpdateFile(
        filename,
        jsonString,
        `更新${module.name}数据 - ${new Date().toLocaleString('zh-CN')}`,
        existingFile?.sha
      )
      
      if (success) {
        this.localHashCache.set(module.name, syncData.hash)
      }
      
      return success
    } catch (error) {
      console.error(`Sync ${module.name} to cloud failed:`, error)
      return false
    }
  }

  // 从云端同步单个模块
  async syncModuleFromCloud(module: DataModule): Promise<boolean> {
    try {
      const filename = `${this.SYNC_PREFIX}${module.filename}`
      const fileInfo = await this.getFileContent(filename)
      
      if (!fileInfo) {
        console.log(`No cloud data found for ${module.name}`)
        return false
      }
      
      const syncData = JSON.parse(fileInfo.content)
      
      // 验证数据完整性
      const expectedHash = this.generateDataHash(syncData.data)
      if (syncData.hash !== expectedHash) {
        console.warn(`Data integrity check failed for ${module.name}`)
      }
      
      // 更新本地数据
      module.setData(syncData.data)
      this.localHashCache.set(module.name, syncData.hash)
      
      console.log(`Successfully synced ${module.name} from cloud`)
      return true
    } catch (error) {
      console.error(`Sync ${module.name} from cloud failed:`, error)
      return false
    }
  }

  // 检查所有模块的同步状态
  async checkSyncStatus(): Promise<SyncStatus[]> {
    const statusList: SyncStatus[] = []
    
    for (const module of this.dataModules) {
      try {
        const filename = `${this.SYNC_PREFIX}${module.filename}`
        const localHash = this.getLocalDataHash(module)
        
        // 获取云端数据
        const fileInfo = await this.getFileContent(filename)
        let cloudHash = ''
        let lastSyncTime: string | undefined
        
        if (fileInfo) {
          const syncData = JSON.parse(fileInfo.content)
          cloudHash = syncData.hash || ''
          lastSyncTime = syncData.lastSyncTime
        }
        
        statusList.push({
          filename: module.filename,
          localHash,
          cloudHash,
          needsSync: localHash !== cloudHash,
          lastSyncTime
        })
      } catch (error) {
        console.error(`Check sync status failed for ${module.name}:`, error)
        statusList.push({
          filename: module.filename,
          localHash: '',
          cloudHash: '',
          needsSync: false
        })
      }
    }
    
    return statusList
  }

  // 自动同步所有需要同步的模块
  async autoSync(): Promise<{ success: boolean; results: Record<string, boolean> }> {
    if (!this.config) {
      return { success: false, results: {} }
    }
    
    // 初始化哈希缓存
    if (this.localHashCache.size === 0) {
      this.initializeHashCache()
    }
    
    const results: Record<string, boolean> = {}
    let allSuccess = true
    
    // 检查哪些模块需要同步
    const statusList = await this.checkSyncStatus()
    
    for (const status of statusList) {
      const module = this.dataModules.find(m => m.filename === status.filename)
      if (!module || !status.needsSync) continue
      
      // 比较本地和云端哪个更新
      const hasLocalChanges = this.hasDataChanged(module)
      
      if (hasLocalChanges || !status.cloudHash) {
        // 本地有变化或云端没有数据，上传到云端
        results[module.name] = await this.syncModuleToCloud(module)
      } else {
        // 云端有更新，从云端同步
        results[module.name] = await this.syncModuleFromCloud(module)
      }
      
      if (!results[module.name]) {
        allSuccess = false
      }
    }
    
    return { success: allSuccess, results }
  }

  // 手动同步所有模块到云端
  async syncAllToCloud(): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {}
    let allSuccess = true
    
    for (const module of this.dataModules) {
      results[module.name] = await this.syncModuleToCloud(module)
      if (!results[module.name]) {
        allSuccess = false
      }
    }
    
    return { success: allSuccess, results }
  }

  // 手动从云端同步所有模块
  async syncAllFromCloud(): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {}
    let allSuccess = true
    
    for (const module of this.dataModules) {
      results[module.name] = await this.syncModuleFromCloud(module)
      if (!results[module.name]) {
        allSuccess = false
      }
    }
    
    return { success: allSuccess, results }
  }

  // 获取提供商名称
  getProviderName(): string {
    return this.config?.provider === 'github' ? 'GitHub' : 'Gitee'
  }

  // 获取仓库信息
  async getRepoInfo(): Promise<any> {
    try {
      const response = await this.apiRequest(this.getRepoPath())
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('Get repo info failed:', error)
      return null
    }
  }

  async checkRepositoryExists(): Promise<boolean> {
    if (!this.config) return false
    
    try {
      const url = `repos/${this.config.owner}/${this.config.repo}`
      const response = await this.apiRequest(url)
      return response.ok
    } catch (error) {
      console.error('Repository check failed:', error)
      return false
    }
  }

  // 获取特定数据模块
  getDataModule(name: string): DataModule | undefined {
    return this.dataModules.find(module => module.name === name)
  }

  // 获取所有数据模块名称
  getModuleNames(): string[] {
    return this.dataModules.map(module => module.name)
  }

  // 初始化同步系统
  async initializeSync(): Promise<boolean> {
    if (!this.config) return false
    
    try {
      this.initializeHashCache()
      console.log('Sync system initialized')
      return true
    } catch (error) {
      console.error('Initialize sync failed:', error)
      return false
    }
  }

  // 清理云端同步文件
  async cleanupCloudFiles(): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {}
    let allSuccess = true
    
    for (const module of this.dataModules) {
      const filename = `${this.SYNC_PREFIX}${module.filename}`
      results[module.name] = await this.deleteFile(filename, `清理${module.name}同步文件`)
      if (!results[module.name]) {
        allSuccess = false
      }
    }
    
    return { success: allSuccess, results }
  }

  // 获取同步文件列表
  async getSyncFiles(): Promise<GitFile[]> {
    try {
      const allFiles = await this.listFiles()
      return allFiles.filter(file => file.name.startsWith(this.SYNC_PREFIX))
    } catch (error) {
      console.error('Get sync files failed:', error)
      return []
    }
  }

  // 兼容性方法：生成MD5哈希（保持向后兼容）
  generateMD5(data: string): string {
    return this.generateDataHash(JSON.parse(data))
  }
}

export const gitSyncClient = new GitSyncClient()


