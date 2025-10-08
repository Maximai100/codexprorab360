
import React, { useState } from 'react';
import Modal from './Modal';
import type { Owner, ContactMethod } from '../types';
import { PlusIcon, XMarkIcon } from './icons/Icons';

interface AddOwnerModalProps {
    onClose: () => void;
    onAddOwner: (newOwner: Omit<Owner, 'id' | 'data'>) => void;
}

const initialOwnerState: Omit<Owner, 'id' | 'data'> = {
    name: '',
    contact: [{ id: `c${Date.now()}`, type: 'Телефон', value: '' }],
    apartments: [],
    notes: '',
};

const AddOwnerModal: React.FC<AddOwnerModalProps> = ({ onClose, onAddOwner }) => {
    const [newOwner, setNewOwner] = useState(initialOwnerState);
    const [apartmentsInput, setApartmentsInput] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewOwner(prev => ({ ...prev, [name]: value }));
    };
    
    const handleApartmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApartmentsInput(e.target.value);
    };

    const handleContactChange = (index: number, field: 'type' | 'value', value: string) => {
        const updatedContacts = [...(newOwner.contact || [])];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };
        setNewOwner(prev => ({ ...prev, contact: updatedContacts }));
    };

    const addContactField = () => {
        setNewOwner(prev => ({
            ...prev,
            contact: [...(prev.contact || []), { id: `c${Date.now()}`, type: '', value: '' }]
        }));
    };

    const removeContactField = (id: string) => {
        setNewOwner(prev => ({
            ...prev,
            contact: (prev.contact || []).filter(c => c.id !== id)
        }));
    };

    const handleAdd = () => {
        if (!newOwner.name.trim()) return;

        const ownerData = {
            ...newOwner,
            apartments: apartmentsInput.split(',').map(s => s.trim()).filter(Boolean),
            contact: (newOwner.contact || []).filter(c => c.type.trim() !== '' && c.value.trim() !== ''),
        };

        onAddOwner(ownerData);
    };
    
    const inputClasses = "bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <Modal 
            title="Добавление нового собственника" 
            onClose={onClose}
            footer={
                <div className="flex space-x-2">
                    <button type="button" onClick={onClose} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!newOwner.name.trim()}
                        className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-500 disabled:cursor-not-allowed"
                    >
                        Добавить собственника
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-white">ФИО / Название организации</label>
                    <input type="text" id="name" name="name" value={newOwner.name} onChange={handleInputChange} className={inputClasses} placeholder="Иванов Иван Иванович" required />
                </div>
                
                <div>
                     <label className="block mb-2 text-sm font-medium text-white">Контактная информация</label>
                     <div className="space-y-2">
                        {(newOwner.contact || []).map((contact, index) => (
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
                                {newOwner.contact.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeContactField(contact.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 rounded-full hover:bg-red-900/50"
                                        aria-label="Удалить контакт"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                )}
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
                </div>

                 <div>
                    <label htmlFor="apartments" className="block mb-2 text-sm font-medium text-white">Апартаменты</label>
                    <input type="text" id="apartments" name="apartments" value={apartmentsInput} onChange={handleApartmentsChange} className={inputClasses} placeholder="A-101, B-205 (через запятую)" />
                </div>
                <div>
                    <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white">Заметки</label>
                    <textarea id="notes" name="notes" rows={3} value={newOwner.notes} onChange={handleInputChange} className={inputClasses} placeholder="Любая дополнительная информация..."></textarea>
                </div>
            </div>
        </Modal>
    );
};

export default AddOwnerModal;
