import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types/manager';
import * as directusService from '../services/directus';

export const useProjectData = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectOrder, setProjectOrder] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedProjects = await directusService.getProjects();
            setProjects(fetchedProjects);

            const savedOrder = localStorage.getItem('projectOrder');
            if (savedOrder) {
                // Filter saved order to only include IDs of projects that still exist
                const existingProjectIds = new Set(fetchedProjects.map(p => p.id));
                const validOrder = JSON.parse(savedOrder).filter((id: string) => existingProjectIds.has(id));
                setProjectOrder(validOrder);
            } else {
                setProjectOrder(fetchedProjects.map(p => p.id));
            }

            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Save order to localStorage whenever it changes, but only if it's not the initial empty array
        if (projectOrder.length > 0) {
            localStorage.setItem('projectOrder', JSON.stringify(projectOrder));
        }
    }, [projectOrder]);

    const addProject = async (newProject: Omit<Project, 'id'>): Promise<Project | undefined> => {
        try {
            const createdProject = await directusService.createProject(newProject);
            // Atomically update both projects list and their order
            setProjects(prev => [createdProject, ...prev]);
            setProjectOrder(prev => [createdProject.id, ...prev]);
            return createdProject;
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
            return undefined;
        }
    };

    const updateProject = async (id: string, updatedProjectData: Partial<Project>) => {
        try {
            const updatedProject = await directusService.updateProject(id, updatedProjectData);
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        } catch (err: any) {
            setError(err.message || 'Failed to update project');
        }
    };
    
    const deleteProject = async (id: string) => {
         try {
            await directusService.deleteProject(id);
            // Atomically update both projects list and their order
            setProjects(prev => prev.filter(p => p.id !== id));
            setProjectOrder(prev => prev.filter(projId => projId !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete project');
        }
    };

    return { 
        projects, 
        projectOrder, 
        setProjectOrder, // Expose setter for drag-and-drop
        loading, 
        error, 
        addProject, 
        updateProject, 
        deleteProject 
    };
};