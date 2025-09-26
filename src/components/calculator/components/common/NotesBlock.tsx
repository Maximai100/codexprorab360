import React, { useState, useRef, useEffect } from 'react';
import { IconImage } from './Icon';

interface NotesBlockProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    roomName: string;
}

export const NotesBlock: React.FC<NotesBlockProps> = ({ 
    notes, 
    onNotesChange, 
    roomName 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        setIsExpanded(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsExpanded(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        }
    };

    return (
        <div className="notes-block">
            <div 
                className="notes-block-header" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="notes-block-icon">
                    <IconImage />
                </div>
                <div className="notes-block-title">
                    <h4>Заметки для "{roomName}"</h4>
                    {notes && (
                        <span className="notes-preview">
                            {notes.length > 50 ? `${notes.substring(0, 50)}...` : notes}
                        </span>
                    )}
                </div>
                <div className="notes-block-arrow">
                    {isExpanded ? '▲' : '▼'}
                </div>
            </div>

            {isExpanded && (
                <div className="notes-block-content">
                    {isEditing ? (
                        <div className="notes-editor">
                            <textarea
                                ref={textareaRef}
                                value={notes}
                                onChange={(e) => onNotesChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Добавьте заметки о комнате..."
                                rows={4}
                                className="notes-textarea"
                            />
                            <div className="notes-editor-actions">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleCancel}
                                >
                                    Отмена
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleSave}
                                >
                                    Сохранить
                                </button>
                            </div>
                            <div className="notes-editor-hint">
                                Ctrl+Enter для сохранения, Esc для отмены
                            </div>
                        </div>
                    ) : (
                        <div className="notes-display">
                            {notes ? (
                                <div className="notes-text">
                                    {notes.split('\n').map((line, index) => (
                                        <div key={index}>{line}</div>
                                    ))}
                                </div>
                            ) : (
                                <div className="notes-empty">
                                    Заметок пока нет
                                </div>
                            )}
                            <button 
                                className="btn btn-tertiary notes-edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                {notes ? 'Редактировать' : 'Добавить заметки'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


