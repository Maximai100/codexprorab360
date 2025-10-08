import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { SpinnerIcon } from './icons/Icons';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();

  if (isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations === 0) {
    return null; // Don't show anything when everything is fine
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-2 pointer-events-auto">
          {!isOnline && (
            <div className="rounded-lg bg-yellow-900/90 backdrop-blur-sm p-3 shadow-lg border border-yellow-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-yellow-200">
                    Нет подключения к интернету
                  </p>
                  <p className="text-xs text-yellow-300 mt-0.5">
                    Изменения будут синхронизированы при восстановлении связи
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncStatus.isSyncing && (
            <div className="rounded-lg bg-blue-900/90 backdrop-blur-sm p-3 shadow-lg border border-blue-700 mt-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SpinnerIcon className="h-5 w-5 text-blue-400 animate-spin" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-blue-200">
                    Синхронизация данных...
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations > 0 && (
            <div className="rounded-lg bg-orange-900/90 backdrop-blur-sm p-3 shadow-lg border border-orange-700 mt-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-orange-200">
                    {syncStatus.pendingOperations} {syncStatus.pendingOperations === 1 ? 'изменение' : 'изменений'} ожидает синхронизации
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
