import React, { useState, useCallback } from 'react';
import { Opening, Unit } from '../types';
import { CalcInput } from './common';
import { Icon, IconPlus, IconTrash } from './common';

interface OpeningEditorProps {
  openings: Opening[];
  onChange: (openings: Opening[]) => void;
  unit: Unit;
  onInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
}

export const OpeningEditor: React.FC<OpeningEditorProps> = ({
  openings,
  onChange,
  unit,
  onInputFocus
}) => {
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);

  const handleAddOpening = useCallback(() => {
    const newOpening: Opening = {
      id: Date.now(),
      width: '0.8',
      height: '2.1',
      count: '1',
      type: 'door'
    };
    
    onChange([...openings, newOpening]);
    setEditingOpening(newOpening);
  }, [openings, onChange]);

  const handleEditOpening = useCallback((opening: Opening) => {
    setEditingOpening(opening);
  }, []);

  const handleSaveOpening = useCallback((updatedOpening: Opening) => {
    const updatedOpenings = openings.map(opening => 
      opening.id === updatedOpening.id ? updatedOpening : opening
    );
    onChange(updatedOpenings);
    setEditingOpening(null);
  }, [openings, onChange]);

  const handleDeleteOpening = useCallback((openingId: number) => {
    if (window.confirm('Удалить этот проем?')) {
      const updatedOpenings = openings.filter(opening => opening.id !== openingId);
      onChange(updatedOpenings);
      if (editingOpening?.id === openingId) {
        setEditingOpening(null);
      }
    }
  }, [openings, onChange, editingOpening]);

  const handleCancelEdit = useCallback(() => {
    setEditingOpening(null);
  }, []);

  return (
    <div className="opening-editor">
      <div className="editor-header">
        <h4>Проемы (окна и двери)</h4>
        <button 
          className="btn-primary"
          onClick={handleAddOpening}
        >
          <IconPlus />
          Добавить проем
        </button>
      </div>

      {openings.length === 0 ? (
        <div className="empty-state">
          <p>Нет добавленных проемов</p>
        </div>
      ) : (
        <div className="openings-list">
          {openings.map(opening => (
            <div 
              key={opening.id} 
              className={`opening-card ${editingOpening?.id === opening.id ? 'editing' : ''}`}
            >
              <div className="opening-info">
                <div className="opening-type">
                  {opening.type === 'door' ? '🚪 Дверь' : '🪟 Окно'}
                </div>
                <div className="opening-dimensions">
                  {opening.width} × {opening.height} {unit} (×{opening.count})
                </div>
              </div>
              
              <div className="opening-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEditOpening(opening)}
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteOpening(opening.id)}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingOpening && (
        <div className="opening-form">
          <h5>Редактирование проема</h5>
          
          <div className="form-row">
            <div className="form-group">
              <label>Тип проема:</label>
              <select 
                value={editingOpening.type}
                onChange={(e) => setEditingOpening(prev => prev ? {
                  ...prev,
                  type: e.target.value as 'door' | 'window'
                } : null)}
              >
                <option value="door">Дверь</option>
                <option value="window">Окно</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Количество:</label>
              <input
                type="number"
                value={editingOpening.count}
                onChange={(e) => setEditingOpening(prev => prev ? {
                  ...prev,
                  count: e.target.value
                } : null)}
                min="1"
                step="1"
              />
            </div>
          </div>

          <div className="form-row">
            <CalcInput
              id={`opening-width-${editingOpening.id}`}
              label="Ширина"
              value={editingOpening.width}
              onChange={(e) => setEditingOpening(prev => prev ? {
                ...prev,
                width: e.target.value
              } : null)}
              unit={unit}
              onFocus={onInputFocus}
            />
            
            <CalcInput
              id={`opening-height-${editingOpening.id}`}
              label="Высота"
              value={editingOpening.height}
              onChange={(e) => setEditingOpening(prev => prev ? {
                ...prev,
                height: e.target.value
              } : null)}
              unit={unit}
              onFocus={onInputFocus}
            />
          </div>

          {editingOpening.type === 'window' && (
            <div className="form-row">
              <CalcInput
                id={`opening-sill-${editingOpening.id}`}
                label="Высота подоконника"
                value={editingOpening.sillHeight || ''}
                onChange={(e) => setEditingOpening(prev => prev ? {
                  ...prev,
                  sillHeight: e.target.value
                } : null)}
                unit={unit}
                onFocus={onInputFocus}
              />
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingOpening.includeSillArea || false}
                    onChange={(e) => setEditingOpening(prev => prev ? {
                      ...prev,
                      includeSillArea: e.target.checked
                    } : null)}
                  />
                  Учитывать площадь подоконника
                </label>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              className="btn-secondary"
              onClick={handleCancelEdit}
            >
              Отмена
            </button>
            <button 
              className="btn-primary"
              onClick={() => editingOpening && handleSaveOpening(editingOpening)}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
