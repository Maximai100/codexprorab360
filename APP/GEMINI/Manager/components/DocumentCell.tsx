
import React from 'react';
import type { DocumentData, DocumentStatus } from '../types';
import { FileIcon, ClockIcon } from './icons/Icons';

interface DocumentCellProps {
    data: DocumentData;
}

const getStatusBadgeClass = (status: DocumentStatus): string => {
    switch (status) {
        case 'Есть':
            return 'bg-green-500/20 text-green-300';
        case 'Скоро истекает':
            return 'bg-yellow-500/20 text-yellow-300';
        case 'Истек':
            return 'bg-red-500/20 text-red-300';
        case 'Нет':
            return 'bg-red-500/20 text-red-300';
        default:
            return 'bg-slate-700 text-slate-300';
    }
};

export const DocumentCell: React.FC<DocumentCellProps> = ({ data }) => {
    if (!data) return <div className="text-sm text-slate-400">—</div>;
    
    return (
        <div className="flex items-center space-x-3 cursor-pointer group">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(data.status)}`}>
                {data.status}
            </span>
            <div className="flex-grow flex flex-col">
                {data.signingDate && (
                    <span className="text-xs text-slate-400">Подписан: {data.signingDate}</span>
                )}
                {data.expirationDate && (
                     <span className={`text-xs ${data.status === 'Истек' || data.status === 'Скоро истекает' ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                        Истекает: {data.expirationDate}
                    </span>
                )}
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {data.versions && data.versions.length > 0 && (
                     <div className="relative" title={`${data.versions.length} версия(ий)`}>
                        <FileIcon className="w-5 h-5 text-slate-500" />
                        <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-3.5 h-3.5 text-white bg-blue-500 rounded-full text-[10px]">
                            {data.versions.length}
                        </span>
                    </div>
                )}
                {data.notes && (
                    <div title={data.notes}>
                        <ClockIcon className="w-5 h-5 text-slate-500"/>
                    </div>
                )}
            </div>
        </div>
    );
};