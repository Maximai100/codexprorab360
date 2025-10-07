
import React from 'react';
import { XMarkIcon } from './icons/Icons';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer }) => {
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all flex flex-col max-h-full overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:bg-slate-600 hover:text-white rounded-lg text-sm p-1.5"
                    >
                        <XMarkIcon className="w-5 h-5" />
                        <span className="sr-only">Закрыть модальное окно</span>
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end p-4 border-t border-slate-700 rounded-b flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
