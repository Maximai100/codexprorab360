import { DIRECTUS_URL, DIRECTUS_TOKEN } from '../config';
import type { Project } from '../types/manager';
import type { Owner } from '../types';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.errors?.[0]?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }
    const data = await response.json();
    return data.data;
};

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
});

// --- Projects API ---

export const getProjects = async (): Promise<Project[]> => {
    // Fetch projects and their related attachments (files) in one go.
    const response = await fetch(`${DIRECTUS_URL}/items/projects?fields=*,attachments.directus_files_id.*`);
    return handleResponse(response);
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    const response = await fetch(`${DIRECTUS_URL}/items/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
    });
    return handleResponse(response);
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${DIRECTUS_URL}/items/projects/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
    });
    return handleResponse(response);
};

export const deleteProject = async (id: string): Promise<void> => {
    const response = await fetch(`${DIRECTUS_URL}/items/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete project');
    }
    // DELETE returns 204 No Content
};

// --- Owners API ---

export const getOwners = async (): Promise<Owner[]> => {
    const response = await fetch(`${DIRECTUS_URL}/items/owners`);
    return handleResponse(response);
};

export const createOwner = async (ownerData: Omit<Owner, 'id'>): Promise<Owner> => {
    const response = await fetch(`${DIRECTUS_URL}/items/owners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ownerData),
    });
    return handleResponse(response);
}

export const updateOwner = async (id: string, ownerData: Partial<Owner>): Promise<Owner> => {
    const response = await fetch(`${DIRECTUS_URL}/items/owners/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(ownerData),
    });
    return handleResponse(response);
}

export const deleteOwner = async (id: string): Promise<void> => {
    const response = await fetch(`${DIRECTUS_URL}/items/owners/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
     if (!response.ok) {
        throw new Error('Failed to delete owner');
    }
}


// --- File Upload API ---

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${DIRECTUS_URL}/files`, {
        method: 'POST',
        headers: {
            // Note: Don't set Content-Type for FormData, the browser does it.
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        },
        body: formData,
    });
    return handleResponse(response);
};

// --- Sync API (for offline support) ---

export const fetchOwners = async (): Promise<Owner[]> => {
    return getOwners();
};

export const fetchProjects = async (): Promise<Project[]> => {
    return getProjects();
};
