
import React, { useState, useEffect } from 'react';
import type { AttributeData, AttributeColumn } from '../types';
import { AttributeType } from '../types';
import Modal from './Modal';
import { TrashIcon, XMarkIcon } from './icons/Icons';

interface AttributeModalProps {
    ownerName: string;
    column: AttributeColumn;
    attributeData: AttributeData;
    onClose: () => void;
    onUpdate: (newData: Partial<AttributeData>) => void;
}

const AttributeModal: React.FC<AttributeModalProps> = ({ ownerName, column, attributeData, onClose, onUpdate }) => {
    // FIX: Manage the state as a string to be compatible with input elements.
    // The initial value could be string, number, boolean, or null. We convert it to a string for editing.
    const [value, setValue] = useState('');

    useEffect(() => {
        const initialValue = attributeData?.value;
        setValue(initialValue === null || initialValue === undefined ? '' : String(initialValue));
    }, [attributeData]);

    const handleSave = () => {
        if (value === '') {
            onUpdate({ value: null });
        } else {
            // Convert the string value back to the appropriate type before updating.
            const newValue = column.attributeType === AttributeType.NUMBER ? Number(value) : value;
            onUpdate({ value: newValue });
        }
        onClose();
    };
    
    const handleClear = () => {
        onUpdate({ value: null });
        onClose();
    }

    const renderInput = () => {
        const commonProps = {
            id: "attributeValue",
            value: value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
            className: "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        };

        switch (column.attributeType) {
            case AttributeType.NUMBER:
                return <input type="number" {...commonProps} />;
            case AttributeType.DATE: {
                // Ensure value is in 'YYYY-MM-DD' format for date input
                const dateValue = typeof value === 'string' ? value.split('T')[0] : '';
                return (
                    <div className="relative">
                        <input type="date" {...commonProps} value={dateValue} className={`${commonProps.className} pr-8`} />
                        {value && (
                            <button
                                type="button"
                                onClick={() => setValue('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200"
                                aria-label="Очистить дату"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                );
            }
            case AttributeType.LINK:
                 return <input type="url" {...commonProps} placeholder="https://example.com" />;
            // Add cases for CHECKBOX, SELECT later if needed
            case AttributeType.TEXT:
            default:
                return <input type="text" {...commonProps} />;
        }
    };
    
    const footer = (
        <div className="flex justify-between w-full">
            <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
            >
                <TrashIcon className="w-4 h-4" />
                Очистить значение
            </button>
            <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                    Отмена
                </button>
                <button type="button" onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
                    Сохранить
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            title={`Редактирование: ${column.name}`}
            onClose={onClose}
            footer={footer}
        >
            <p className="text-sm text-slate-400 mb-4">Собственник: <span className="font-medium text-slate-300">{ownerName}</span></p>
            <div>
                <label htmlFor="attributeValue" className="block mb-2 text-sm font-medium text-white">{column.name}</label>
                {renderInput()}
            </div>
        </Modal>
    );
};

export default AttributeModal;
