
import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useOwnersData } from './hooks/useOwnersData';
import type { Owner, Column, ModalData, DocumentData, AttributeData, AttributeColumn } from './types';
import { ColumnType } from './types';
import ResponsiveDashboard from './components/ResponsiveDashboard';
import { UserPlusIcon, BuildingOfficeIcon, ChartBarIcon, SpinnerIcon, LogOutIcon, UserIcon } from './components/icons/Icons';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/mobile/BottomNav';
import ProfileMenu from './components/mobile/ProfileMenu';
import OfflineIndicator from './components/OfflineIndicator';
import { useIsMobile } from './hooks/useMediaQuery';
import { syncManager } from './services/syncManager';

// Lazy load heavy components
const OwnerModal = lazy(() => import('./components/OwnerModal'));
const DocumentModal = lazy(() => import('./components/DocumentModal'));
const AddColumnModal = lazy(() => import('./components/AddColumnModal'));
const AddOwnerModal = lazy(() => import('./components/AddOwnerModal'));
const AttributeModal = lazy(() => import('./components/AttributeModal'));
const ManagerDashboard = lazy(() => import('./components/manager/ManagerDashboard'));
const Login = lazy(() => import('./components/Login'));

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <SpinnerIcon className="w-8 h-8 animate-spin text-blue-500" />
    <p className="ml-4 text-slate-400">Загрузка...</p>
  </div>
);

const App: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { owners, setOwners, columns, setColumns, loading, error, addOwner, updateOwner, deleteOwner } = useOwnersData();
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'owner', direction: 'asc' });
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (user?.role === 'manager') {
            setActiveTab('projects');
        }
    }, [user?.role]);

    useEffect(() => {
        // Initialize sync manager
        syncManager.initialize();
    }, []);

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

        return (
            <Suspense fallback={<LoadingFallback />}>
                {(() => {
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
                })()}
            </Suspense>
        );
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
            <ResponsiveDashboard
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
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Панель управления собственниками</h1>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-400 mt-1">Обзор документов и данных по всем апартаментам.</p>
                </div>
                {!isMobile && (
                    <div>
                        <button 
                            onClick={() => setIsAddOwnerModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 touch-target"
                        >
                            <UserPlusIcon className="w-5 h-5"/>
                            <span>Добавить собственника</span>
                        </button>
                    </div>
                )}
            </header>
            {isMobile && (
                <div className="mb-4">
                    <button 
                        onClick={() => setIsAddOwnerModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm active:bg-blue-700 touch-target"
                    >
                        <UserPlusIcon className="w-5 h-5"/>
                        <span>Добавить собственника</span>
                    </button>
                </div>
            )}
            <main>
                {renderContent()}
            </main>
            {renderModal()}
            {isAddOwnerModalOpen && (
                <Suspense fallback={<LoadingFallback />}>
                    <AddOwnerModal
                        onClose={() => setIsAddOwnerModalOpen(false)}
                        onAddOwner={handleAddNewOwner}
                    />
                </Suspense>
            )}
            {isAddColumnModalOpen && (
                <Suspense fallback={<LoadingFallback />}>
                    <AddColumnModal
                        onClose={() => setIsAddColumnModalOpen(false)}
                        onAddColumn={handleAddColumn}
                    />
                </Suspense>
            )}
        </>
    );

    if (!isAuthenticated) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <Login />
            </Suspense>
        );
    }

    return (
        <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8 mobile-padding-bottom">
            <OfflineIndicator />
            
            <div className="max-w-full mx-auto">
                {/* Desktop Navigation */}
                {!isMobile && (
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
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors touch-target"
                                title="Выйти"
                            >
                                <LogOutIcon className="w-5 h-5"/>
                                <span className="sr-only">Выйти</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Header */}
                {isMobile && (
                    <div className="mb-4 flex justify-between items-center">
                        <h1 className="text-xl font-bold text-white">
                            {activeTab === 'owners' ? 'Собственники' : 'Проекты'}
                        </h1>
                        <button 
                            onClick={() => setIsProfileMenuOpen(true)} 
                            className="p-2 rounded-lg text-slate-400 active:bg-slate-700 active:text-white transition-colors touch-target"
                            aria-label="Профиль"
                        >
                            <UserIcon className="w-6 h-6"/>
                        </button>
                    </div>
                )}

                {activeTab === 'owners' && user?.role === 'director' && renderOwnersDashboard()}
                {activeTab === 'projects' && (
                    <Suspense fallback={<LoadingFallback />}>
                        <ManagerDashboard />
                    </Suspense>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            {isMobile && user && (
                <BottomNav
                    activeTab={activeTab as 'owners' | 'projects'}
                    onTabChange={setActiveTab}
                    userRole={user.role}
                />
            )}

            {/* Mobile Profile Menu */}
            {isMobile && user && (
                <ProfileMenu
                    isOpen={isProfileMenuOpen}
                    onClose={() => setIsProfileMenuOpen(false)}
                    username={user.username}
                    role={user.role}
                    onLogout={logout}
                />
            )}
        </div>
    );
};

export default App;
