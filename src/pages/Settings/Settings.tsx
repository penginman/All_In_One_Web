import { useState } from 'react'
import { 
  Cog6ToothIcon, 
  XCircleIcon,
  GlobeAltIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline'
import { useAppContext } from '../../context/AppContext'
import GitSyncSettings from './GitSyncSettings'


function Settings() {
  const { state, dispatch } = useAppContext()
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')

  const handleFileView = (fileName: string, content: string) => {
    setSelectedFile(fileName)
    setFileContent(content)
    setShowFileViewer(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">系统设置</h1>
        <div className="text-sm text-gray-500">
          配置您的个人偏好和云同步选项
        </div>
      </div>

      {/* Git同步设置 */}
      <GitSyncSettings onFileView={handleFileView} />


      {/* 应用设置 */}
      <div className="card">
        <div className="mb-4 flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">应用设置</h2>
            <p className="text-sm text-gray-600">个性化您的使用体验</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">搜索引擎</span>
            </div>
            <select
              value={state.searchEngine}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_ENGINE', payload: e.target.value as 'bing' | 'google' })}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <PaintBrushIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">界面主题</span>
            </div>
            <select
              value={state.theme}
              onChange={(e) => dispatch({ type: 'SET_THEME', payload: e.target.value as 'light' | 'dark' })}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                查看文件: {selectedFile}
              </h3>
              <button
                onClick={() => setShowFileViewer(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <XCircleIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
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