import React, { useState, useCallback } from 'react';
import { RoomData, Unit } from '../types';
import { Icon, IconPlus, IconTrash } from './common';
import { RoomForm } from './RoomForm';

interface RoomEditorProps {
  rooms: RoomData[];
  setRooms: (rooms: RoomData[]) => void;
  onInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
  readOnly?: boolean;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  rooms,
  setRooms,
  onInputFocus,
  readOnly = false
}) => {
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  const handleAddRoom = useCallback(() => {
    const newRoom: RoomData = {
      id: Date.now(),
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
    };
    
    setRooms([...rooms, newRoom]);
    setEditingRoom(newRoom);
    setIsAddingRoom(true);
  }, [rooms, setRooms]);

  const handleEditRoom = useCallback((room: RoomData) => {
    setEditingRoom(room);
    setIsAddingRoom(false);
  }, []);

  const handleSaveRoom = useCallback((updatedRoom: RoomData) => {
    const updatedRooms = rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    );
    setRooms(updatedRooms);
    setEditingRoom(null);
    setIsAddingRoom(false);
  }, [rooms, setRooms]);

  const handleDeleteRoom = useCallback((roomId: number) => {
    if (window.confirm('Удалить эту комнату?')) {
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      if (editingRoom?.id === roomId) {
        setEditingRoom(null);
        setIsAddingRoom(false);
      }
    }
  }, [rooms, setRooms, editingRoom]);

  const handleCancelEdit = useCallback(() => {
    setEditingRoom(null);
    setIsAddingRoom(false);
  }, []);

  return (
    <div className="room-editor">
      {/* Список комнат */}
      <div className="rooms-list">
        <div className="rooms-header">
          <h2>Комнаты</h2>
          {!readOnly && (
            <button 
              className="btn-primary"
              onClick={handleAddRoom}
              title="Добавить комнату"
            >
              <IconPlus />
              Добавить комнату
            </button>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="empty-state">
            <p>Нет добавленных комнат</p>
            {!readOnly && (
              <button 
                className="btn-primary"
                onClick={handleAddRoom}
              >
                <IconPlus />
                Добавить первую комнату
              </button>
            )}
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div 
                key={room.id} 
                className={`room-card ${editingRoom?.id === room.id ? 'editing' : ''}`}
              >
                <div className="room-card-header">
                  <h3>{room.name}</h3>
                  {!readOnly && (
                    <div className="room-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditRoom(room)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteRoom(room.id)}
                        title="Удалить"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="room-info">
                  <div className="room-dimensions">
                    <span>{room.length} × {room.width} × {room.height} {room.unit}</span>
                  </div>
                  <div className="room-stats">
                    <span>Проемов: {room.openings.length}</span>
                    <span>Исключений: {room.exclusions.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Форма редактирования комнаты */}
      {editingRoom && (
        <div className="room-form-container">
          <RoomForm
            room={editingRoom}
            onSave={handleSaveRoom}
            onCancel={handleCancelEdit}
            onInputFocus={onInputFocus}
            isNew={isAddingRoom}
          />
        </div>
      )}
    </div>
  );
};
