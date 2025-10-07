
export enum ColumnType {
    OWNER = 'OWNER',
    DOCUMENT = 'DOCUMENT',
    ATTRIBUTE = 'ATTRIBUTE',
    CALCULATED = 'CALCULATED',
}

export enum AttributeType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    SELECT = 'SELECT',
    CHECKBOX = 'CHECKBOX',
    LINK = 'LINK',
}

export type DocumentStatus = 'Есть' | 'Нет' | 'Истек' | 'Скоро истекает';

export interface BaseColumn {
    id: string;
    name: string;
    type: ColumnType;
}

export interface OwnerColumn extends BaseColumn {
    type: ColumnType.OWNER;
}

export interface DocumentColumn extends BaseColumn {
    type: ColumnType.DOCUMENT;
    required: boolean;
    trackExpiration: boolean;
}

export interface AttributeColumn extends BaseColumn {
    type: ColumnType.ATTRIBUTE;
    attributeType: AttributeType;
}

export type Column = OwnerColumn | DocumentColumn | AttributeColumn;

export interface DocumentVersion {
    id: string;
    version: number;
    fileName: string;
    uploadDate: string;
    fileUrl: string;
}

export interface DocumentData {
    status: DocumentStatus;
    signingDate?: string;
    expirationDate?: string;
    versions: DocumentVersion[];
    notes?: string;
}

export interface AttributeData {
    value: string | number | boolean | null;
}

export interface ContactMethod {
    id: string;
    type: string;
    value: string;
}

export interface Owner {
    id: string;
    name: string;
    contact: ContactMethod[];
    apartments: string[];
    notes: string;
    data: {
        [columnId: string]: DocumentData | AttributeData;
    };
}

export type ModalData = 
    | { type: 'owner'; id: string }
    | { type: 'document'; ownerId: string; columnId: string }
    | { type: 'attribute'; ownerId: string; columnId: string };

export type UserRole = 'director' | 'manager';

export interface User {
    id: string;
    username: string;
    role: UserRole;
}
