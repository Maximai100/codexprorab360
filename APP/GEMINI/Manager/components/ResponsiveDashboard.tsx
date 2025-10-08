import React from 'react';
import type { Owner, Column, ModalData } from '../types';
import Dashboard from './Dashboard';
import OwnerCard from './mobile/OwnerCard';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PlusIcon, TableCellsIcon } from './icons/Icons';

interface ResponsiveDashboardProps {
    owners: Owner[];
    columns: Column[];
    onCellClick: (data: ModalData) => void;
    onAddColumn: () => void;
    onDeleteColumn: (columnId: string) => void;
    sortConfig: { key: string | null; direction: 'asc' | 'desc' };
    onSort: (columnId: string) => void;
}

const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = (props) => {
    const isMobile = useIsMobile();
    const { owners, onCellClick } = props;

    if (!isMobile) {
        return <Dashboard {...props} />;
    }

    // Mobile card view
    if (owners.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-800 rounded-lg shadow-md">
                <TableCellsIcon className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-2 text-lg font-medium text-white">Нет данных о собственниках</h3>
                <p className="mt-1 text-sm text-slate-400">Начните с добавления информации о собственнике.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-20">
            {owners.map((owner) => (
                <OwnerCard
                    key={owner.id}
                    owner={owner}
                    onTap={() => onCellClick({ type: 'owner', id: owner.id })}
                />
            ))}
        </div>
    );
};

export default ResponsiveDashboard;
