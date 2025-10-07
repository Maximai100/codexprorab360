
import React, { useState } from 'react';
import Modal from './Modal';
import type { Column } from '../types';
import { ColumnType, AttributeType } from '../types';
import { DocumentTextIcon, TagIcon, CalculatorIcon, ArrowRightIcon } from './icons/Icons';

interface AddColumnModalProps {
    onClose: () => void;
    onAddColumn: (newColumn: Column) => void;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ onClose, onAddColumn }) => {
    const [step, setStep] = useState(1);
    // FIX: Narrow down the columnType to only types that can be created from this modal.
    // This resolves the TypeScript error where ColumnType could be 'CALCULATED' which is not part of the `Column` union type.
    const [columnType, setColumnType] = useState<ColumnType.DOCUMENT | ColumnType.ATTRIBUTE | null>(null);
    const [columnName, setColumnName] = useState('');
    const [isDocumentRequired, setIsDocumentRequired] = useState(false);
    const [trackExpiration, setTrackExpiration] = useState(false);
    
    const handleNext = () => {
        if (columnType) setStep(2);
    };

    const handleAdd = () => {
        if (!columnName.trim() || !columnType) return;

        const newColumn: Column = {
            id: `col-${Date.now()}`,
            name: columnName.trim(),
            type: columnType,
            ...(columnType === ColumnType.DOCUMENT && { required: isDocumentRequired, trackExpiration: trackExpiration }),
            ...(columnType === ColumnType.ATTRIBUTE && { attributeType: AttributeType.TEXT }), // Default to TEXT
        };
        onAddColumn(newColumn);
    };
    
    const renderStep1 = () => (
        <div>
            <h4 className="text-md font-semibold text-slate-200 mb-4">1. Выберите тип колонки</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setColumnType(ColumnType.DOCUMENT)} className={`p-4 border rounded-lg text-center transition-all ${columnType === ColumnType.DOCUMENT ? 'border-blue-500 bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-600 hover:border-blue-500'}`}>
                    <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <span className="font-semibold text-sm text-white">Документ</span>
                    <p className="text-xs text-slate-400 mt-1">Отслеживание файлов, статусов и сроков.</p>
                </button>
                <button onClick={() => setColumnType(ColumnType.ATTRIBUTE)} className={`p-4 border rounded-lg text-center transition-all ${columnType === ColumnType.ATTRIBUTE ? 'border-green-500 bg-green-900/50 ring-2 ring-green-500' : 'border-slate-600 hover:border-green-500'}`}>
                    <TagIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <span className="font-semibold text-sm text-white">Атрибут</span>
                    <p className="text-xs text-slate-400 mt-1">Текст, число, дата или другой тип данных.</p>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div>
            <h4 className="text-md font-semibold text-slate-200 mb-4">2. Задайте параметры</h4>
            <div className="space-y-4">
                <div>
                    <label htmlFor="columnName" className="block mb-2 text-sm font-medium text-white">Название колонки</label>
                    <input
                        type="text"
                        id="columnName"
                        value={columnName}
                        onChange={(e) => setColumnName(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholder="Например, 'Доверенность'"
                        required
                    />
                </div>
                {columnType === ColumnType.DOCUMENT && (
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                        <label className="flex items-center">
                            <input type="checkbox" checked={isDocumentRequired} onChange={(e) => setIsDocumentRequired(e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-600 ring-offset-slate-800 focus:ring-2"/>
                            <span className="ms-2 text-sm font-medium text-slate-300">Обязательность</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" checked={trackExpiration} onChange={(e) => setTrackExpiration(e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-600 ring-offset-slate-800 focus:ring-2"/>
                            <span className="ms-2 text-sm font-medium text-slate-300">Отслеживать срок действия</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );

    const footerContent = () => {
        if (step === 1) {
            return (
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!columnType}
                    className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-500 disabled:cursor-not-allowed"
                >
                    Далее <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
            );
        }
        if (step === 2) {
            return (
                <>
                    <button type="button" onClick={() => setStep(1)} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                        Назад
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!columnName.trim()}
                        className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-500 disabled:cursor-not-allowed"
                    >
                        Добавить колонку
                    </button>
                </>
            );
        }
    };

    return (
        <Modal title="Мастер создания новой колонки" onClose={onClose} footer={<div className="flex space-x-2">{footerContent()}</div>}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
        </Modal>
    );
};

export default AddColumnModal;
