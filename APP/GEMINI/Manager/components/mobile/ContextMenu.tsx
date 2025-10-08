import React, { useEffect } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon } from '../icons/Icons';

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  position?: { x: number; y: number };
}

const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, onClose, onEdit, onDelete, position }) => {
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = () => onClose();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 min-w-[200px]"
        style={{
          top: position ? `${position.y}px` : '50%',
          left: position ? `${position.x}px` : '50%',
          transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2">
          {onEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-slate-700 active:bg-slate-600 transition-colors touch-target"
            >
              <PencilIcon className="w-5 h-5 text-blue-400" />
              <span>Редактировать</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-slate-700 active:bg-slate-600 transition-colors touch-target"
            >
              <TrashIcon className="w-5 h-5 text-red-400" />
              <span>Удалить</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-slate-400 hover:bg-slate-700 active:bg-slate-600 transition-colors touch-target border-t border-slate-700"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>Отмена</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ContextMenu;
