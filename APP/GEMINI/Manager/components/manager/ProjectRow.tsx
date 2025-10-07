
import React, { useState } from 'react';
import type { Project } from '../../types/manager';
import { StatusBadge } from './StatusBadge';
import { FileIcon, LinkIcon } from '../icons/Icons';

interface ProjectRowProps {
    project: Project;
    onRowClick: (project: Project) => void;
    isDragged: boolean;
    onDragStart: (id: string) => void;
    onDrop: (targetId: string) => void;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, onRowClick, isDragged, onDragStart, onDrop }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const isOverdue = new Date(project.deadline) < new Date() && project.status !== 'завершено' && project.status !== 'архив';

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(project.id);
    };

    const rowClasses = [
        'transition-colors',
        isDragged ? 'opacity-30' : 'hover:bg-slate-700/50',
        isDragOver ? 'border-t-2 border-blue-500' : '',
    ].join(' ');

    return (
        <tr
            draggable="true"
            onDragStart={() => onDragStart(project.id)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={rowClasses}
        >
            <td 
                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                onClick={() => onRowClick(project)}
            >
                <div className="text-sm font-medium text-white">{project.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 cursor-pointer" onClick={() => onRowClick(project)}>{project.responsible}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm cursor-pointer ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-300'}`} onClick={() => onRowClick(project)}>
                {formatDate(project.deadline)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onRowClick(project)}>
                <StatusBadge status={project.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onRowClick(project)}>
                <div className="flex flex-wrap items-center gap-1.5">
                    {project.tags && project.tags.length > 0 ? (
                        project.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-500 text-xs">—</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 cursor-pointer" onClick={() => onRowClick(project)}>
                 {!project.attachments || project.attachments.length === 0 ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400">
                        Нет вложений
                    </span>
                ) : (
                    <div className="flex items-center space-x-2">
                        {project.attachments.map(att => {
                            // Display a link icon for attachments with a URL, and a file icon for others.
                            if (att.url) {
                                return (
                                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" title={att.title || att.url}>
                                        <LinkIcon className="w-5 h-5 text-slate-400 hover:text-blue-400" />
                                    </a>
                                );
                            } else if (att.directus_files_id) {
                                return (
                                    <div key={att.id} title={att.directus_files_id.title}>
                                        <FileIcon className="w-5 h-5 text-slate-400" />
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-slate-400 max-w-sm truncate cursor-pointer" onClick={() => onRowClick(project)}>
                {project.notes || '—'}
            </td>
        </tr>
    );
};
