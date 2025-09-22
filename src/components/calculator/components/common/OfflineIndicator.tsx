import React from 'react';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isOfflineMode, pendingChanges, lastSyncTime } = useOfflineMode();

  if (isOnline && !isOfflineMode) {
    return null; // Don't show anything when online
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-indicator-content">
        {isOnline ? (
          <>
            <div className="offline-indicator-icon">🔄</div>
            <div className="offline-indicator-text">
              <strong>Синхронизация...</strong>
              {pendingChanges > 0 && (
                <span>Обрабатывается {pendingChanges} изменений</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="offline-indicator-icon">📡</div>
            <div className="offline-indicator-text">
              <strong>Офлайн режим</strong>
              <span>Данные сохраняются локально</span>
            </div>
          </>
        )}
      </div>
      {lastSyncTime && (
        <div className="offline-indicator-time">
          Последняя синхронизация: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};


