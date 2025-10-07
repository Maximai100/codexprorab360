import React from 'react';
import type { Project } from '../../types/manager';
import { ProjectRow } from './ProjectRow';
import { TableCellsIcon, ArrowUpIcon, ArrowDownIcon } from '../icons/Icons';

export type SortableKey = 'name' | 'responsible' | 'deadline' | 'status';
export type SortDirection = 'asc' | 'desc';
export interface SortConfig {
    key: SortableKey | null;
    direction: SortDirection;
}

interface ProjectTableProps {
    projects: Project[];
    onRowClick: (project: Project) => void;
    sortConfig: SortConfig;
    onSort: (key: SortableKey) => void;
    draggedProjectId: string | null;
    onDragStart: (id: string) => void;
    onDrop: (targetId: string) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onRowClick, sortConfig, onSort, draggedProjectId, onDragStart, onDrop }) => {
    
    const headers: { key: SortableKey | string; label: string; isSortable: boolean }[] = [
        { key: 'name', label: 'ДЕЛО / ПРОЕКТ', isSortable: true },
        { key: 'responsible', label: 'ОТВЕТСТВЕННЫЙ', isSortable: true },
        { key: 'deadline', label: 'ДЕДЛАЙН', isSortable: true },
        { key: 'status', label: 'СТАТУС', isSortable: true },
        { key: 'tags', label: 'ТЕГИ', isSortable: false },
        { key: 'attachments', label: 'ТАБЛИЦА', isSortable: false },
        { key: 'notes', label: 'ПРИМЕЧАНИЯ', isSortable: false },
    ];

    const SortIndicator = ({ columnKey }: { columnKey: SortableKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' 
            ? <ArrowUpIcon className="w-3 h-3 ml-1.5 inline-block" /> 
            : <ArrowDownIcon className="w-3 h-3 ml-1.5 inline-block" />;
    };

    if (projects.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-800 rounded-lg shadow-md">
                <TableCellsIcon className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-2 text-lg font-medium text-white">Проекты не найдены</h3>
                <p className="mt-1 text-sm text-slate-400">Попробуйте изменить фильтры или добавить новый проект.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-800 shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50">
                        <tr>
                             {headers.map(({ key, label, isSortable }) => (
                                <th 
                                    key={key} 
                                    scope="col" 
                                    className={`px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap ${isSortable ? 'cursor-pointer hover:text-slate-200' : ''}`}
                                    onClick={() => isSortable && onSort(key as SortableKey)}
                                >
                                   <div className="flex items-center">
                                     {label}
                                     {isSortable && <SortIndicator columnKey={key as SortableKey} />}
                                   </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {projects.map((project) => (
                            <ProjectRow 
                                key={project.id} 
                                project={project} 
                                onRowClick={onRowClick} 
                                isDragged={draggedProjectId === project.id}
                                onDragStart={onDragStart}
                                onDrop={onDrop}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectTable;