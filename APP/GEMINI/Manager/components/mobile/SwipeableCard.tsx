import React, { useState } from 'react';
import { useSwipeGesture } from '../../hooks/useGestures';
import { TrashIcon, PencilIcon } from '../icons/Icons';

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onTap?: () => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onEdit, onDelete, onTap }) => {
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const bind = useSwipeGesture({
    onSwipeLeft: () => {
      if (onDelete || onEdit) {
        setIsRevealed(true);
        setOffset(-80);
      }
    },
    onSwipeRight: () => {
      setIsRevealed(false);
      setOffset(0);
    },
    onTap: () => {
      if (isRevealed) {
        setIsRevealed(false);
        setOffset(0);
      } else if (onTap) {
        onTap();
      }
    },
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
      setIsRevealed(false);
      setOffset(0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="w-20 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center transition-colors"
            aria-label="Редактировать"
          >
            <PencilIcon className="w-6 h-6 text-white" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="w-20 bg-red-600 hover:bg-red-700 active:bg-red-800 flex items-center justify-center transition-colors"
            aria-label="Удалить"
          >
            <TrashIcon className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Card content */}
      <div
        {...bind()}
        style={{
          transform: `translateX(${offset}px)`,
          transition: 'transform 0.3s ease-out',
        }}
        className="relative bg-slate-800 touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
