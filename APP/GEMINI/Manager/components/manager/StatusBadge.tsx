import React from 'react';
import { ProjectStatus } from '../../types/manager';

interface StatusBadgeProps {
    status: ProjectStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStatusClasses = () => {
        switch (status) {
            case ProjectStatus.InProgress:
                return 'bg-sky-500/20 text-sky-400';
            case ProjectStatus.Completed:
                return 'bg-green-500/20 text-green-400';
            case ProjectStatus.Archived:
                return 'bg-slate-500/20 text-slate-400';
            default:
                return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses()}`}>
            {status}
        </span>
    );
};