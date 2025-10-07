import React from 'react';
import type { Owner, Column, ModalData, DocumentData, AttributeData } from '../types';
import { ColumnType } from '../types';
import { DocumentCell } from './DocumentCell';
import { PlusIcon, TableCellsIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';

interface DashboardProps {
    owners: Owner[];
    columns: Column[];
    onCellClick: (data: ModalData) => void;
    onAddColumn: () => void;
    onDeleteColumn: (columnId: string) => void;
    sortConfig: { key: string | null; direction: 'asc' | 'desc' };
    onSort: (columnId: string) => void;
}

const AttributeCell: React.FC<{ data: AttributeData }> = ({ data }) => {
    const value = data?.value;
    const displayValue = (value === null || value === undefined || value === '') ? '—' : String(value);

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-300">{displayValue}</span>
        </div>
    );
};

const OwnerCell: React.FC<{ owner: Owner }> = ({ owner }) => {
    return (
        <div className="font-medium text-white cursor-pointer hover:text-blue-400 transition-colors">
            {owner.name}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ owners, columns, onCellClick, onAddColumn, onDeleteColumn, sortConfig, onSort }) => {
    
    const SortIndicator = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' 
            ? <ArrowUpIcon className="w-3 h-3 ml-1.5 inline-block" /> 
            : <ArrowDownIcon className="w-3 h-3 ml-1.5 inline-block" />;
    };

    if (owners.length === 0) {
      return (
        <div className="text-center py-16 bg-slate-800 rounded-lg shadow-md">
          <TableCellsIcon className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-2 text-lg font-medium text-white">Нет данных о собственниках</h3>
          <p className="mt-1 text-sm text-slate-400">Начните с добавления информации о собственнике.</p>
        </div>
      )
    }

    return (
        <div className="bg-slate-800 shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700">
                        <tr>
                            {columns.map((col) => (
                                <th 
                                    key={col.id} 
                                    scope="col" 
                                    className="group relative px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-200"
                                    onClick={() => onSort(col.id)}
                                >
                                    <div className="flex items-center">
                                        {col.name}
                                        <SortIndicator columnKey={col.id} />
                                        {col.id !== 'owner' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteColumn(col.id); }}
                                                className="absolute top-1/2 right-1 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-red-900/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                                                title={`Удалить колонку "${col.name}"`}
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                                <span className="sr-only">Удалить колонку</span>
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-3">
                                <button
                                    onClick={onAddColumn}
                                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Колонка</span>
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {owners.map((owner) => (
                            <tr key={owner.id} className="hover:bg-slate-700/50 transition-colors">
                                {columns.map((col) => {
                                    const cellData = owner.data[col.id];
                                    const isClickable = col.type === ColumnType.DOCUMENT || col.type === ColumnType.ATTRIBUTE || col.type === ColumnType.OWNER;
                                    return (
                                        <td 
                                            key={`${owner.id}-${col.id}`} 
                                            className={`px-6 py-4 whitespace-nowrap ${isClickable ? 'cursor-pointer' : ''}`} 
                                            onClick={() => {
                                                if (!isClickable) return;
                                                if (col.type === ColumnType.OWNER) {
                                                    onCellClick({ type: 'owner', id: owner.id });
                                                } else if (col.type === ColumnType.DOCUMENT) {
                                                    onCellClick({ type: 'document', ownerId: owner.id, columnId: col.id });
                                                } else if (col.type === ColumnType.ATTRIBUTE) {
                                                    onCellClick({ type: 'attribute', ownerId: owner.id, columnId: col.id });
                                                }
                                            }}
                                        >
                                            {col.type === ColumnType.OWNER && <OwnerCell owner={owner} />}
                                            {col.type === ColumnType.DOCUMENT && <DocumentCell data={cellData as DocumentData} />}
                                            {col.type === ColumnType.ATTRIBUTE && <AttributeCell data={cellData as AttributeData} />}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {/* Action space for each row if needed */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
