import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const fullWidthClass = fullWidth ? 'full-width' : '';
  
  const combinedClassName = [baseClass, variantClass, fullWidthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};
