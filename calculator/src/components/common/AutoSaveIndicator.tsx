import React, { useState, useEffect } from 'react';
import { useAutoSave } from '../hooks/useOfflineMode';

interface AutoSaveIndicatorProps {
  data: any;
  interval?: number;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ 
  data, 
  interval = 30000 
}) => {
  const { lastSaved, isSaving, isOnline } = useAutoSave(data, interval);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isSaving || lastSaved) {
      setShowIndicator(true);
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaved]);

  if (!showIndicator) return null;

  return (
    <div className={`auto-save-indicator show ${isSaving ? 'saving' : 'saved'}`}>
      {isSaving ? (
        <>
          <span>💾</span> Сохранение...
        </>
      ) : (
        <>
          <span>✅</span> Сохранено {lastSaved?.toLocaleTimeString()}
        </>
      )}
      {!isOnline && (
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          Офлайн режим
        </div>
      )}
    </div>
  );
};


