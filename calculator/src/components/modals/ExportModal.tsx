import React, { useState } from 'react';
import { RoomData, MaterialResult } from '../../types';
import { exportToPDF, exportToExcel, exportToJSON, exportToTelegram } from '../../utils/exportUtils';
import { IconPdf, IconShare } from './Icon';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomData[];
  materialResults: Record<string, MaterialResult | null>;
  estimateName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  rooms,
  materialResults,
  estimateName
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (type: string, exportFunction: () => void) => {
    setIsExporting(type);
    try {
      await exportFunction();
    } catch (error) {
      console.error(`Export failed for ${type}:`, error);
      alert(`Ошибка при экспорте в ${type}. Попробуйте еще раз.`);
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      title: 'PDF отчет',
      description: 'Детальный отчет с таблицами и расчетами',
      icon: <IconPdf />,
      action: () => exportToPDF(rooms, materialResults, estimateName),
      color: '#e74c3c'
    },
    {
      id: 'excel',
      title: 'Excel таблица',
      description: 'Таблица для работы с данными и закупок',
      icon: <span>📊</span>,
      action: () => exportToExcel(rooms, materialResults, estimateName),
      color: '#27ae60'
    },
    {
      id: 'json',
      title: 'JSON данные',
      description: 'Структурированные данные для других приложений',
      icon: <span>📄</span>,
      action: () => exportToJSON(rooms, materialResults, estimateName),
      color: '#3498db'
    },
    {
      id: 'telegram',
      title: 'Telegram',
      description: 'Отправить в Telegram чат',
      icon: <IconShare />,
      action: () => exportToTelegram(rooms, materialResults, estimateName),
      color: '#0088cc'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Экспорт данных</h2>
          <button onClick={onClose} className="close-btn" aria-label="Закрыть">
            <span>×</span>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="export-options">
            {exportOptions.map(option => (
              <div
                key={option.id}
                className={`export-option ${isExporting === option.id ? 'exporting' : ''}`}
                onClick={() => handleExport(option.id, option.action)}
                style={{ borderLeftColor: option.color }}
              >
                <div className="export-option-icon" style={{ color: option.color }}>
                  {option.icon}
                </div>
                <div className="export-option-content">
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                </div>
                {isExporting === option.id && (
                  <div className="export-option-loading">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="export-summary">
            <h3>Сводка данных:</h3>
            <div className="export-summary-grid">
              <div>
                <span>Помещений:</span>
                <strong>{rooms.length}</strong>
              </div>
              <div>
                <span>Материалов:</span>
                <strong>{Object.values(materialResults).filter(r => r !== null).length}</strong>
              </div>
              <div>
                <span>Общая стоимость:</span>
                <strong>{Object.values(materialResults).reduce((sum, result) => sum + (result?.cost || 0), 0).toFixed(2)} ₽</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};


