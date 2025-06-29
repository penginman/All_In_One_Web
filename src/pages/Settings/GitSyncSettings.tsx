import React, { useState, useEffect, useCallback } from 'react'
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
  const [hasAutoTested, setHasAutoTested] = useState(false)
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false) // 新增状态跟踪

  // 加载云端文件列表 - 移除有问题的依赖项
  const loadCloudFiles = useCallback(async () => {
    if (isLoadingFiles || !state.gitConnected || hasLoadedFiles) return
    
    console.log('GitSyncSettings: Loading cloud files...')
    setIsLoadingFiles(true)
    try {
      const files = await gitSyncClient.listFiles()
      setCloudFiles(files)
      setHasLoadedFiles(true) // 标记已加载
      
      if (files.length === 0) {
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { status: 'idle', message: '仓库中暂无文件' } 
        })
      }
    } catch (error) {
      console.error('GitSyncSettings: Load files failed:', error)
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '加载文件列表失败' } 
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }, [state.gitConnected, isLoadingFiles, hasLoadedFiles, dispatch])

  // 初始化表单数据 - 只在首次加载时执行
  useEffect(() => {
    console.log('GitSyncSettings: Initializing form data with gitConfig:', state.gitConfig)
    
    if (state.gitConfig) {
      setFormData({
        provider: state.gitConfig.provider,
        token: state.gitConfig.token,
        owner: state.gitConfig.owner,
        repo: state.gitConfig.repo,
        branch: state.gitConfig.branch || 'main'
      })
    }
  }, []) // 空依赖，只在组件挂载时执行

  // 监听gitConfig变化并更新表单 - 只在没有token时更新
  useEffect(() => {
    if (state.gitConfig && !formData.token) {
      console.log('GitSyncSettings: Updating form data from gitConfig')
      
      setFormData({
        provider: state.gitConfig.provider,
        token: state.gitConfig.token,
        owner: state.gitConfig.owner,
        repo: state.gitConfig.repo,
        branch: state.gitConfig.branch || 'main'
      })
    }
  }, [state.gitConfig, formData.token])

  // 自动测试连接 - 完全重构
  useEffect(() => {
    // 只监听gitConfig的存在性，避免复杂的依赖
    if (state.gitConfig && !hasAutoTested) {
      console.log('GitSyncSettings: Config detected, setting up auto test...')
      setHasAutoTested(true)
      
      // 使用更短的延迟，避免被清理
      const timer = setTimeout(async () => {
        console.log('GitSyncSettings: Executing auto test...')
        
        // 检查是否已经连接，避免重复测试
        if (state.gitConnected) {
          console.log('GitSyncSettings: Already connected, skipping auto test')
          return
        }
        
        setIsTestingConnection(true)
        
        try {
          const result = await gitSyncClient.testConnection()
          console.log('GitSyncSettings: Auto test completed:', result)
          
          dispatch({ type: 'SET_GIT_CONNECTED', payload: result.success })
          dispatch({ 
            type: 'SET_SYNC_STATUS', 
            payload: { 
              status: result.success ? 'success' : 'error',
              message: result.message
            }
          })
          
          if (result.success) {
            setHasLoadedFiles(false)
          }
        } catch (error: any) {
          console.error('GitSyncSettings: Auto test error:', error)
          dispatch({ 
            type: 'SET_SYNC_STATUS', 
            payload: { status: 'error', message: '自动测试连接失败' } 
          })
        } finally {
          setIsTestingConnection(false)
        }
      }, 500) // 缩短延迟时间

      // 返回清理函数
      return () => {
        console.log('GitSyncSettings: Clearing auto test timer')
        clearTimeout(timer)
      }
    }
  }, [state.gitConfig]) // 只依赖gitConfig

  // 连接成功后加载文件列表 - 只执行一次
  useEffect(() => {
    if (state.gitConnected && !hasLoadedFiles && !isLoadingFiles) {
      loadCloudFiles()
    }
  }, [state.gitConnected, hasLoadedFiles, isLoadingFiles, loadCloudFiles])

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
    
    console.log('GitSyncSettings: Manual test connection...')
    setIsTestingConnection(true)
    dispatch({ 
      type: 'SET_SYNC_STATUS', 
      payload: { status: 'syncing', message: '测试连接中...' } 
    })
    
    try {
      const result = await testGitConnection()
      console.log('GitSyncSettings: Manual test result:', result)
      
      if (result.success) {
        setHasLoadedFiles(false) // 重置状态以允许重新加载文件
      }
    } catch (error) {
      console.error('GitSyncSettings: Manual test failed:', error)
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
      gitSyncClient.clearCache() // 清理缓存
      dispatch({ type: 'SET_GIT_CONFIG', payload: null })
      dispatch({ type: 'SET_GIT_CONNECTED', payload: false })
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'idle', message: '' } })
      setFormData({ 
        provider: 'github', 
        token: '', 
        owner: '', 
        repo: '', 
        branch: 'main' 
      })
      setCloudFiles([])
      setHasAutoTested(false) // 重置自动测试状态
      setHasLoadedFiles(false) // 重置文件加载状态
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
      setHasLoadedFiles(false) // 重置加载状态以允许重新加载
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
        <div className="mb-4 flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Git 云同步</h2>
              <p className="text-xs sm:text-sm text-gray-600">连接您的代码仓库</p>
            </div>
          </div>
          
          {/* 连接状态 - 移到下方 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">连接状态</span>
            <div className="flex items-center space-x-2">
              {state.gitConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">已连接</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-500">
                  <XCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">未连接</span>
                </div>
              )}
              {isTestingConnection && (
                <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
          </div>
        </div>

        {/* 连接状态详情 */}
        {state.gitConnected && (
          <div className="mb-4 text-xs text-gray-500 bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span>云同步服务正常运行</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* 快速配置 - 改为单列布局在小屏幕上 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">服务商</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">仓库地址</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="用户名/组织名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-400 text-sm">/</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <input
                  type="text"
                  value={formData.repo}
                  onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
                  placeholder="仓库名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
              <div className="px-3 pb-3 border-t border-gray-200 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    需要在 <a href={providerInfo.tokenUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all">{providerInfo.name}</a> 创建Token
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

          {/* 操作按钮 - 改为垂直布局 */}
          <div className="space-y-2">
            <button
              onClick={handleSaveConfig}
              className="w-full btn-primary px-4 py-3 text-sm font-medium"
            >
              保存配置
            </button>
            <div className="flex space-x-2">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !formData.token || !formData.owner || !formData.repo}
                className="flex-1 px-4 py-3 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isTestingConnection ? '测试中...' : '测试连接'}
              </button>
              {state.gitConfig && (
                <button
                  onClick={handleClearConfig}
                  className="flex-1 px-4 py-3 text-sm text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-all duration-200"
                >
                  清除配置
                </button>
              )}
            </div>
          </div>

          {/* 状态消息 */}
          {state.syncMessage && (
            <div className={`flex items-start space-x-2 p-3 rounded-lg text-sm ${
              state.syncStatus === 'success' ? 'bg-green-50 text-green-700' :
              state.syncStatus === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {getSyncStatusIcon()}
              </div>
              <span className="break-words">{state.syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 数据同步管理 */}
      {state.gitConnected && (
        <div className="card">
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CloudIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">数据同步</h2>
                <p className="text-xs text-gray-600">管理云端数据同步</p>
              </div>
            </div>
            
            {/* 自动同步开关 - 改为独立行 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">自动同步</span>
              <button
                onClick={() => dispatch({ type: 'SET_AUTO_SYNC', payload: !state.autoSync })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  state.autoSync ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    state.autoSync ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={syncToCloud}
              disabled={state.syncStatus === 'syncing'}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {getSyncStatusIcon()}
              <span>同步到云端</span>
            </button>
            <button
              onClick={syncFromCloud}
              disabled={state.syncStatus === 'syncing'}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
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
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">仓库文件</h2>
                <p className="text-xs text-gray-600">查看和管理云端文件</p>
              </div>
            </div>
            <button
              onClick={handleRefreshFiles}
              disabled={isLoadingFiles}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>刷新文件列表</span>
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : cloudFiles.length === 0 ? (
            <div className="text-center py-8">
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
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="查看"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.path)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
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

