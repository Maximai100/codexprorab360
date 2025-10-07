import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useProjectData } from '../../hooks/useProjectData';
import type { Project } from '../../types/manager';
import { ProjectStatus } from '../../types/manager';
import Header from './Header';
import FilterBar from './FilterBar';
import ProjectTable from './ProjectTable';
import type { SortConfig, SortableKey } from './ProjectTable';
import ProjectDetailModal from './ProjectDetailModal';
import { SpinnerIcon } from '../icons/Icons';

export type AttachmentFilter = 'all' | 'file' | 'link' | 'none';

const ManagerDashboard: React.FC = () => {
    const { 
        projects, 
        projectOrder, 
        setProjectOrder, 
        loading, 
        error, 
        addProject, 
        updateProject, 
        deleteProject 
    } = useProjectData();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    const [searchText, setSearchText] = useState(() => localStorage.getItem('projectSearchText') || '');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>(() => (localStorage.getItem('projectStatusFilter') as ProjectStatus | 'all') || 'all');
    const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>(() => (localStorage.getItem('projectAttachmentFilter') as AttachmentFilter) || 'all');
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        const savedSortConfig = localStorage.getItem('projectSortConfig');
        return savedSortConfig ? JSON.parse(savedSortConfig) : { key: 'deadline', direction: 'asc' };
    });

    const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('projectSearchText', searchText);
        localStorage.setItem('projectStatusFilter', statusFilter);
        localStorage.setItem('projectAttachmentFilter', attachmentFilter);
        localStorage.setItem('projectSortConfig', JSON.stringify(sortConfig));
    }, [searchText, statusFilter, attachmentFilter, sortConfig]);


    const filteredAndSortedProjects = useMemo(() => {
        const projectMap = new Map(projects.map(p => [p.id, p]));
        
        let orderedProjects = projectOrder.map(id => projectMap.get(id)).filter((p): p is Project => p !== undefined);

        // Add any new projects that might not be in the order list yet
        const orderedProjectIds = new Set(orderedProjects.map(p => p.id));
        projects.forEach(p => {
            if (!orderedProjectIds.has(p.id)) {
                orderedProjects.push(p);
            }
        });

        let filtered = [...orderedProjects];

        if (searchText) {
            const lowercasedFilter = searchText.toLowerCase();
            filtered = filtered.filter(project =>
                project.name.toLowerCase().includes(lowercasedFilter) ||
                project.responsible.toLowerCase().includes(lowercasedFilter) ||
                (project.tags && project.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter)))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(project => project.status === statusFilter);
        }

        if (attachmentFilter !== 'all') {
            filtered = filtered.filter(project => {
                const hasAttachments = project.attachments && project.attachments.length > 0;
                switch (attachmentFilter) {
                    case 'file': return project.attachments?.some(att => att.directus_files_id) || false;
                    case 'link': return project.attachments?.some(att => att.url) || false; 
                    case 'none': return !hasAttachments;
                    default: return true;
                }
            });
        }
        
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [projects, searchText, statusFilter, attachmentFilter, sortConfig, projectOrder]);

    const handleSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleNewProject = async () => {
        const newProjectData: Omit<Project, 'id'> = {
            name: 'Новый проект',
            responsible: 'Не назначен',
            deadline: new Date().toISOString(),
            status: ProjectStatus.InProgress,
            attachments: [],
            notes: '',
            history: [],
            tags: [],
        };
        const createdProject = await addProject(newProjectData);
        if (createdProject) {
            setSelectedProject(createdProject);
        }
    };

    const handleSaveProject = async (updatedProject: Project) => {
        const { id, ...dataToUpdate } = updatedProject;
        await updateProject(id, dataToUpdate);
        setSelectedProject(null);
    };
    
    const handleDeleteProject = async (projectId: string) => {
        await deleteProject(projectId);
        setSelectedProject(null);
    }

    const handleDragStart = useCallback((id: string) => {
        setDraggedProjectId(id);
    }, []);

    const handleDrop = useCallback((targetId: string) => {
        if (!draggedProjectId) return;

        const currentOrder = filteredAndSortedProjects.map(p => p.id);
        const draggedIndex = currentOrder.indexOf(draggedProjectId);
        const targetIndex = currentOrder.indexOf(targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newOrder = [...currentOrder];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        
        setSortConfig({ key: null, direction: 'asc' }); 
        setProjectOrder(newOrder); // Update order via the hook
        setDraggedProjectId(null);
    }, [draggedProjectId, filteredAndSortedProjects, setProjectOrder]);

    const renderContent = () => {
         if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="ml-4 text-slate-400">Загрузка проектов...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-16 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="text-lg font-medium text-red-400">Ошибка при загрузке проектов</h3>
                    <p className="mt-1 text-sm text-slate-400">{error}</p>
                    <p className="mt-2 text-xs text-slate-500">Убедитесь, что Directus запущен и конфигурация в `config.ts` верна.</p>
                </div>
            );
        }

        return (
             <ProjectTable
                projects={filteredAndSortedProjects}
                onRowClick={setSelectedProject}
                sortConfig={sortConfig}
                onSort={handleSort}
                draggedProjectId={draggedProjectId}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />
        );
    }
    
    return (
        <div>
            <Header onNewProject={handleNewProject} />
            <main>
                <FilterBar
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    attachmentFilter={attachmentFilter}
                    onAttachmentFilterChange={setAttachmentFilter}
                />
                {renderContent()}
            </main>
            {selectedProject && (
                <ProjectDetailModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onSave={handleSaveProject}
                    onDelete={handleDeleteProject}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
