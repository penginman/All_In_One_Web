import CryptoJS from 'crypto-js'

export interface WebDAVConfig {
  server: string
  username: string
  password: string
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

export interface WebDAVFile {
  name: string
  lastModified: string
  size: number
  md5Hash?: string
}

class WebDAVClientWrapper {
  private config: WebDAVConfig | null = null
  private readonly STORAGE_KEY = 'webdav-config-encrypted'
  private readonly SECRET_KEY = 'all-in-one-webdav-secret'
  private readonly SYNC_FILE_NAME = 'all-in-one-sync.json'

  // 加密配置
  encryptConfig(config: WebDAVConfig): string {
    return CryptoJS.AES.encrypt(JSON.stringify(config), this.SECRET_KEY).toString()
  }

  // 解密配置
  decryptConfig(encryptedConfig: string): WebDAVConfig | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedConfig, this.SECRET_KEY)
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('Failed to decrypt WebDAV config:', error)
      return null
    }
  }

  // 原生fetch WebDAV请求
  private async webdavRequest(path: string = '', options: RequestInit = {}): Promise<Response> {
    if (!this.config) throw new Error('WebDAV not configured')
    
    const url = `${this.config.server.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    const auth = btoa(`${this.config.username}:${this.config.password}`)
    
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        ...options.headers
      }
    })
  }

  // 保存配置到本地存储
  saveConfig(config: WebDAVConfig): void {
    const encrypted = this.encryptConfig(config)
    localStorage.setItem(this.STORAGE_KEY, encrypted)
    this.config = config
  }

  // 从本地存储加载配置
  loadConfig(): WebDAVConfig | null {
    const encrypted = localStorage.getItem(this.STORAGE_KEY)
    if (!encrypted) return null

    const config = this.decryptConfig(encrypted)
    if (config) {
      this.config = config
    }
    return config
  }

  // 清除配置
  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    this.config = null
  }

  // 生成MD5哈希
  generateMD5(data: string): string {
    return CryptoJS.MD5(data).toString()
  }

  // 测试连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: '请先配置WebDAV服务器信息' }
    }

    try {
      const response = await this.webdavRequest('', {
        method: 'PROPFIND',
        headers: {
          'Depth': '1',
          'Content-Type': 'application/xml'
        },
        body: `<?xml version="1.0"?>
          <propfind xmlns="DAV:">
            <prop>
              <displayname/>
              <resourcetype/>
            </prop>
          </propfind>`
      })

      if (response.ok || response.status === 207) {
        return { success: true, message: '连接成功' }
      } else if (response.status === 401) {
        return { success: false, message: '认证失败，请检查用户名和密码' }
      } else if (response.status === 404) {
        return { success: false, message: '服务器路径不存在，请检查服务器地址' }
      } else {
        return { success: false, message: `连接失败: ${response.status} ${response.statusText}` }
      }
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          message: 'CORS跨域限制，请安装浏览器CORS扩展或使用支持跨域的服务器' 
        }
      }
      return { success: false, message: `连接错误: ${error.message}` }
    }
  }

  // 上传文件
  async uploadFile(fileName: string, content: string): Promise<boolean> {
    try {
      const response = await this.webdavRequest(fileName, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: content
      })
      return response.ok || response.status === 201 || response.status === 204
    } catch (error) {
      console.error('Upload failed:', error)
      return false
    }
  }

  // 下载文件
  async downloadFile(fileName: string): Promise<string | null> {
    try {
      const response = await this.webdavRequest(fileName, {
        method: 'GET'
      })
      
      if (response.ok) {
        return await response.text()
      }
      return null
    } catch (error) {
      console.error('Download failed:', error)
      return null
    }
  }

  // 获取文件信息
  async getFileInfo(fileName: string): Promise<WebDAVFile | null> {
    try {
      const response = await this.webdavRequest(fileName, {
        method: 'HEAD'
      })

      if (response.ok) {
        return {
          name: fileName,
          lastModified: response.headers.get('Last-Modified') || '',
          size: parseInt(response.headers.get('Content-Length') || '0')
        }
      }
      return null
    } catch (error) {
      console.error('Get file info failed:', error)
      return null
    }
  }

  // 删除文件
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const response = await this.webdavRequest(fileName, {
        method: 'DELETE'
      })
      return response.ok || response.status === 404 || response.status === 204
    } catch (error) {
      console.error('Delete failed:', error)
      return false
    }
  }

  // 列出文件
  async listFiles(): Promise<WebDAVFile[]> {
    try {
      const response = await this.webdavRequest('', {
        method: 'PROPFIND',
        headers: {
          'Depth': '1',
          'Content-Type': 'application/xml'
        },
        body: `<?xml version="1.0"?>
          <propfind xmlns="DAV:">
            <prop>
              <displayname/>
              <getcontentlength/>
              <getlastmodified/>
              <resourcetype/>
            </prop>
          </propfind>`
      })

      console.log('PROPFIND response status:', response.status)

      if (!response.ok && response.status !== 207) {
        console.error('PROPFIND failed with status:', response.status)
        return []
      }

      const xmlText = await response.text()
      console.log('PROPFIND response XML:', xmlText)
      
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      // 检查XML解析错误
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) {
        console.error('XML parse error:', parseError.textContent)
        return []
      }

      const responses = xmlDoc.getElementsByTagName('response')
      console.log('Found responses:', responses.length)

      const files: WebDAVFile[] = []
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i]
        const href = response.getElementsByTagName('href')[0]?.textContent || ''
        const resourcetype = response.getElementsByTagName('resourcetype')[0]
        
        console.log('Processing href:', href)
        
        // 跳过目录
        if (resourcetype && resourcetype.getElementsByTagName('collection').length > 0) {
          console.log('Skipping directory:', href)
          continue
        }

        // 获取文件名
        const fileName = decodeURIComponent(href.split('/').pop() || '')
        console.log('File name:', fileName)
        
        // 只显示包含 'all-in-one' 的文件，或者所有 .json 文件
        if (fileName && (fileName.includes('all-in-one') || fileName.endsWith('.json'))) {
          const lastModified = response.getElementsByTagName('getlastmodified')[0]?.textContent || ''
          const contentLength = response.getElementsByTagName('getcontentlength')[0]?.textContent
          const size = contentLength ? parseInt(contentLength) : 0
          
          console.log('Adding file:', { fileName, lastModified, size })
          
          files.push({
            name: fileName,
            lastModified,
            size
          })
        }
      }

      console.log('Final file list:', files)
      return files
    } catch (error) {
      console.error('List files failed:', error)
      return []
    }
  }

  // 同步数据到云端
  async syncToCloud(data: Omit<SyncData, 'lastSyncTime' | 'md5Hash'>): Promise<boolean> {
    const syncData: SyncData = {
      ...data,
      lastSyncTime: new Date().toISOString(),
      md5Hash: ''
    }

    const jsonString = JSON.stringify(syncData, null, 2)
    syncData.md5Hash = this.generateMD5(jsonString)
    
    const finalJsonString = JSON.stringify(syncData, null, 2)
    
    return await this.uploadFile(this.SYNC_FILE_NAME, finalJsonString)
  }

  // 从云端同步数据
  async syncFromCloud(): Promise<SyncData | null> {
    const content = await this.downloadFile(this.SYNC_FILE_NAME)
    if (!content) return null

    try {
      const data: SyncData = JSON.parse(content)
      
      // 验证MD5
      const dataWithoutHash = { ...data }
      delete dataWithoutHash.md5Hash
      const expectedHash = this.generateMD5(JSON.stringify(dataWithoutHash, null, 2))
      
      if (data.md5Hash !== expectedHash) {
        console.warn('Data integrity check failed')
      }

      return data
    } catch (error) {
      console.error('Parse sync data failed:', error)
      return null
    }
  }

  // 检查是否需要同步
  async needsSync(): Promise<{ needsSync: boolean; cloudData?: SyncData; localHash?: string }> {
    if (!this.config) return { needsSync: false }

    try {
      const cloudData = await this.syncFromCloud()
      if (!cloudData) return { needsSync: false }

      // 获取本地数据哈希
      const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const localTaskGroups = JSON.parse(localStorage.getItem('taskGroups') || '[]')
      const localBookmarks = JSON.parse(localStorage.getItem('bookmarks-data') || '{"bookmarks":[],"groups":[]}')
      const localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]')

      const localData = {
        tasks: localTasks,
        taskGroups: localTaskGroups,
        habits: [],
        bookmarks: localBookmarks.bookmarks || [],
        bookmarkGroups: localBookmarks.groups || [],
        calendarEvents: localEvents,
        lastSyncTime: new Date().toISOString()
      }

      const localHash = this.generateMD5(JSON.stringify(localData, null, 2))
      
      return {
        needsSync: cloudData.md5Hash !== localHash,
        cloudData,
        localHash
      }
    } catch (error) {
      console.error('Check sync failed:', error)
      return { needsSync: false }
    }
  }
}

export const webdavClient = new WebDAVClientWrapper()
