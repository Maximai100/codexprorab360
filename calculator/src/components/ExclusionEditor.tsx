import React, { useState, useCallback } from 'react';
import { ExclusionZone, Unit } from '../types';
import { CalcInput } from './common';
import { Icon, IconPlus, IconTrash } from './common';

interface ExclusionEditorProps {
  exclusions: ExclusionZone[];
  onChange: (exclusions: ExclusionZone[]) => void;
  unit: Unit;
  onInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
}

export const ExclusionEditor: React.FC<ExclusionEditorProps> = ({
  exclusions,
  onChange,
  unit,
  onInputFocus
}) => {
  const [editingExclusion, setEditingExclusion] = useState<ExclusionZone | null>(null);

  const handleAddExclusion = useCallback(() => {
    const newExclusion: ExclusionZone = {
      id: Date.now(),
      name: 'Исключение',
      width: '1',
      height: '1',
      count: '1',
      affectsWallArea: true,
      affectsPerimeter: false
    };
    
    onChange([...exclusions, newExclusion]);
    setEditingExclusion(newExclusion);
  }, [exclusions, onChange]);

  const handleEditExclusion = useCallback((exclusion: ExclusionZone) => {
    setEditingExclusion(exclusion);
  }, []);

  const handleSaveExclusion = useCallback((updatedExclusion: ExclusionZone) => {
    const updatedExclusions = exclusions.map(exclusion => 
      exclusion.id === updatedExclusion.id ? updatedExclusion : exclusion
    );
    onChange(updatedExclusions);
    setEditingExclusion(null);
  }, [exclusions, onChange]);

  const handleDeleteExclusion = useCallback((exclusionId: number) => {
    if (window.confirm('Удалить это исключение?')) {
      const updatedExclusions = exclusions.filter(exclusion => exclusion.id !== exclusionId);
      onChange(updatedExclusions);
      if (editingExclusion?.id === exclusionId) {
        setEditingExclusion(null);
      }
    }
  }, [exclusions, onChange, editingExclusion]);

  const handleCancelEdit = useCallback(() => {
    setEditingExclusion(null);
  }, []);

  return (
    <div className="exclusion-editor">
      <div className="editor-header">
        <h4>Зоны исключения</h4>
        <button 
          className="btn-primary"
          onClick={handleAddExclusion}
        >
          <IconPlus />
          Добавить исключение
        </button>
      </div>

      {exclusions.length === 0 ? (
        <div className="empty-state">
          <p>Нет добавленных исключений</p>
        </div>
      ) : (
        <div className="exclusions-list">
          {exclusions.map(exclusion => (
            <div 
              key={exclusion.id} 
              className={`exclusion-card ${editingExclusion?.id === exclusion.id ? 'editing' : ''}`}
            >
              <div className="exclusion-info">
                <div className="exclusion-name">{exclusion.name}</div>
                <div className="exclusion-dimensions">
                  {exclusion.width} × {exclusion.height} {unit} (×{exclusion.count})
                </div>
                <div className="exclusion-effects">
                  {exclusion.affectsWallArea && <span>Стены</span>}
                  {exclusion.affectsPerimeter && <span>Периметр</span>}
                </div>
              </div>
              
              <div className="exclusion-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEditExclusion(exclusion)}
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteExclusion(exclusion.id)}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingExclusion && (
        <div className="exclusion-form">
          <h5>Редактирование исключения</h5>
          
          <CalcInput
            id={`exclusion-name-${editingExclusion.id}`}
            label="Название"
            value={editingExclusion.name}
            onChange={(e) => setEditingExclusion(prev => prev ? {
              ...prev,
              name: e.target.value
            } : null)}
            onFocus={onInputFocus}
          />

          <div className="form-row">
            <CalcInput
              id={`exclusion-width-${editingExclusion.id}`}
              label="Ширина"
              value={editingExclusion.width}
              onChange={(e) => setEditingExclusion(prev => prev ? {
                ...prev,
                width: e.target.value
              } : null)}
              unit={unit}
              onFocus={onInputFocus}
            />
            
            <CalcInput
              id={`exclusion-height-${editingExclusion.id}`}
              label="Высота"
              value={editingExclusion.height}
              onChange={(e) => setEditingExclusion(prev => prev ? {
                ...prev,
                height: e.target.value
              } : null)}
              unit={unit}
              onFocus={onInputFocus}
            />
            
            <CalcInput
              id={`exclusion-count-${editingExclusion.id}`}
              label="Количество"
              value={editingExclusion.count}
              onChange={(e) => setEditingExclusion(prev => prev ? {
                ...prev,
                count: e.target.value
              } : null)}
              step="1"
              onFocus={onInputFocus}
            />
          </div>

          <div className="form-group">
            <label>Влияние на расчеты:</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingExclusion.affectsWallArea}
                  onChange={(e) => setEditingExclusion(prev => prev ? {
                    ...prev,
                    affectsWallArea: e.target.checked
                  } : null)}
                />
                Исключить из площади стен
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingExclusion.affectsPerimeter}
                  onChange={(e) => setEditingExclusion(prev => prev ? {
                    ...prev,
                    affectsPerimeter: e.target.checked
                  } : null)}
                />
                Исключить из периметра
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-secondary"
              onClick={handleCancelEdit}
            >
              Отмена
            </button>
            <button 
              className="btn-primary"
              onClick={() => editingExclusion && handleSaveExclusion(editingExclusion)}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
