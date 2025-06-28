import React, { useState, useEffect } from 'react'
import { gitSyncClient } from '../../utils/gitSync'
import type { SyncStatus } from '../../utils/gitSync'

interface SyncStatusDisplayProps {
  onSyncComplete?: () => void
}

export function SyncStatusDisplay({ onSyncComplete }: SyncStatusDisplayProps) {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // 检查同步状态
  const checkSyncStatus = async () => {
    setIsLoading(true)
    try {
      const statuses = await gitSyncClient.checkSyncStatus()
      setSyncStatuses(statuses)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Check sync status failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 执行自动同步
  const handleAutoSync = async () => {
    setIsLoading(true)
    try {
      await gitSyncClient.initializeSync()
      const result = await gitSyncClient.autoSync()
      
      if (result.success) {
        console.log('Auto sync completed successfully')
        onSyncComplete?.()
      } else {
        console.log('Auto sync completed with errors:', result.results)
      }
      
      // 重新检查状态
      await checkSyncStatus()
    } catch (error) {
      console.error('Auto sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 同步特定模块
  const handleModuleSync = async (moduleName: string, direction: 'to-cloud' | 'from-cloud') => {
    setIsLoading(true)
    try {
      const module = gitSyncClient.getDataModule(moduleName)
      if (!module) {
        console.error(`Module not found: ${moduleName}`)
        return
      }

      let success = false
      if (direction === 'to-cloud') {
        success = await gitSyncClient.syncModuleToCloud(module)
      } else {
        success = await gitSyncClient.syncModuleFromCloud(module)
      }

      if (success && direction === 'from-cloud') {
        onSyncComplete?.()
      }

      // 重新检查状态
      await checkSyncStatus()
    } catch (error) {
      console.error(`Sync module ${moduleName} failed:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    checkSyncStatus()
  }, [])

  const getStatusIcon = (status: SyncStatus) => {
    if (status.needsSync) {
      return '⚠️'
    }
    return '✅'
  }

  const getStatusText = (status: SyncStatus) => {
    if (!status.cloudHash && !status.localHash) {
      return '无数据'
    }
    if (!status.cloudHash) {
      return '仅本地'
    }
    if (!status.localHash) {
      return '仅云端'
    }
    if (status.needsSync) {
      return '需要同步'
    }
    return '已同步'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          同步状态
        </h3>
        <div className="flex gap-2">
          <button
            onClick={checkSyncStatus}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            刷新
          </button>
          <button
            onClick={handleAutoSync}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            自动同步
          </button>
        </div>
      </div>

      {lastCheck && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          最后检查: {lastCheck.toLocaleString('zh-CN')}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">检查中...</span>
        </div>
      )}

      <div className="space-y-3">
        {syncStatuses.map((status) => {
          const moduleName = status.filename.replace('.json', '')
          
          return (
            <div
              key={status.filename}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStatusIcon(status)}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {moduleName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {getStatusText(status)}
                  </div>
                  {status.lastSyncTime && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      上次同步: {new Date(status.lastSyncTime).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              </div>

              {status.needsSync && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleModuleSync(moduleName, 'to-cloud')}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    title="上传到云端"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleModuleSync(moduleName, 'from-cloud')}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                    title="从云端下载"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {syncStatuses.length === 0 && !isLoading && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          没有找到同步状态数据
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex gap-4">
          <span>✅ 已同步</span>
          <span>⚠️ 需要同步</span>
          <span>↑ 上传</span>
          <span>↓ 下载</span>
        </div>
      </div>
    </div>
  )
}

export default SyncStatusDisplay
