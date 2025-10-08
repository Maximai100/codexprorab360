import React, { useState, useEffect, useRef } from 'react';
import type { Project, ProjectAttachment } from '../../types/manager';
import { ProjectStatus } from '../../types/manager';
import Modal from '../Modal';
import { TrashIcon, XMarkIcon, PlusIcon, FileIcon, LinkIcon, ClockIcon, ArrowUpTrayIcon, SpinnerIcon } from '../icons/Icons';
import * as directusService from '../../services/directus';

interface ProjectDetailModalProps {
    project: Project;
    onClose: () => void;
    onSave: (updatedProject: Project) => void;
    onDelete: (projectId: string) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose, onSave, onDelete }) => {
    // Ensure all required fields are initialized
    const initialProject: Project = {
        ...project,
        history: project.history || [],
        tags: project.tags || [],
        attachments: project.attachments || [],
        notes: project.notes || '',
    };
    
    const [editableProject, setEditableProject] = useState<Project>(initialProject);
    const [newTag, setNewTag] = useState('');
    // Link attachment is not supported by default 'files' M2M, this is left for potential extension
    // const [newLink, setNewLink] = useState({ url: '', name: '' }); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const updatedProject: Project = {
            ...project,
            history: project.history || [],
            tags: project.tags || [],
            attachments: project.attachments || [],
            notes: project.notes || '',
        };
        setEditableProject(updatedProject);
    }, [project]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableProject(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value; // YYYY-MM-DD
        if (date) {
            const currentDeadline = new Date(editableProject.deadline);
            currentDeadline.setFullYear(parseInt(date.substring(0, 4), 10));
            currentDeadline.setMonth(parseInt(date.substring(5, 7), 10) - 1);
            currentDeadline.setDate(parseInt(date.substring(8, 10), 10));
            setEditableProject(prev => ({ ...prev, deadline: currentDeadline.toISOString() }));
        }
    };
    
    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTag.trim() !== '') {
            e.preventDefault();
            if (!(editableProject.tags || []).includes(newTag.trim())) {
                setEditableProject(prev => ({
                    ...prev,
                    tags: [...(prev.tags || []), newTag.trim()],
                }));
            }
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setEditableProject(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
        }));
    };

    const handleRemoveAttachment = (junctionIdToRemove: number) => {
        setEditableProject(prev => ({
            ...prev,
            attachments: (prev.attachments || []).filter(att => att.id !== junctionIdToRemove),
        }));
    };
    
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setIsUploading(true);
                const uploadedFile = await directusService.uploadFile(file);
                // Create the structure that Directus expects for a new M2M item.
                // We create a "fake" junction ID locally, Directus will handle the real one.
                const newAttachment: ProjectAttachment = {
                    id: -1, // Placeholder
                    projects_id: project.id,
                    directus_files_id: uploadedFile
                };
                setEditableProject(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAttachment] }));
            } catch (error) {
                console.error("File upload failed:", error);
                alert("Не удалось загрузить файл.");
            } finally {
                setIsUploading(false);
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleSaveChanges = () => {
        // Before saving, we need to format the attachments to send only the file IDs.
        // Directus M2M updates expect an array of primary keys of the related items.
        // We filter out any non-file attachments to prevent errors.
        const projectToSave = {
            ...editableProject,
            attachments: (editableProject.attachments || [])
                .map(att => att.directus_files_id?.id)
                .filter((id): id is string => !!id)
        };
        onSave(projectToSave as any);
    };
    
    const handleDeleteProject = () => {
      if (window.confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
        onDelete(project.id);
      }
    }
    
    const inputClasses = "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    const footer = (
         <div className="flex justify-between w-full">
            <button
                type="button"
                onClick={handleDeleteProject}
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
            >
                <TrashIcon className="w-4 h-4" />
                Удалить проект
            </button>
            <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="text-white bg-slate-600 hover:bg-slate-700 border border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500 font-medium rounded-lg text-sm px-5 py-2.5">
                    Отмена
                </button>
                <button type="button" onClick={handleSaveChanges} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
                    Сохранить изменения
                </button>
            </div>
        </div>
    );

    return (
        <Modal title="Детали проекта" onClose={onClose} footer={footer}>
            <div className="space-y-6">
                {/* Main details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-white">Название проекта</label>
                        <input type="text" id="name" name="name" value={editableProject.name} onChange={handleInputChange} className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="responsible" className="block mb-2 text-sm font-medium text-white">Ответственный</label>
                        <input type="text" id="responsible" name="responsible" value={editableProject.responsible} onChange={handleInputChange} className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="deadline" className="block mb-2 text-sm font-medium text-white">Дедлайн</label>
                        <input type="date" id="deadline" name="deadline" value={editableProject.deadline ? editableProject.deadline.split('T')[0] : ''} onChange={handleDateChange} className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="status" className="block mb-2 text-sm font-medium text-white">Статус</label>
                        <select id="status" name="status" value={editableProject.status} onChange={handleInputChange} className={inputClasses}>
                            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block mb-2 text-sm font-medium text-white">Теги</label>
                    <div className="flex flex-wrap gap-2 items-center p-2 border border-slate-600 rounded-lg bg-slate-700">
                        {(editableProject.tags || []).map(tag => (
                            <span key={tag} className="flex items-center bg-blue-900 text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-blue-700">
                                    <XMarkIcon className="w-3 h-3"/>
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Добавить тег..."
                            className="bg-transparent focus:outline-none flex-grow text-sm min-w-[100px] text-white"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white">Заметки</label>
                    <textarea id="notes" name="notes" rows={4} value={editableProject.notes} onChange={handleInputChange} className={inputClasses}></textarea>
                </div>
                
                {/* Attachments */}
                 <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">Вложения</h4>
                    {editableProject.attachments.length > 0 && (
                        <ul className="border border-slate-700 rounded-lg divide-y divide-slate-700 mb-4">
                           {editableProject.attachments.map(att => (
                                <li key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-700/50">
                                    <div className="flex items-center min-w-0">
                                        {att.url ? <LinkIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" /> : <FileIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{att.title || att.directus_files_id?.title}</p>
                                            {att.directus_files_id && <p className="text-xs text-slate-400 truncate">{att.directus_files_id.type}, {(att.directus_files_id.filesize / 1024).toFixed(2)} KB</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveAttachment(att.id)} className="ml-2 p-1.5 rounded-full hover:bg-red-900/50 text-slate-400 hover:text-red-400">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                           ))}
                        </ul>
                    )}
                    <div className="space-y-3 p-3 bg-slate-700/50 rounded-lg">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-slate-500 rounded-lg shadow-sm hover:bg-slate-500 disabled:bg-slate-500 disabled:cursor-wait"
                        >
                            {isUploading ? 
                                <>
                                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                                    <span>Загрузка...</span>
                                </>
                                :
                                <>
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    <span>Загрузить файл</span>
                                </>
                             }
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    </div>
                </div>

                {/* History */}
                <div>
                    <h4 className="text-md font-semibold text-slate-200 mb-2">История изменений</h4>
                    {editableProject.history && editableProject.history.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {editableProject.history.map(log => (
                                <li key={log.id} className="flex items-center text-slate-400">
                                    <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {new Date(log.timestamp).toLocaleString('ru-RU')} - <span className="font-medium text-slate-300 mx-1">{log.user}</span> - {log.action}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-400 italic">История изменений пока пуста</p>
                    )}
                </div>

            </div>
        </Modal>
    );
};

export default ProjectDetailModal;