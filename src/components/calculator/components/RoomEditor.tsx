import React, { useState, useCallback } from 'react';
import { RoomData } from '../types';
import { ListItem } from '../../ui/ListItem';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { IconBuilding, IconPencil, IconTrash, IconPlus } from './common';
import styles from './RoomEditor.module.css';

interface RoomEditorProps {
  rooms: RoomData[];
  setRooms: (rooms: RoomData[]) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ rooms, setRooms }) => {
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);

  const handleAddClick = useCallback(() => {
    setEditingRoom({
      id: 0, // Временный ID для новой комнаты
      name: `Комната ${rooms.length + 1}`,
      length: '5',
      width: '4',
      height: '2.8',
      unit: 'm',
      openings: [],
      exclusions: [],
      geometricElements: [],
      notes: '',
      images: []
    });
  }, [rooms.length]);

  const handleEditClick = useCallback((room: RoomData) => {
    setEditingRoom(room);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingRoom(null);
  }, []);

  const handleDelete = useCallback((roomId: number) => {
    if (window.confirm('Удалить эту комнату?')) {
      setRooms(rooms.filter(room => room.id !== roomId));
    }
  }, [rooms, setRooms]);
  
  const handleSave = useCallback(() => {
    if (!editingRoom) return;

    if (editingRoom.id === 0) { // Сохранение новой комнаты
      const newRoom = { ...editingRoom, id: Date.now() };
      setRooms([...rooms, newRoom]);
    } else { // Сохранение существующей
      setRooms(rooms.map(room => room.id === editingRoom.id ? editingRoom : room));
    }
    setEditingRoom(null);
  }, [editingRoom, rooms, setRooms]);

  const handleInputChange = (field: keyof RoomData, value: string) => {
    setEditingRoom(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className={styles.calculatorSection}>
      
      {/* --- БЛОК 1: Форма редактирования/добавления --- */}
      {editingRoom && (
        <div className={styles.formContainer}>
          <h3>{editingRoom.id === 0 ? 'Новая комната' : 'Редактирование комнаты'}</h3>

          <Input 
            label="Название комнаты"
            value={editingRoom.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Например, Гостиная"
          />

          {/* Контейнер для размеров */}
          <div className={styles.dimensionsGroup}>
            <Input 
              label="Длина (м)"
              type="number"
              value={editingRoom.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
            />
            <Input 
              label="Ширина (м)"
              type="number"
              value={editingRoom.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
            />
            <Input 
              label="Высота (м)"
              type="number"
              value={editingRoom.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
            />
          </div>

          {/* Кнопки формы */}
          <div className={styles.formActions}>
            <Button onClick={handleSave} variant="primary">Сохранить</Button>
            <Button onClick={handleCancel}>Отмена</Button>
          </div>
        </div>
      )}

      {/* --- БЛОК 2: Список комнат и кнопка "Добавить" --- */}
      {!editingRoom && (
        <>
          <div className={styles.roomsList}>
            {rooms.map(room => (
              <div key={room.id} className={styles.roomCard}>
                <div className={styles.roomCardHeader}>
                  <h3>{room.name}</h3>
                  <div className={styles.roomActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleEditClick(room)}
                      title="Редактировать"
                    >
                      <IconPencil />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.danger}`}
                      onClick={() => handleDelete(room.id)}
                      title="Удалить"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
                <div className={styles.roomInfo}>
                  <div className={styles.roomDimensions}>
                    {room.length}м x {room.width}м x {room.height}м
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопка добавления новой комнаты */}
          <Button onClick={handleAddClick} variant="primary" fullWidth className={styles.addButton}>
            <IconPlus /> Добавить комнату
          </Button>
        </>
      )}
    </div>
  );
};