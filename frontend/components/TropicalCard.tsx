import React from 'react';
import colors from '../src/theme/colors';

interface TropicalCardProps {
  children: React.ReactNode;
  className?: string;
}

const TropicalCard = ({ children, className = '' }: TropicalCardProps) => {
  return (
    <div 
      className={`
        bg-white 
        dark:bg-gray-800 
        rounded-lg 
        shadow-md 
        overflow-hidden 
        p-4 
        transition-all 
        duration-300 
        hover:shadow-lg 
        ${className}
      `}
      style={{
        borderLeft: `4px solid ${colors.primary}`
      }}
    >
      {children}
    </div>
  );
};

export default TropicalCard; 