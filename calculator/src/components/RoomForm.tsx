import React, { useState, useCallback, useEffect } from 'react';
import { RoomData, Unit, Opening, ExclusionZone, GeometricElement } from '../types';
import { CalcInput } from './common';
import { OpeningEditor } from './OpeningEditor';
import { ExclusionEditor } from './ExclusionEditor';
import { GeometricElementEditor } from './GeometricElementEditor';
import { NotesBlock } from './common';
import { ImageUpload } from './common';

interface RoomFormProps {
  room: RoomData;
  onSave: (room: RoomData) => void;
  onCancel: () => void;
  onInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
  isNew?: boolean;
}

export const RoomForm: React.FC<RoomFormProps> = ({
  room,
  onSave,
  onCancel,
  onInputFocus,
  isNew = false
}) => {
  const [formData, setFormData] = useState<RoomData>(room);
  const [activeTab, setActiveTab] = useState<'basic' | 'openings' | 'exclusions' | 'geometry' | 'notes' | 'images'>('basic');

  useEffect(() => {
    setFormData(room);
  }, [room]);

  const handleInputChange = useCallback((field: keyof RoomData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleUnitChange = useCallback((unit: Unit) => {
    setFormData(prev => ({
      ...prev,
      unit
    }));
  }, []);

  const handleOpeningChange = useCallback((openings: Opening[]) => {
    setFormData(prev => ({
      ...prev,
      openings
    }));
  }, []);

  const handleExclusionChange = useCallback((exclusions: ExclusionZone[]) => {
    setFormData(prev => ({
      ...prev,
      exclusions
    }));
  }, []);

  const handleGeometricElementChange = useCallback((geometricElements: GeometricElement[]) => {
    setFormData(prev => ({
      ...prev,
      geometricElements
    }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setFormData(prev => ({
      ...prev,
      notes
    }));
  }, []);

  const handleImagesChange = useCallback((images: RoomImage[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(formData);
  }, [formData, onSave]);

  const tabs = [
    { id: 'basic', label: 'Основные', icon: '📐' },
    { id: 'openings', label: 'Проемы', icon: '🚪' },
    { id: 'exclusions', label: 'Исключения', icon: '🚫' },
    { id: 'geometry', label: 'Геометрия', icon: '🔷' },
    { id: 'notes', label: 'Заметки', icon: '📝' },
    { id: 'images', label: 'Фото', icon: '📷' }
  ];

  return (
    <div className="room-form">
      <div className="form-header">
        <h2>{isNew ? 'Новая комната' : 'Редактирование комнаты'}</h2>
        <div className="form-actions">
          <button 
            className="btn-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button 
            className="btn-primary"
            onClick={handleSave}
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Навигация по вкладкам */}
      <div className="form-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Содержимое вкладок */}
      <div className="form-content">
        {activeTab === 'basic' && (
          <div className="form-section">
            <CalcInput
              id="room-name"
              label="Название комнаты"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={onInputFocus}
            />

            <div className="dimensions-group">
              <CalcInput
                id="room-length"
                label="Длина"
                value={formData.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
                unit={formData.unit}
                onFocus={onInputFocus}
              />
              
              <CalcInput
                id="room-width"
                label="Ширина"
                value={formData.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                unit={formData.unit}
                onFocus={onInputFocus}
              />
              
              <CalcInput
                id="room-height"
                label="Высота"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                unit={formData.unit}
                onFocus={onInputFocus}
              />
            </div>

            <div className="unit-selector">
              <label>Единицы измерения:</label>
              <div className="unit-buttons">
                <button 
                  className={`unit-btn ${formData.unit === 'm' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('m')}
                >
                  Метры
                </button>
                <button 
                  className={`unit-btn ${formData.unit === 'cm' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('cm')}
                >
                  Сантиметры
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'openings' && (
          <div className="form-section">
            <OpeningEditor
              openings={formData.openings}
              onChange={handleOpeningChange}
              unit={formData.unit}
              onInputFocus={onInputFocus}
            />
          </div>
        )}

        {activeTab === 'exclusions' && (
          <div className="form-section">
            <ExclusionEditor
              exclusions={formData.exclusions}
              onChange={handleExclusionChange}
              unit={formData.unit}
              onInputFocus={onInputFocus}
            />
          </div>
        )}

        {activeTab === 'geometry' && (
          <div className="form-section">
            <GeometricElementEditor
              geometricElements={formData.geometricElements}
              onChange={handleGeometricElementChange}
              unit={formData.unit}
              onInputFocus={onInputFocus}
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="form-section">
            <NotesBlock
              notes={formData.notes}
              onChange={handleNotesChange}
              placeholder="Добавьте заметки о комнате..."
            />
          </div>
        )}

        {activeTab === 'images' && (
          <div className="form-section">
            <ImageUpload
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={5}
            />
          </div>
        )}
      </div>
    </div>
  );
};
