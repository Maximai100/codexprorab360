import React from 'react';
import { BuildingOfficeIcon, ChartBarIcon } from '../icons/Icons';

interface BottomNavProps {
  activeTab: 'owners' | 'projects';
  onTabChange: (tab: 'owners' | 'projects') => void;
  userRole: 'director' | 'manager';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole }) => {
  const tabs = [
    ...(userRole === 'director' ? [{
      id: 'owners' as const,
      label: 'Собственники',
      icon: BuildingOfficeIcon
    }] : []),
    {
      id: 'projects' as const,
      label: 'Проекты',
      icon: ChartBarIcon
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-area-bottom z-40 lg:hidden">
      <div className="flex justify-around items-center h-16 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                min-w-[44px] min-h-[44px]
                transition-colors duration-200
                ${isActive 
                  ? 'text-blue-400' 
                  : 'text-slate-400 active:text-slate-200'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
