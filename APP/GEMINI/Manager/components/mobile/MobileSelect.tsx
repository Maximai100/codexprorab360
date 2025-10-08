import React from 'react';

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const MobileSelect: React.FC<MobileSelectProps> = ({ 
  label, 
  error, 
  options,
  className = '',
  ...props 
}) => {
  const selectClasses = `
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
      <select
        {...props}
        className={selectClasses}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default MobileSelect;
