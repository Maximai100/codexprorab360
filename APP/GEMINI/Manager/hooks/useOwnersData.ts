import { useState, useEffect, useCallback } from 'react';
import type { Owner, Column } from '../types';
import { ColumnType, AttributeType } from '../types';
import * as directusService from '../services/directus';

// Columns might be static or fetched from another source in a real app
const initialColumns: Column[] = [
    { id: 'owner', name: 'Собственник', type: ColumnType.OWNER },
    { id: 'doc1', name: 'Договор управления', type: ColumnType.DOCUMENT, required: true, trackExpiration: true },
    { id: 'doc2', name: 'Акт приема-передачи', type: ColumnType.DOCUMENT, required: true, trackExpiration: false },
    { id: 'doc3', name: 'Согласие на обработку ПД', type: ColumnType.DOCUMENT, required: true, trackExpiration: false },
    { id: 'attr1', name: 'Кол-во апартаментов', type: ColumnType.ATTRIBUTE, attributeType: AttributeType.NUMBER },
    { id: 'attr2', name: 'Ответственный менеджер', type: ColumnType.ATTRIBUTE, attributeType: AttributeType.TEXT },
];

export const useOwnersData = () => {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [columns, setColumns] = useState<Column[]>(initialColumns);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await directusService.getOwners();
            setOwners(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch owners');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addOwner = async (newOwner: Omit<Owner, 'id'>) => {
        try {
            const createdOwner = await directusService.createOwner(newOwner);
            setOwners(prev => [createdOwner, ...prev]);
        } catch (err: any) {
            setError(err.message || 'Failed to create owner');
        }
    };

    const updateOwner = async (id: string, updatedOwnerData: Partial<Owner>) => {
        try {
            const updatedOwner = await directusService.updateOwner(id, updatedOwnerData);
            setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updatedOwner } : o));
        } catch (err: any) {
            setError(err.message || 'Failed to update owner');
        }
    };
    
    const deleteOwner = async (id: string) => {
         try {
            await directusService.deleteOwner(id);
            setOwners(prev => prev.filter(o => o.id !== id));
        } catch (err: any)
        {
            setError(err.message || 'Failed to delete owner');
        }
    };

    return { owners, setOwners, columns, setColumns, loading, error, addOwner, updateOwner, deleteOwner };
};