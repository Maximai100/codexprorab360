import React from 'react';
import { XMarkIcon } from '../icons/Icons';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onClear?: () => void;
}

const MobileInput: React.FC<MobileInputProps> = ({ 
  label, 
  error, 
  onClear, 
  className = '',
  ...props 
}) => {
  const inputClasses = `
    bg-slate-700 border text-white text-base rounded-lg 
    block w-full px-4 py-3 touch-target
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-slate-800 disabled:text-slate-500
    ${error ? 'border-red-500' : 'border-slate-600'}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          className={inputClasses}
        />
        {onClear && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
            aria-label="Очистить"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default MobileInput;
