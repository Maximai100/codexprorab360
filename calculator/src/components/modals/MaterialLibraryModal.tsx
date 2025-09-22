import React, { useState, useCallback } from 'react';
import { SavedMaterial, MaterialCategory } from '../../types';
import { CalcInput } from '../common/CalcInput';
import { IconClose, IconTrash } from '../common/Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay open" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Закрыть">
                        <IconClose />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface MaterialLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    materials: SavedMaterial[];
    onSave: (material: Omit<SavedMaterial, 'id'>) => void;
    onDelete: (id: number) => void;
}

const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
    { value: 'plaster', label: 'Штукатурка' },
    { value: 'putty', label: 'Шпаклевка' },
    { value: 'paint', label: 'Краска' },
    { value: 'wallpaper', label: 'Обои' },
    { value: 'tile', label: 'Плитка' },
    { value: 'flooring', label: 'Напольные покрытия' },
    { value: 'screed', label: 'Стяжка' },
    { value: 'skirting', label: 'Плинтус' },
    { value: 'drywall', label: 'Гипсокартон' }
];

export const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({ 
    isOpen, 
    onClose, 
    materials, 
    onSave, 
    onDelete 
}) => {
    const [activeTab, setActiveTab] = useState<'library' | 'add'>('library');
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        category: 'plaster' as MaterialCategory,
        params: {} as Record<string, string>
    });

    const handleSaveMaterial = useCallback(() => {
        if (newMaterial.name.trim()) {
            onSave(newMaterial);
            setNewMaterial({ name: '', category: 'plaster', params: {} });
            setActiveTab('library');
        }
    }, [newMaterial, onSave]);

    const handleDeleteMaterial = useCallback((id: number) => {
        if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
            onDelete(id);
        }
    }, [onDelete]);

    const filteredMaterials = materials.filter(m => m.category === newMaterial.category);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Библиотека материалов">
            <div className="modal-tabs">
                <button 
                    onClick={() => setActiveTab('library')} 
                    className={activeTab === 'library' ? 'active' : ''}
                >
                    Библиотека
                </button>
                <button 
                    onClick={() => setActiveTab('add')} 
                    className={activeTab === 'add' ? 'active' : ''}
                >
                    Добавить
                </button>
            </div>
            
            <div className="modal-body">
                {activeTab === 'library' ? (
                    <div>
                        <div className="calc-input-group">
                            <label htmlFor="category-select">Категория</label>
                            <select 
                                id="category-select"
                                value={newMaterial.category} 
                                onChange={e => setNewMaterial(prev => ({ 
                                    ...prev, 
                                    category: e.target.value as MaterialCategory 
                                }))}
                            >
                                {MATERIAL_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {filteredMaterials.length > 0 ? (
                            <div className="estimates-list">
                                {filteredMaterials.map(material => (
                                    <div key={material.id} className="estimate-item">
                                        <div className="estimate-info">
                                            <strong>{material.name}</strong>
                                            <span>{MATERIAL_CATEGORIES.find(c => c.value === material.category)?.label}</span>
                                        </div>
                                        <div className="estimate-actions">
                                            <button 
                                                onClick={() => handleDeleteMaterial(material.id)} 
                                                className="btn-tertiary" 
                                                style={{ padding: '8px' }}
                                                aria-label={`Удалить материал "${material.name}"`}
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-results-message">
                                Материалов в категории "{MATERIAL_CATEGORIES.find(c => c.value === newMaterial.category)?.label}" нет.
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <CalcInput 
                            id="material-name" 
                            label="Название материала" 
                            value={newMaterial.name} 
                            onChange={e => setNewMaterial(prev => ({ ...prev, name: e.target.value }))} 
                        />
                        
                        <div className="calc-input-group">
                            <label htmlFor="material-category">Категория</label>
                            <select 
                                id="material-category"
                                value={newMaterial.category} 
                                onChange={e => setNewMaterial(prev => ({ 
                                    ...prev, 
                                    category: e.target.value as MaterialCategory 
                                }))}
                            >
                                {MATERIAL_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="calc-input-group">
                            <label htmlFor="material-params">Параметры (JSON)</label>
                            <textarea 
                                id="material-params"
                                value={JSON.stringify(newMaterial.params, null, 2)} 
                                onChange={e => {
                                    try {
                                        const params = JSON.parse(e.target.value);
                                        setNewMaterial(prev => ({ ...prev, params }));
                                    } catch {
                                        // Invalid JSON, keep current value
                                    }
                                }}
                                rows={4}
                                placeholder='{"price": "1000", "consumption": "1.2"}'
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="modal-footer">
                <button 
                    className="btn btn-secondary" 
                    onClick={onClose}
                    aria-label="Закрыть библиотеку"
                >
                    Закрыть
                </button>
                {activeTab === 'add' && (
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSaveMaterial}
                        disabled={!newMaterial.name.trim()}
                        aria-label="Сохранить материал"
                    >
                        Сохранить
                    </button>
                )}
            </div>
        </Modal>
    );
};
