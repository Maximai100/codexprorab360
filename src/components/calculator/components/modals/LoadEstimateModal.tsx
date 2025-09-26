import React from 'react';
import { SavedEstimate } from '../../types';
import { IconTrash } from '../common/Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay open" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Закрыть">
                        <IconTrash />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface LoadEstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    estimates: SavedEstimate[];
    onLoad: (id: number) => void;
    onDelete: (id: number) => void;
}

export const LoadEstimateModal: React.FC<LoadEstimateModalProps> = ({ 
    isOpen, 
    onClose, 
    estimates, 
    onLoad, 
    onDelete 
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: 'numeric', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm('Вы уверены, что хотите удалить этот расчет?')) {
            onDelete(id);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Загрузить расчет">
            <div className="modal-body">
                {estimates.length > 0 ? (
                    <div className="estimates-list">
                        {estimates.slice().reverse().map(est => (
                            <div key={est.id} className="estimate-item">
                                <div className="estimate-info">
                                    <strong>{est.name}</strong>
                                    <span>{formatDate(est.date)}</span>
                                </div>
                                <div className="estimate-actions">
                                    <button 
                                        onClick={(e) => handleDelete(e, est.id)} 
                                        className="btn-tertiary" 
                                        style={{ padding: '8px' }} 
                                        aria-label={`Удалить расчет "${est.name}"`}
                                    >
                                        <IconTrash />
                                    </button>
                                    <button 
                                        onClick={() => onLoad(est.id)} 
                                        className="btn btn-primary"
                                        aria-label={`Загрузить расчет "${est.name}"`}
                                    >
                                        Загрузить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-results-message">Сохраненных расчетов нет.</p>
                )}
            </div>
        </Modal>
    );
};


