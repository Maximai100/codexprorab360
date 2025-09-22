import React, { useState, useCallback, useEffect } from 'react';
import { RoomData, Unit } from '../types';
import { ListItem } from '../../ui/ListItem';
import { IconEdit, IconSave, IconClose } from './common/Icon';

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

  const handleSave = useCallback(() => {
    onSave(formData);
  }, [formData, onSave]);

  return (
    <div className="room-form">
      {/* Заголовок формы */}
      <div className="form-header">
        <h2>{isNew ? 'Новая комната' : 'Редактирование комнаты'}</h2>
      </div>

      {/* Поля ввода в стиле Прораба */}
      <div className="form-fields">
        {/* Название комнаты */}
        <ListItem
          icon={<IconEdit />}
          iconBgColor="var(--primary-color)"
          title="Название комнаты"
          subtitle="Введите название комнаты"
          actions={
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={onInputFocus}
              placeholder="Например: Гостиная"
              className="room-input"
            />
          }
        />

        {/* Длина */}
        <ListItem
          icon={<IconEdit />}
          iconBgColor="var(--secondary-bg-color)"
          title="Длина"
          subtitle={`В метрах (${formData.unit})`}
          actions={
            <div className="input-with-unit">
              <input
                type="number"
                value={formData.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
                onFocus={onInputFocus}
                placeholder="0"
                className="room-input"
                step="0.01"
                min="0"
              />
              <span className="input-unit">{formData.unit}</span>
            </div>
          }
        />

        {/* Ширина */}
        <ListItem
          icon={<IconEdit />}
          iconBgColor="var(--secondary-bg-color)"
          title="Ширина"
          subtitle={`В метрах (${formData.unit})`}
          actions={
            <div className="input-with-unit">
              <input
                type="number"
                value={formData.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                onFocus={onInputFocus}
                placeholder="0"
                className="room-input"
                step="0.01"
                min="0"
              />
              <span className="input-unit">{formData.unit}</span>
            </div>
          }
        />

        {/* Высота */}
        <ListItem
          icon={<IconEdit />}
          iconBgColor="var(--secondary-bg-color)"
          title="Высота"
          subtitle={`В метрах (${formData.unit})`}
          actions={
            <div className="input-with-unit">
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                onFocus={onInputFocus}
                placeholder="0"
                className="room-input"
                step="0.01"
                min="0"
              />
              <span className="input-unit">{formData.unit}</span>
            </div>
          }
        />

        {/* Единицы измерения */}
        <ListItem
          icon={<IconEdit />}
          iconBgColor="var(--hint-color)"
          title="Единицы измерения"
          subtitle="Выберите единицы для размеров"
          actions={
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
          }
        />
      </div>

      {/* Кнопки действий */}
      <div className="form-actions">
        <button 
          className="btn-secondary"
          onClick={onCancel}
        >
          <IconClose />
          Отмена
        </button>
        <button 
          className="btn-primary"
          onClick={handleSave}
        >
          <IconSave />
          Сохранить
        </button>
      </div>
    </div>
  );
};
