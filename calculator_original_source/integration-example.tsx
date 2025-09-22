import React, { useState } from 'react';
import { CalculatorModule, CalculatorConfig, RoomData, SavedMaterial } from './src/index';

// Пример интеграции калькулятора в приложение
const IntegrationExample: React.FC = () => {
  const [projectData, setProjectData] = useState<{
    rooms: RoomData[];
    materials: SavedMaterial[];
  }>({
    rooms: [],
    materials: []
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const config: CalculatorConfig = {
    theme: 'light',
    enableOfflineMode: true,
    enableAutoSave: true,
    enableExport: true,
    onDataChange: (rooms: RoomData[], materials: SavedMaterial[]) => {
      setProjectData({ rooms, materials });
      addLog(`Данные обновлены: ${rooms.length} комнат, ${materials.length} материалов`);
    },
    onExport: (format: string, data: any) => {
      addLog(`Экспорт в ${format} выполнен`);
      console.log('Export data:', data);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Основное приложение */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h1>Строительное приложение</h1>
        <div style={{ marginBottom: '20px' }}>
          <h2>Статистика проекта:</h2>
          <p>Комнат: {projectData.rooms.length}</p>
          <p>Материалов: {projectData.materials.length}</p>
          <p>Общая площадь: {
            projectData.rooms.reduce((total, room) => {
              const length = parseFloat(room.length) || 0;
              const width = parseFloat(room.width) || 0;
              return total + (length * width);
            }, 0).toFixed(2)
          } м²</p>
        </div>
        
        <div>
          <h2>Логи:</h2>
          <div style={{ 
            height: '200px', 
            overflow: 'auto', 
            backgroundColor: 'white', 
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Калькулятор */}
      <div style={{ flex: 2, borderLeft: '1px solid #ddd' }}>
        <CalculatorModule 
          config={config}
          initialRooms={projectData.rooms}
          initialMaterials={projectData.materials}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};

export default IntegrationExample;


