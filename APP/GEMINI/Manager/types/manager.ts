export enum ProjectStatus {
    InProgress = 'в работе',
    Completed = 'завершено',
    Archived = 'архив',
}

// Represents the structure of a file object returned from Directus Files collection
export interface DirectusFile {
    id: string;
    title: string;
    filesize: number;
    type: string; // Mime type
    filename_disk: string;
    uploaded_on: string;
}

// Represents the M2M relationship item for attachments, which can be a file or a link
export interface ProjectAttachment {
    id: number; // ID of the junction table row
    projects_id: string;
    directus_files_id?: DirectusFile; // A file from Directus, optional for links
    url?: string; // A URL for a link attachment
    title?: string; // A title for a link attachment
}

export interface HistoryLog {
    id: string;
    timestamp: string; // ISO string
    user: string;
    action: string;
}

export interface Project {
    id: string;
    name: string;
    responsible: string;
    deadline: string; // ISO string
    status: ProjectStatus;
    // attachments can now contain both files and links
    attachments: ProjectAttachment[];
    notes: string;
    history: HistoryLog[];
    tags: string[];
}
