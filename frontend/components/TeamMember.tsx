import { useState, useEffect } from 'react';
import colors from '../src/theme/colors';

interface TeamMemberProps {
  name: string;
  role: string;
  initials: string;
  bgColor: string;
  delay?: number;
}

const TeamMember = ({ name, role, initials, bgColor, delay = 0 }: TeamMemberProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className={`relative transition-all duration-700 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="group flex flex-col items-center text-center">
        <div 
          className="relative h-48 w-48 rounded-full overflow-hidden border-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center" 
          style={{ borderColor: colors.primary, backgroundColor: bgColor }}
        >
          <span className="text-4xl font-bold text-white">{initials}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold" style={{ color: colors.secondary }}>{name}</h3>
          <p className="text-sm" style={{ color: colors.primary }}>{role}</p>
        </div>
        
        <div 
          className="absolute top-0 right-0 w-10 h-10 rounded-full flex items-center justify-center animate-bounce"
          style={{ backgroundColor: colors.accent }}
        >
          <span>🌴</span>
        </div>
      </div>
    </div>
  );
};

export default TeamMember;