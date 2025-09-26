import React, { forwardRef } from 'react';

interface CalcInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    unit?: string;
    error?: string;
    tooltip?: string;
}

export const CalcInput = forwardRef<HTMLInputElement, CalcInputProps>(
    ({ label, value, onChange, id, unit, error, tooltip, ...props }, ref) => {
        return (
            <div className="calc-input-group">
                <div className="calc-label-wrapper">
                    <label htmlFor={id}>{label}</label>
                    {tooltip && (
                        <div className="tooltip-container">
                            <div className="tooltip-icon">?</div>
                            <div className="tooltip-text">{tooltip}</div>
                        </div>
                    )}
                </div>
                <div className="calc-input-wrapper">
                    <input
                        ref={ref}
                        id={id}
                        value={value}
                        onChange={onChange}
                        className={error ? 'invalid' : ''}
                        {...props}
                    />
                    {unit && <span className="calc-input-unit">{unit}</span>}
                </div>
                <p className="error-message">{error || ''}</p>
            </div>
        );
    }
);

CalcInput.displayName = 'CalcInput';


