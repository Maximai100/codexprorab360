
import React, { useState, useEffect } from 'react';
import type { Owner, ContactMethod } from '../types';
import Modal from './Modal';
import MobileModal from './mobile/MobileModal';
import MobileInput from './mobile/MobileInput';
import MobileTextarea from './mobile/MobileTextarea';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from './icons/Icons';

interface OwnerModalProps {
    owner: Owner;
    onClose: () => void;
    onUpdate: (updatedOwner: Owner) => void;
    onDelete: (ownerId: string) => void;
}

const OwnerModal: React.FC<OwnerModalProps> = ({ owner, onClose, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableOwner, setEditableOwner] = useState(owner);
    const isMobile = useIsMobile();

    useEffect(() => {
        setEditableOwner(owner);
    }, [owner]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'apartments') {
            setEditableOwner(prev => ({ ...prev, apartments: value.split(',').map(s => s.trim()).filter(Boolean) }));
        } else {
            setEditableOwner(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleContactChange = (index: number, field: 'type' | 'value', value: string) => {
        const updatedContacts = [...(editableOwner.contact || [])];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };
        setEditableOwner(prev => ({ ...prev, contact: updatedContacts }));
    };

    const addContactField = () => {
        setEditableOwner(prev => ({
            ...prev,
            contact: [...(prev.contact || []), { id: `c${Date.now()}`, type: '', value: '' }]
        }));
    };

    const removeContactField = (id: string) => {
        setEditableOwner(prev => ({
            ...prev,
            contact: (prev.contact || []).filter(c => c.id !== id)
        }));
    };

    const handleSave = () => {
        // Filter out empty contact fields before saving
        const cleanedOwner = {
            ...editableOwner,
            contact: (editableOwner.contact || []).filter(c => c.type.trim() !== '' && c.value.trim() !== '')
        };
        onUpdate(cleanedOwner);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableOwner(owner);
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить собственника "${owner.name}"? Это действие необратимо.`)) {
            onDelete(owner.id);
        }
    }

    const renderContactIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('phone') || lowerType.includes('телефон')) {
            return <PhoneIcon className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />;
        }
        if (lowerType.includes('email') || lowerType.includes('почта')) {
            return <EnvelopeIcon className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />;
        }
        return <div className="w-4 h-4 mr-2 flex-shrink-0" />; // Placeholder for alignment
    };

    const renderFooter = () => {
        if (isEditing) {
            return (
                 <div className="flex justify-between w-full">
                    <button type="button" onClick={handleDelete} className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none dark:focus:ring-red-800 inline-flex items-center gap-2">
                        <TrashIcon className="w-4 h-4" />
                        Удалить
                    </button>
                    <div className="flex space-x-2">
                        <button type="button" onClick={handleCancel} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                            Отмена
                        </button>
                        <button type="button" onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                            Сохранить
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex justify-between w-full">
                 <button type="button" onClick={handleDelete} className="text-slate-400 hover:text-red-500 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center gap-2 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                    Удалить
                </button>
                <button type="button" onClick={() => setIsEditing(true)} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" />
                    Редактировать
                </button>
            </div>
        );
    }
    
    const inputClasses = "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    const ModalComponent = isMobile ? MobileModal : Modal;

    const content = (
        <div className="space-y-4">
             {isEditing && (
                isMobile ? (
                    <MobileInput
                        label="ФИО / Название организации"
                        name="name"
                        value={editableOwner.name}
                        onChange={handleInputChange}
                    />
                ) : (
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-white">ФИО / Название организации</label>
                        <input type="text" id="name" name="name" value={editableOwner.name} onChange={handleInputChange} className={inputClasses} />
                    </div>
                )
            )}
                <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">Контактная информация</h4>
                    {isEditing ? (
                        <div className="space-y-2">
                            {(editableOwner.contact || []).map((contact, index) => (
                                <div key={contact.id} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Тип (напр. Email)"
                                        value={contact.type}
                                        onChange={(e) => handleContactChange(index, 'type', e.target.value)}
                                        className={`${inputClasses} w-1/3`}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Значение"
                                        value={contact.value}
                                        onChange={(e) => handleContactChange(index, 'value', e.target.value)}
                                        className={`${inputClasses} flex-grow`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeContactField(contact.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 rounded-full hover:bg-red-900/50"
                                        aria-label="Удалить контакт"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addContactField}
                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 mt-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Добавить контакт
                            </button>
                        </div>
                    ) : (
                         <ul className="space-y-2 text-sm text-slate-400">
                            {(owner.contact || []).map(c => (
                                <li key={c.id} className="flex items-center">
                                    {renderContactIcon(c.type)}
                                    <span className="flex-shrink-0"><span className="font-medium text-slate-300">{c.type}:</span></span>
                                    <span className="ml-2 truncate">{c.value}</span>
                                </li>
                            ))}
                            {(!owner.contact || owner.contact.length === 0) && <p className="italic">Контактов нет.</p>}
                        </ul>
                    )}
                </div>
                
                <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">Апартаменты</h4>
                    {isEditing ? <input type="text" name="apartments" value={(editableOwner.apartments || []).join(', ')} onChange={handleInputChange} className={inputClasses} placeholder="Например: A-101, B-205" /> : (
                        <div className="flex flex-wrap gap-2">
                            {(owner.apartments || []).map(apt => (
                                <span key={apt} className="flex items-center bg-blue-900 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                                    <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
                                    {apt}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">Заметки</h4>
                    {isEditing ? (
                        isMobile ? (
                            <MobileTextarea
                                name="notes"
                                rows={4}
                                value={editableOwner.notes}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <textarea name="notes" rows={3} value={editableOwner.notes} onChange={handleInputChange} className={inputClasses} />
                        )
                    ) : (
                        owner.notes ? (
                            <div className="flex items-start bg-slate-700/50 p-3 rounded-lg">
                                <PencilIcon className="w-4 h-4 mr-3 mt-1 text-slate-400 flex-shrink-0" />
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{owner.notes}</p>
                            </div>
                        ) : <p className="text-sm text-slate-400 italic">Заметок нет.</p>
                    )}
                </div>
            </div>
    );

    return (
        <ModalComponent 
            title={isEditing ? `Редактирование: ${owner.name}` :`Карточка собственника: ${owner.name}`} 
            onClose={onClose}
            footer={renderFooter()}
        >
            {content}
        </ModalComponent>
    );
};

export default OwnerModal;
