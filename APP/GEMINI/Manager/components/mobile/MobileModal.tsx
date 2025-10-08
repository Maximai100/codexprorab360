import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '../icons/Icons';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useDrag } from '@use-gesture/react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const MobileModal: React.FC<MobileModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const isMobile = useIsMobile();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Swipe down to close on mobile
  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], last }) => {
      if (!isMobile || !modalRef.current) return;

      // Only allow swipe down
      if (my > 0) {
        modalRef.current.style.transform = `translateY(${my}px)`;
      }

      // Close on release if swiped down enough
      if (last) {
        if (my > 100 || vy > 0.5) {
          onClose();
        }
        modalRef.current.style.transform = '';
      }
    },
    {
      axis: 'y',
      filterTaps: true,
    }
  );

  if (!isOpen) return null;

  if (!isMobile) {
    // Desktop modal (centered dialog)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-slate-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile modal (full-screen)
  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <div ref={modalRef} className="h-full flex flex-col">
        {/* Header with swipe handle */}
        <div {...bind()} className="flex-shrink-0">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1 bg-slate-600 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 active:bg-slate-700 active:text-white transition-colors touch-target"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-slate-700 safe-area-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileModal;
