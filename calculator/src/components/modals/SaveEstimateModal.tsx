import React, { useState, useEffect, useRef } from 'react';
import { CalcInput } from '../common/CalcInput';
import { IconClose } from '../common/Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
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
                        <IconClose />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface SaveEstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const SaveEstimateModal: React.FC<SaveEstimateModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave 
}) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const date = new Date();
            const defaultName = `Расчет от ${date.toLocaleDateString()}`;
            setName(defaultName);
            setTimeout(() => inputRef.current?.select(), 100);
        }
    }, [isOpen]);

    const handleSaveClick = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Сохранить расчет">
            <div className="modal-body">
                <CalcInput 
                    id="estimateName" 
                    label="Название расчета" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    ref={inputRef}
                    onKeyDown={handleKeyDown}
                />
            </div>
            <div className="modal-footer">
                <button 
                    className="btn btn-secondary" 
                    onClick={onClose}
                    aria-label="Отменить сохранение"
                >
                    Отмена
                </button>
                <button 
                    className="btn btn-primary" 
                    onClick={handleSaveClick} 
                    disabled={!name.trim()}
                    aria-label="Сохранить расчет"
                >
                    Сохранить
                </button>
            </div>
        </Modal>
    );
};


