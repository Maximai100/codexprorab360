import React from 'react';
import { ProjectStatus } from '../../types/manager';
import type { AttachmentFilter } from './ManagerDashboard';
import { SearchIcon, FileIcon, LinkIcon, NoneIcon, AtSymbolIcon } from '../icons/Icons';

interface FilterBarProps {
    searchText: string;
    onSearchTextChange: (text: string) => void;
    statusFilter: ProjectStatus | 'all';
    onStatusFilterChange: (status: ProjectStatus | 'all') => void;
    attachmentFilter: AttachmentFilter;
    onAttachmentFilterChange: (filter: AttachmentFilter) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
    searchText, onSearchTextChange,
    statusFilter, onStatusFilterChange,
    attachmentFilter, onAttachmentFilterChange
}) => {
    
    const attachmentButtons: { label: string; value: AttachmentFilter, icon: React.ReactNode }[] = [
        { label: 'Все', value: 'all', icon: <AtSymbolIcon className="w-4 h-4 mr-1.5" /> },
        { label: 'Файл', value: 'file', icon: <FileIcon className="w-4 h-4 mr-1.5" /> },
        { label: 'Ссылка', value: 'link', icon: <LinkIcon className="w-4 h-4 mr-1.5" /> },
        { label: 'Нет', value: 'none', icon: <NoneIcon className="w-4 h-4 mr-1.5" /> },
    ];

    return (
        <div className="mb-6 p-4 bg-slate-800 rounded-lg flex flex-col sm:flex-row items-center gap-4 flex-wrap">
            <div className="relative w-full sm:flex-1 sm:min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Поиск по проекту или ответственному..."
                    value={searchText}
                    onChange={(e) => onSearchTextChange(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                />
            </div>

            <div className="w-full sm:w-auto">
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value as ProjectStatus | 'all')}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                    <option value="all">Все статусы</option>
                    <option value={ProjectStatus.InProgress}>{ProjectStatus.InProgress}</option>
                    <option value={ProjectStatus.Completed}>{ProjectStatus.Completed}</option>
                    <option value={ProjectStatus.Archived}>{ProjectStatus.Archived}</option>
                </select>
            </div>
            
             <div className="w-full sm:w-auto flex items-center bg-slate-700 rounded-lg p-1 space-x-1">
                {attachmentButtons.map(({ label, value, icon }) => (
                     <button
                        key={value}
                        onClick={() => onAttachmentFilterChange(value)}
                        className={`flex items-center justify-center w-full sm:w-auto px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            attachmentFilter === value
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;