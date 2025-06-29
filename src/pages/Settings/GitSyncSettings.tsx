import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  CloudIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { useAppContext } from '../../context/AppContext'
import { gitSyncClient, GitFile } from '../../utils/gitSync'

interface GitSyncSettingsProps {
  onFileView?: (fileName: string, content: string) => void
}

function GitSyncSettings({ onFileView }: GitSyncSettingsProps) {
  const { state, dispatch, syncToCloud, syncFromCloud, testGitConnection } = useAppContext()
  const [formData, setFormData] = useState({
    provider: 'github' as 'github' | 'gitee',
    token: '',
    owner: '',
    repo: '',
    branch: 'main'
  })
  const [showToken, setShowToken] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [cloudFiles, setCloudFiles] = useState<GitFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [showTokenConfig, setShowTokenConfig] = useState(false)
  
  const initializedRef = useRef(false)

  // 初始化表单数据
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (state.gitConfig) {
      setFormData({
        provider: state.gitConfig.provider,
        token: state.gitConfig.token,
        owner: state.gitConfig.owner,
        repo: state.gitConfig.repo,
        branch: state.gitConfig.branch || 'main'
      })
    }

    if (state.gitConnected) {
      loadCloudFiles()
    }
  }, [state.gitConfig, state.gitConnected])

  // 加载云端文件列表
  const loadCloudFiles = useCallback(async () => {
    if (isLoadingFiles) return
    
    setIsLoadingFiles(true)
    try {
      const files = await gitSyncClient.listFiles()
      setCloudFiles(files)
      
      if (files.length === 0) {
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { status: 'idle', message: '仓库中暂无文件' } 
        })
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '加载文件列表失败' } 
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }, [dispatch])

  // 监听连接状态变化
  useEffect(() => {
    if (state.gitConnected && initializedRef.current) {
      loadCloudFiles()
    }
  }, [state.gitConnected, loadCloudFiles])

  const handleSaveConfig = () => {
    if (!formData.provider || !formData.token || !formData.owner || !formData.repo) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '请填写完整的Git同步配置信息' } 
      })
      return
    }

    const config = {
      provider: formData.provider,
      token: formData.token.trim(),
      owner: formData.owner.trim(),
      repo: formData.repo.trim(),
      branch: formData.branch.trim() || 'main'
    }

    try {
      gitSyncClient.saveConfig(config)
      dispatch({ type: 'SET_GIT_CONFIG', payload: config })
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'success', message: '配置已保存' } 
      })
      
      handleTestConnection()
    } catch (error: any) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '保存配置失败' } 
      })
    }
  }

  const handleTestConnection = async () => {
    if (isTestingConnection) return
    
    setIsTestingConnection(true)
    dispatch({ 
      type: 'SET_SYNC_STATUS', 
      payload: { status: 'syncing', message: '测试连接中...' } 
    })
    
    try {
      const result = await testGitConnection()
      if (result.success) {
        await loadCloudFiles()
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '测试连接失败' } 
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleClearConfig = () => {
    if (window.confirm('确定要清除Git同步配置吗？')) {
      gitSyncClient.clearConfig()
      dispatch({ type: 'SET_GIT_CONFIG', payload: null })
      dispatch({ type: 'SET_GIT_CONNECTED', payload: false })
      setFormData({ 
        provider: 'github', 
        token: '', 
        owner: '', 
        repo: '', 
        branch: 'main' 
      })
      setCloudFiles([])
      initializedRef.current = false
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm(`确定要删除文件 ${fileName} 吗？`)) return

    try {
      const success = await gitSyncClient.deleteFile(fileName, `删除文件 ${fileName}`)
      if (success) {
        setCloudFiles(files => files.filter(f => f.name !== fileName))
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'success', message: '文件删除成功' } })
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '文件删除失败' } })
      }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '删除文件时出错' } })
    }
  }

  const handleViewFile = async (fileName: string) => {
    try {
      const fileInfo = await gitSyncClient.getFileContent(fileName)
      if (fileInfo && onFileView) {
        onFileView(fileName, fileInfo.content)
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '文件下载失败' } })
      }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '查看文件时出错' } })
    }
  }

  const handleRefreshFiles = () => {
    if (!isLoadingFiles && state.gitConnected) {
      loadCloudFiles()
    }
  }

  const getSyncStatusIcon = () => {
    switch (state.syncStatus) {
      case 'syncing':
        return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <CloudIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getProviderInfo = () => {
    return formData.provider === 'github' ? {
      name: 'GitHub',
      tokenUrl: 'https://github.com/settings/tokens',
      scopes: 'repo (完整仓库权限)',
      icon: '🐙'
    } : {
      name: 'Gitee',
      tokenUrl: 'https://gitee.com/profile/personal_access_tokens',
      scopes: 'projects (仓库权限)',
      icon: '🦄'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN')
    } catch {
      return dateString
    }
  }

  const providerInfo = getProviderInfo()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Git 云同步配置卡片 */}
      <div className="card">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Git 云同步</h2>
              <p className="text-xs sm:text-sm text-gray-600">连接您的代码仓库</p>
            </div>
          </div>
          
          {/* 连接状态 */}
          <div className="flex items-center space-x-2">
            {state.gitConnected ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">已连接</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-500">
                <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">未连接</span>
              </div>
            )}
            {isTestingConnection && (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-600" />
            )}
          </div>
        </div>

        {/* 连接状态详情 */}
        {state.gitConnected && (
          <div className="mb-4 text-xs text-gray-500 bg-green-50 p-2 rounded border border-green-200">
            云同步服务正常运行
          </div>
        )}

        <div className="space-y-4">
          {/* 快速配置 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务商</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as 'github' | 'gitee' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="github">🐙 GitHub</option>
                <option value="gitee">🦄 Gitee</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">仓库地址</label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="用户名"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <span className="hidden sm:block text-gray-400 py-2">/</span>
                <span className="sm:hidden text-center text-gray-400 text-sm">/</span>
                <input
                  type="text"
                  value={formData.repo}
                  onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
                  placeholder="仓库名"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Token配置折叠区域 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowTokenConfig(!showTokenConfig)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-sm sm:text-base font-medium text-gray-900">访问令牌配置</span>
              </div>
              {showTokenConfig ? (
                <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </button>
            
            {showTokenConfig && (
              <div className="px-3 pb-3 border-t border-gray-200">
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-blue-700 mb-2">
                    需要在 <a href={providerInfo.tokenUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{providerInfo.name}</a> 创建Token
                  </p>
                  <p className="text-xs text-blue-600">权限要求: {providerInfo.scopes}</p>
                </div>
                
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={formData.token}
                    onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                    placeholder={`输入${providerInfo.name} Personal Access Token`}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleSaveConfig}
              className="btn-primary px-4 py-2.5 sm:py-2 text-sm font-medium"
            >
              保存配置
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !formData.token || !formData.owner || !formData.repo}
              className="px-4 py-2.5 sm:py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isTestingConnection ? '测试中...' : '测试连接'}
            </button>
            {state.gitConfig && (
              <button
                onClick={handleClearConfig}
                className="px-4 py-2.5 sm:py-2 text-sm text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-all duration-200"
              >
                清除配置
              </button>
            )}
          </div>

          {/* 状态消息 */}
          {state.syncMessage && (
            <div className={`flex items-center space-x-2 p-3 sm:p-2 rounded-lg text-sm ${
              state.syncStatus === 'success' ? 'bg-green-50 text-green-700' :
              state.syncStatus === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {getSyncStatusIcon()}
              <span className="break-words">{state.syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 数据同步管理 */}
      {state.gitConnected && (
        <div className="card">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CloudIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">数据同步</h2>
                <p className="text-xs text-gray-600">管理云端数据同步</p>
              </div>
            </div>
            
            {/* 自动同步开关 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">自动同步</span>
              <button
                onClick={() => dispatch({ type: 'SET_AUTO_SYNC', payload: !state.autoSync })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                  state.autoSync ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                    state.autoSync ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={syncToCloud}
              disabled={state.syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {getSyncStatusIcon()}
              <span>同步到云端</span>
            </button>
            <button
              onClick={syncFromCloud}
              disabled={state.syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>从云端同步</span>
            </button>
          </div>

          {state.lastSyncTime && (
            <div className="mt-3 text-center text-xs text-gray-500">
              上次同步: {formatDate(state.lastSyncTime)}
            </div>
          )}
        </div>
      )}

      {/* 仓库文件管理 */}
      {state.gitConnected && (
        <div className="card">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">仓库文件</h2>
                <p className="text-xs text-gray-600">查看和管理云端文件</p>
              </div>
            </div>
            <button
              onClick={handleRefreshFiles}
              disabled={isLoadingFiles}
              className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="text-center py-6">
              <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : cloudFiles.length === 0 ? (
            <div className="text-center py-6">
              <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">仓库中暂无文件</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cloudFiles.map((file) => (
                <div key={file.sha} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <DocumentTextIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewFile(file.path)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="查看"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.path)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="删除"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GitSyncSettings
