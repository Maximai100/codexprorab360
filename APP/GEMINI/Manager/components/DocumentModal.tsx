
import React, { useState, useEffect } from 'react';
import type { DocumentData, DocumentStatus } from '../types';
import Modal from './Modal';
import { DocumentDuplicateIcon, ArrowDownTrayIcon, ClockIcon, PaperClipIcon, PencilIcon, PlusIcon, XMarkIcon } from './icons/Icons';

interface DocumentModalProps {
    ownerName: string;
    documentName: string;
    documentData: DocumentData;
    onClose: () => void;
    onUpdate: (newData: Partial<DocumentData>) => void;
}

const documentStatuses: DocumentStatus[] = ['Есть', 'Нет', 'Истек', 'Скоро истекает'];

const DocumentModal: React.FC<DocumentModalProps> = ({ ownerName, documentName, documentData, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState<DocumentData>(documentData);

    useEffect(() => {
        setEditableData(documentData);
    }, [documentData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableData(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
    };

    const handleSave = () => {
        onUpdate(editableData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableData(documentData);
        setIsEditing(false);
    };

    const handleUploadVersion = () => {
        const newVersion = {
            id: `v${Date.now()}`,
            version: (editableData.versions?.length || 0) + 1,
            fileName: `Новый_файл_${new Date().toLocaleDateString()}.pdf`,
            uploadDate: new Date().toISOString().split('T')[0],
            fileUrl: '#',
        };
        setEditableData(prev => ({...prev, versions: [...(prev.versions || []), newVersion]}));
    };

    const renderFooter = () => {
        if (isEditing) {
            return (
                <div className="flex items-center justify-end space-x-2 w-full">
                    <button type="button" onClick={handleCancel} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                        Отмена
                    </button>
                    <button type="button" onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
                        Сохранить
                    </button>
                </div>
            )
        }
        return (
            <div className="flex items-center justify-end space-x-2 w-full">
                <button type="button" onClick={onClose} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                    Закрыть
                </button>
                 <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
                    <PencilIcon className="w-4 h-4" />
                    Редактировать
                </button>
            </div>
        );
    }

    const inputClasses = "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    
    return (
        <Modal 
            title={isEditing ? `Редактирование: ${documentName}` : `${documentName} / ${ownerName}`} 
            onClose={onClose}
            footer={renderFooter()}
        >
            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">Статус и даты</h4>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="status" className="block mb-2 text-sm font-medium text-white">Статус</label>
                                <select id="status" name="status" value={editableData.status} onChange={handleInputChange} className={inputClasses}>
                                    {documentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="signingDate" className="block mb-2 text-sm font-medium text-white">Дата подписания</label>
                                <div className="relative">
                                    <input type="date" id="signingDate" name="signingDate" value={editableData.signingDate || ''} onChange={handleInputChange} className={`${inputClasses} pr-8`} />
                                    {editableData.signingDate && (
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange({ target: { name: 'signingDate', value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200"
                                            aria-label="Очистить дату подписания"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="expirationDate" className="block mb-2 text-sm font-medium text-white">Дата окончания</label>
                                <div className="relative">
                                    <input type="date" id="expirationDate" name="expirationDate" value={editableData.expirationDate || ''} onChange={handleInputChange} className={`${inputClasses} pr-8`} />
                                    {editableData.expirationDate && (
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange({ target: { name: 'expirationDate', value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200"
                                            aria-label="Очистить дату окончания"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-700/50 p-3 rounded-lg md:col-span-2">
                                <label className="block text-xs text-slate-400">Статус</label>
                                <p className="font-medium text-slate-200">{documentData.status}</p>
                            </div>
                            <div className="bg-slate-700/50 p-3 rounded-lg">
                                <label className="block text-xs text-slate-400">Дата подписания</label>
                                <p className="font-medium text-slate-200">{documentData.signingDate || '—'}</p>
                            </div>
                            <div className="bg-slate-700/50 p-3 rounded-lg">
                                <label className="block text-xs text-slate-400">Дата окончания</label>
                                <p className="font-medium text-slate-200">{documentData.expirationDate || '—'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-semibold text-slate-200">Версии документа</h4>
                        {isEditing && (
                            <button onClick={handleUploadVersion} type="button" className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
                                <PlusIcon className="w-4 h-4"/>
                                Добавить версию
                            </button>
                        )}
                    </div>
                    {(editableData.versions || []).length > 0 ? (
                        <ul className="border border-slate-700 rounded-lg divide-y divide-slate-700">
                            {editableData.versions.map(v => (
                                <li key={v.id} className="p-3 flex items-center justify-between hover:bg-slate-700/50">
                                    <div className="flex items-center min-w-0">
                                        <PaperClipIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{v.fileName}</p>
                                            <p className="text-xs text-slate-400">Версия {v.version}, загружен {v.uploadDate}</p>
                                        </div>
                                    </div>
                                    <a href={v.fileUrl} download className="p-2 rounded-md hover:bg-slate-600 ml-2 flex-shrink-0">
                                        <ArrowDownTrayIcon className="w-5 h-5 text-slate-400" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-slate-600 rounded-lg">
                            <DocumentDuplicateIcon className="mx-auto h-10 w-10 text-slate-400"/>
                            <p className="mt-2 text-sm font-medium text-slate-300">Файлы не загружены</p>
                            <p className="text-xs text-slate-400">Загрузите первую версию документа.</p>
                        </div>
                    )}
                </div>

                 <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">История и примечания</h4>
                     {isEditing ? (
                         <textarea id="notes" name="notes" rows={3} value={editableData.notes || ''} onChange={handleInputChange} className={inputClasses} placeholder="Добавьте примечание..."></textarea>
                    ) : (
                        documentData.notes ? (
                             <div className="flex items-start bg-slate-700/50 p-3 rounded-lg">
                               <ClockIcon className="w-4 h-4 mr-3 mt-1 text-slate-400 flex-shrink-0" />
                               <p className="text-sm text-slate-300 whitespace-pre-wrap">{documentData.notes}</p>
                            </div>
                        ) : <p className="text-sm text-slate-400 italic">Примечаний нет.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default DocumentModal;
