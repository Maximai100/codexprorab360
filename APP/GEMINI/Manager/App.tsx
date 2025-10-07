
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useOwnersData } from './hooks/useOwnersData';
import type { Owner, Column, ModalData, DocumentData, AttributeData, AttributeColumn } from './types';
import { ColumnType } from './types';
import Dashboard from './components/Dashboard';
import OwnerModal from './components/OwnerModal';
import DocumentModal from './components/DocumentModal';
import AddColumnModal from './components/AddColumnModal';
import AddOwnerModal from './components/AddOwnerModal';
import AttributeModal from './components/AttributeModal';
import { UserPlusIcon, BuildingOfficeIcon, ChartBarIcon, SpinnerIcon, LogOutIcon } from './components/icons/Icons';
import ManagerDashboard from './components/manager/ManagerDashboard';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';

const App: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { owners, setOwners, columns, setColumns, loading, error, addOwner, updateOwner, deleteOwner } = useOwnersData();
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'owner', direction: 'asc' });

    useEffect(() => {
        if (user?.role === 'manager') {
            setActiveTab('projects');
        }
    }, [user?.role]);

    const handleSort = (columnId: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === columnId && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: columnId, direction });
    };

    const sortedOwners = useMemo(() => {
        if (!sortConfig.key) {
            return owners;
        }

        const sorted = [...owners].sort((a, b) => {
            const column = columns.find(c => c.id === sortConfig.key);
            if (!column) return 0;

            let aValue: any;
            let bValue: any;

            if (column.type === ColumnType.OWNER) {
                aValue = a.name;
                bValue = b.name;
            } else {
                const aData = a.data[sortConfig.key!];
                const bData = b.data[sortConfig.key!];
                
                if (!aData) return 1;
                if (!bData) return -1;

                if (column.type === ColumnType.ATTRIBUTE) {
                    aValue = (aData as AttributeData).value;
                    bValue = (bData as AttributeData).value;
                } else if (column.type === ColumnType.DOCUMENT) {
                    aValue = (aData as DocumentData).status;
                    bValue = (bData as DocumentData).status;
                }
            }

            if (aValue === null || aValue === undefined || aValue === '') return 1;
            if (bValue === null || bValue === undefined || bValue === '') return -1;
            
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [owners, columns, sortConfig]);

    const handleAddColumn = useCallback((newColumn: Column) => {
        setColumns(prev => [...prev, newColumn]);
        // This logic would need to be adapted for a real backend, 
        // likely involving batch updates or a dedicated API endpoint.
        // For now, it updates the local state optimistically.
        setOwners(prevOwners => prevOwners.map(owner => ({
            ...owner,
            data: {
                ...owner.data,
                [newColumn.id]: newColumn.type === ColumnType.DOCUMENT ? {
                    status: 'Нет',
                    versions: [],
                    notes: '',
                } : { value: '' }
            }
        })));
        setIsAddColumnModalOpen(false);
    }, [setColumns, setOwners]);

    const handleDeleteColumn = (columnId: string) => {
        const columnToDelete = columns.find(c => c.id === columnId);
        if (!columnToDelete) return;

        if (window.confirm(`Вы уверены, что хотите удалить колонку "${columnToDelete.name}"? Все связанные с ней данные будут безвозвратно утеряны.`)) {
            setColumns(prev => prev.filter(col => col.id !== columnId));
            // Again, backend logic would be needed here.
            setOwners(prevOwners => prevOwners.map(owner => {
                const newData = { ...owner.data };
                delete newData[columnId];
                return {
                    ...owner,
                    data: newData
                };
            }));
        }
    };

    const handleAddNewOwner = useCallback(async (newOwnerData: Omit<Owner, 'id' | 'data'>) => {
        const newOwner: Omit<Owner, 'id'> = {
            ...newOwnerData,
            data: columns.reduce((acc, col) => {
                if (col.type === ColumnType.OWNER) return acc;
                acc[col.id] = col.type === ColumnType.DOCUMENT 
                    ? { status: 'Нет', versions: [], notes: '' }
                    : { value: '' };
                return acc;
            }, {} as Owner['data'])
        };
        await addOwner(newOwner);
        setIsAddOwnerModalOpen(false);
    }, [columns, addOwner]);

    const handleUpdateOwner = async (updatedOwner: Owner) => {
        await updateOwner(updatedOwner.id, updatedOwner);
        setModalData(null);
    };

    const handleDeleteOwner = async (ownerId: string) => {
        await deleteOwner(ownerId);
        setModalData(null);
    };
    
    const handleUpdateOwnerData = (ownerId: string, columnId: string, newData: any) => {
        const ownerToUpdate = owners.find(o => o.id === ownerId);
        if (ownerToUpdate) {
            const updatedData = {
                ...ownerToUpdate.data,
                [columnId]: {
                    ...ownerToUpdate.data[columnId],
                    ...newData,
                }
            };
            updateOwner(ownerId, { data: updatedData });
        }
    };

    const renderModal = () => {
        if (!modalData) return null;

        const owner = owners.find(o => o.id === (modalData as any).ownerId || o.id === (modalData as any).id);
        if (!owner) return null;

        switch (modalData.type) {
            case 'owner':
                return <OwnerModal 
                    owner={owner} 
                    onClose={() => setModalData(null)}
                    onUpdate={handleUpdateOwner}
                    onDelete={handleDeleteOwner}
                />;
            case 'document': {
                const docColumn = columns.find(c => c.id === modalData.columnId);
                if (docColumn && docColumn.type === ColumnType.DOCUMENT) {
                    const documentData = owner.data[modalData.columnId] as DocumentData;
                    if (documentData && 'status' in documentData) {
                        return (
                            <DocumentModal
                                ownerName={owner.name}
                                documentName={docColumn.name}
                                documentData={documentData}
                                onClose={() => setModalData(null)}
                                onUpdate={(newData) => handleUpdateOwnerData(modalData.ownerId, modalData.columnId, newData)}
                            />
                        );
                    }
                }
                return null;
            }
            case 'attribute': {
                const attrColumn = columns.find(c => c.id === modalData.columnId);
                 if (attrColumn && attrColumn.type === ColumnType.ATTRIBUTE) {
                    const attributeData = owner.data[modalData.columnId] as AttributeData;
                    return (
                        <AttributeModal
                            ownerName={owner.name}
                            column={attrColumn as AttributeColumn}
                            attributeData={attributeData}
                            onClose={() => setModalData(null)}
                            onUpdate={(newData) => handleUpdateOwnerData(modalData.ownerId, modalData.columnId, newData)}
                        />
                    );
                }
                return null;
            }
            default:
                return null;
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="ml-4 text-slate-400">Загрузка данных...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-16 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="text-lg font-medium text-red-400">Ошибка при загрузке данных</h3>
                    <p className="mt-1 text-sm text-slate-400">{error}</p>
                    <p className="mt-2 text-xs text-slate-500">Убедитесь, что Directus запущен и конфигурация в `config.ts` верна.</p>
                </div>
            );
        }

        return (
            <Dashboard
                owners={sortedOwners}
                columns={columns}
                onCellClick={setModalData}
                onAddColumn={() => setIsAddColumnModalOpen(true)}
                onDeleteColumn={handleDeleteColumn}
                sortConfig={sortConfig}
                onSort={handleSort}
            />
        );
    };


    const renderOwnersDashboard = () => (
        <>
            <header className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Панель управления собственниками</h1>
                    <p className="text-sm sm:text-base text-slate-400">Обзор документов и данных по всем апартаментам.</p>
                </div>
                <div>
                    <button 
                        onClick={() => setIsAddOwnerModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                    >
                        <UserPlusIcon className="w-5 h-5"/>
                        <span>Добавить собственника</span>
                    </button>
                </div>
            </header>
            <main>
                {renderContent()}
            </main>
            {renderModal()}
            {isAddOwnerModalOpen && (
                <AddOwnerModal
                    onClose={() => setIsAddOwnerModalOpen(false)}
                    onAddOwner={handleAddNewOwner}
                />
            )}
            {isAddColumnModalOpen && (
                <AddColumnModal
                    onClose={() => setIsAddColumnModalOpen(false)}
                    onAddColumn={handleAddColumn}
                />
            )}
        </>
    );

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-full mx-auto">
                <div className="mb-6 border-b border-slate-700 flex justify-between items-center">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {user?.role === 'director' && (
                             <button
                                onClick={() => setActiveTab('owners')}
                                className={`${
                                    activeTab === 'owners'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                <BuildingOfficeIcon className="mr-3 h-5 w-5" />
                                <span>Собственники</span>
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`${
                                activeTab === 'projects'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                            } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            <ChartBarIcon className="mr-3 h-5 w-5" />
                            <span>Проекты</span>
                        </button>
                    </nav>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                           <div className="text-sm font-medium text-white">{user?.username}</div>
                           <div className="text-xs text-slate-400">{user?.role === 'director' ? 'Руководитель' : 'Менеджер'}</div>
                        </div>
                        <button 
                            onClick={logout} 
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Выйти"
                        >
                            <LogOutIcon className="w-5 h-5"/>
                            <span className="sr-only">Выйти</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'owners' && user?.role === 'director' && renderOwnersDashboard()}
                {activeTab === 'projects' && <ManagerDashboard />}
            </div>
        </div>
    );
};

export default App;
