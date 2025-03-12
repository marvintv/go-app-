import React from 'react';
import colors from '../src/theme/colors';

interface TropicalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TropicalButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: TropicalButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `bg-[${colors.primary}] hover:bg-[${colors.primary}]/80 text-white`;
      case 'secondary':
        return `bg-[${colors.secondary}] hover:bg-[${colors.secondary}]/80 text-white`;
      case 'accent':
        return `bg-[${colors.accent}] hover:bg-[${colors.accent}]/80 text-white`;
      default:
        return `bg-[${colors.primary}] hover:bg-[${colors.primary}]/80 text-white`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-1 px-3 text-sm';
      case 'md':
        return 'py-2 px-4 text-base';
      case 'lg':
        return 'py-3 px-6 text-lg';
      default:
        return 'py-2 px-4 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        rounded-full 
        font-medium 
        transition-all 
        duration-200 
        shadow-md 
        hover:shadow-lg 
        transform 
        hover:-translate-y-1 
        ${getVariantStyles()} 
        ${getSizeStyles()} 
        ${className}
      `}
      style={{
        backgroundColor: variant === 'primary' ? colors.primary : 
                        variant === 'secondary' ? colors.secondary : colors.accent
      }}
    >
      {children}
    </button>
  );
};

export default TropicalButton; 