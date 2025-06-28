import React, { useState, useEffect } from 'react'
import { 
  CloudIcon, 
  Cog6ToothIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentTextIcon,
  ServerIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import { useAppContext } from '../../context/AppContext'
import { gitSyncClient, GitFile } from '../../utils/gitSync'

function Settings() {
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
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [showTokenHelp, setShowTokenHelp] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (state.gitConfig) {
      setFormData({
        provider: state.gitConfig.provider,
        token: state.gitConfig.token,
        owner: state.gitConfig.owner,
        repo: state.gitConfig.repo,
        branch: state.gitConfig.branch || 'main'
      })
    }
  }, [state.gitConfig])

  // 加载云端文件列表
  const loadCloudFiles = async () => {
    if (!state.gitConnected) {
      console.log('Git sync not connected, skipping file load')
      return
    }

    setIsLoadingFiles(true)
    try {
      console.log('Loading cloud files...')
      const files = await gitSyncClient.listFiles()
      console.log('Loaded files:', files)
      setCloudFiles(files)
      
      if (files.length === 0) {
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { status: 'idle', message: '仓库中暂无文件' } 
        })
      }
    } catch (error) {
      console.error('Load files failed:', error)
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { status: 'error', message: '加载文件列表失败' } 
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // 页面加载时获取文件列表
  useEffect(() => {
    if (state.gitConnected) {
      loadCloudFiles()
    }
  }, [state.gitConnected])

  const handleSaveConfig = () => {
    if (!formData.provider || !formData.token || !formData.owner || !formData.repo) {
      alert('请填写完整的Git同步配置信息')
      return
    }

    const config = {
      provider: formData.provider,
      token: formData.token.trim(),
      owner: formData.owner.trim(),
      repo: formData.repo.trim(),
      branch: formData.branch.trim() || 'main'
    }

    console.log('Saving Git config:', { ...config, token: '***' }) // 调试日志（隐藏token）

    gitSyncClient.saveConfig(config)
    dispatch({ type: 'SET_GIT_CONFIG', payload: config })
    
    // 自动测试连接
    handleTestConnection()
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    const result = await testGitConnection()
    setIsTestingConnection(false)
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
      if (fileInfo) {
        setSelectedFile(fileName)
        setFileContent(fileInfo.content)
        setShowFileViewer(true)
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '文件下载失败' } })
      }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'error', message: '查看文件时出错' } })
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

  const getSyncStatusIcon = () => {
    switch (state.syncStatus) {
      case 'syncing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <CloudIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getProviderInfo = () => {
    return formData.provider === 'github' ? {
      name: 'GitHub',
      tokenUrl: 'https://github.com/settings/tokens',
      scopes: 'repo (完整仓库权限)',
      color: 'text-gray-900',
      bgColor: 'bg-gray-100'
    } : {
      name: 'Gitee',
      tokenUrl: 'https://gitee.com/profile/personal_access_tokens',
      scopes: 'projects (仓库权限)',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  }

  const providerInfo = getProviderInfo()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">设置</h1>

      {/* Git 同步配置卡片 */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <CodeBracketIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Git 云同步配置</h2>
        </div>

        {/* Token帮助信息 */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">关于访问令牌</h4>
              <p className="text-sm text-blue-700 mt-1">
                需要创建一个具有仓库权限的Personal Access Token来访问您的仓库。
              </p>
              <button
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
              >
                {showTokenHelp ? '收起' : '查看如何获取Token'}
              </button>
            </div>
          </div>
          
          {showTokenHelp && (
            <div className="mt-3 pl-7 text-sm text-blue-700 space-y-2">
              <div>
                <strong>获取{providerInfo.name} Token步骤：</strong>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>访问 <a href={providerInfo.tokenUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">{providerInfo.tokenUrl}</a></li>
                  <li>创建新的Personal Access Token</li>
                  <li>选择权限：{providerInfo.scopes}</li>
                  <li>复制生成的Token并粘贴到下方</li>
                </ol>
              </div>
              <p className="text-sm text-orange-600">⚠️ Token只会显示一次，请妥善保存！</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* 服务商选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择Git服务商
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="github"
                  checked={formData.provider === 'github'}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as 'github' | 'gitee' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">GitHub</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="gitee"
                  checked={formData.provider === 'gitee'}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as 'github' | 'gitee' }))}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-gray-900">Gitee</span>
              </label>
            </div>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={formData.token}
                onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                placeholder={`输入${providerInfo.name} Personal Access Token`}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Token需要repo权限来读写仓库文件
            </p>
          </div>

          {/* 仓库信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名/组织名
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="octocat"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                仓库名
              </label>
              <input
                type="text"
                value={formData.repo}
                onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
                placeholder="my-data-sync"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分支名
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="main"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveConfig}
              className="btn-primary"
            >
              保存配置
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !formData.token || !formData.owner || !formData.repo}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingConnection ? '测试中...' : '测试连接'}
            </button>
            {state.gitConfig && (
              <button
                onClick={handleClearConfig}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                清除配置
              </button>
            )}
          </div>

          {/* 连接状态 */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {state.gitConnected ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              state.gitConnected ? 'text-green-700' : 'text-red-700'
            }`}>
              {state.gitConnected ? '已连接' : '未连接'}
            </span>
            {state.syncMessage && (
              <span className="text-sm text-gray-600">- {state.syncMessage}</span>
            )}
          </div>
        </div>
      </div>

      {/* 同步控制卡片 */}
      {state.gitConnected && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <CloudIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">数据同步</h2>
          </div>

          <div className="space-y-4">
            {/* 自动同步开关 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">自动同步</h3>
                <p className="text-sm text-gray-600">定期检查云端数据更新</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_AUTO_SYNC', payload: !state.autoSync })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  state.autoSync ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.autoSync ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 同步按钮和状态 */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={syncToCloud}
                  disabled={state.syncStatus === 'syncing'}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {getSyncStatusIcon()}
                  <span>同步到云端</span>
                </button>
                <button
                  onClick={syncFromCloud}
                  disabled={state.syncStatus === 'syncing'}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>从云端同步</span>
                </button>
              </div>

              {state.lastSyncTime && (
                <div className="text-sm text-gray-600">
                  上次同步: {formatDate(state.lastSyncTime)}
                </div>
              )}
            </div>

            {/* 同步状态消息 */}
            {state.syncMessage && (
              <div className={`p-3 rounded-lg ${
                state.syncStatus === 'success' ? 'bg-green-50 text-green-700' :
                state.syncStatus === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {state.syncMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 云端文件管理 */}
      {state.gitConnected && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">仓库文件管理</h2>
            </div>
            <button
              onClick={loadCloudFiles}
              disabled={isLoadingFiles}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="text-center py-8 text-gray-500">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : cloudFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>仓库中暂无文件</p>
              <p className="text-sm mt-1">执行一次同步后将会看到文件</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">文件名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">大小</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">路径</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {cloudFiles.map((file) => (
                    <tr key={file.sha} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatFileSize(file.size)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{file.path}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewFile(file.path)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="查看"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.path)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 其他设置 */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Cog6ToothIcon className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">其他设置</h2>
        </div>

        <div className="space-y-4">
          {/* 搜索引擎选择 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">默认搜索引擎</h3>
              <p className="text-sm text-gray-600">选择首页搜索使用的引擎</p>
            </div>
            <select
              value={state.searchEngine}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_ENGINE', payload: e.target.value as 'bing' | 'google' })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
            </select>
          </div>

          {/* 主题设置 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">界面主题</h3>
              <p className="text-sm text-gray-600">选择应用的外观主题</p>
            </div>
            <select
              value={state.theme}
              onChange={(e) => dispatch({ type: 'SET_THEME', payload: e.target.value as 'light' | 'dark' })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
        </div>
      </div>

      {/* 文件查看器模态框 */}
      {showFileViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                查看文件: {selectedFile}
              </h3>
              <button
                onClick={() => setShowFileViewer(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {fileContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
