import React from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface MobileFormLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}

const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({ children, footer, onSubmit }) => {
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  if (!isMobile) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        {footer && <div className="pt-4">{footer}</div>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {children}
      </div>

      {/* Fixed footer with action buttons */}
      {footer && (
        <div className="flex-shrink-0 pt-4 pb-safe border-t border-slate-700 bg-slate-900 sticky bottom-0">
          {footer}
        </div>
      )}
    </form>
  );
};

export default MobileFormLayout;
