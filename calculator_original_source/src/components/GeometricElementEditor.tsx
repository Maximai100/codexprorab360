import React, { useState, useCallback } from 'react';
import { GeometricElement, Unit } from '../types';
import { CalcInput } from './common';
import { Icon, IconPlus, IconTrash } from './common';

interface GeometricElementEditorProps {
  geometricElements: GeometricElement[];
  onChange: (elements: GeometricElement[]) => void;
  unit: Unit;
  onInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
}

export const GeometricElementEditor: React.FC<GeometricElementEditorProps> = ({
  geometricElements,
  onChange,
  unit,
  onInputFocus
}) => {
  const [editingElement, setEditingElement] = useState<GeometricElement | null>(null);

  const handleAddElement = useCallback(() => {
    const newElement: GeometricElement = {
      id: Date.now(),
      type: 'niche',
      width: '1',
      depth: '0.5',
      diameter: '0',
      height: '2',
      count: '1'
    };
    
    onChange([...geometricElements, newElement]);
    setEditingElement(newElement);
  }, [geometricElements, onChange]);

  const handleEditElement = useCallback((element: GeometricElement) => {
    setEditingElement(element);
  }, []);

  const handleSaveElement = useCallback((updatedElement: GeometricElement) => {
    const updatedElements = geometricElements.map(element => 
      element.id === updatedElement.id ? updatedElement : element
    );
    onChange(updatedElements);
    setEditingElement(null);
  }, [geometricElements, onChange]);

  const handleDeleteElement = useCallback((elementId: number) => {
    if (window.confirm('Удалить этот элемент?')) {
      const updatedElements = geometricElements.filter(element => element.id !== elementId);
      onChange(updatedElements);
      if (editingElement?.id === elementId) {
        setEditingElement(null);
      }
    }
  }, [geometricElements, onChange, editingElement]);

  const handleCancelEdit = useCallback(() => {
    setEditingElement(null);
  }, []);

  const getElementIcon = (type: GeometricElement['type']) => {
    switch (type) {
      case 'niche': return '🕳️';
      case 'protrusion': return '📦';
      case 'column': return '🏛️';
      default: return '🔷';
    }
  };

  const getElementName = (type: GeometricElement['type']) => {
    switch (type) {
      case 'niche': return 'Ниша';
      case 'protrusion': return 'Выступ';
      case 'column': return 'Колонна';
      default: return 'Элемент';
    }
  };

  return (
    <div className="geometric-element-editor">
      <div className="editor-header">
        <h4>Геометрические элементы</h4>
        <button 
          className="btn-primary"
          onClick={handleAddElement}
        >
          <IconPlus />
          Добавить элемент
        </button>
      </div>

      {geometricElements.length === 0 ? (
        <div className="empty-state">
          <p>Нет добавленных элементов</p>
        </div>
      ) : (
        <div className="elements-list">
          {geometricElements.map(element => (
            <div 
              key={element.id} 
              className={`element-card ${editingElement?.id === element.id ? 'editing' : ''}`}
            >
              <div className="element-info">
                <div className="element-type">
                  {getElementIcon(element.type)} {getElementName(element.type)}
                </div>
                <div className="element-dimensions">
                  {element.type === 'column' ? (
                    `Ø${element.diameter} × ${element.height} ${unit} (×${element.count})`
                  ) : (
                    `${element.width} × ${element.depth} × ${element.height} ${unit} (×${element.count})`
                  )}
                </div>
              </div>
              
              <div className="element-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEditElement(element)}
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteElement(element.id)}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingElement && (
        <div className="element-form">
          <h5>Редактирование элемента</h5>
          
          <div className="form-group">
            <label>Тип элемента:</label>
            <select 
              value={editingElement.type}
              onChange={(e) => setEditingElement(prev => prev ? {
                ...prev,
                type: e.target.value as GeometricElement['type']
              } : null)}
            >
              <option value="niche">Ниша</option>
              <option value="protrusion">Выступ</option>
              <option value="column">Колонна</option>
            </select>
          </div>

          <CalcInput
            id={`element-count-${editingElement.id}`}
            label="Количество"
            value={editingElement.count}
            onChange={(e) => setEditingElement(prev => prev ? {
              ...prev,
              count: e.target.value
            } : null)}
            step="1"
            onFocus={onInputFocus}
          />

          <CalcInput
            id={`element-height-${editingElement.id}`}
            label="Высота"
            value={editingElement.height}
            onChange={(e) => setEditingElement(prev => prev ? {
              ...prev,
              height: e.target.value
            } : null)}
            unit={unit}
            onFocus={onInputFocus}
          />

          {editingElement.type === 'column' ? (
            <CalcInput
              id={`element-diameter-${editingElement.id}`}
              label="Диаметр"
              value={editingElement.diameter}
              onChange={(e) => setEditingElement(prev => prev ? {
                ...prev,
                diameter: e.target.value
              } : null)}
              unit={unit}
              onFocus={onInputFocus}
            />
          ) : (
            <div className="form-row">
              <CalcInput
                id={`element-width-${editingElement.id}`}
                label="Ширина"
                value={editingElement.width}
                onChange={(e) => setEditingElement(prev => prev ? {
                  ...prev,
                  width: e.target.value
                } : null)}
                unit={unit}
                onFocus={onInputFocus}
              />
              
              <CalcInput
                id={`element-depth-${editingElement.id}`}
                label="Глубина"
                value={editingElement.depth}
                onChange={(e) => setEditingElement(prev => prev ? {
                  ...prev,
                  depth: e.target.value
                } : null)}
                unit={unit}
                onFocus={onInputFocus}
              />
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
              onClick={() => editingElement && handleSaveElement(editingElement)}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
