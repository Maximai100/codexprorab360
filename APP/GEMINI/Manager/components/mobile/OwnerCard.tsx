import React from 'react';
import type { Owner } from '../../types';

interface OwnerCardProps {
  owner: Owner;
  onTap: () => void;
}

const OwnerCard: React.FC<OwnerCardProps> = ({ owner, onTap }) => {
  // Calculate document status
  const getDocumentStatus = () => {
    const columns = Object.keys(owner.data);
    const totalDocs = columns.length;
    const completedDocs = columns.filter(key => {
      const data = owner.data[key];
      return data && 'status' in data && data.status !== 'Нет';
    }).length;

    if (completedDocs === 0) return { label: 'Нет документов', color: 'bg-red-500' };
    if (completedDocs === totalDocs) return { label: 'Все документы', color: 'bg-green-500' };
    return { label: `${completedDocs}/${totalDocs} документов`, color: 'bg-yellow-500' };
  };

  const status = getDocumentStatus();

  return (
    <div
      onClick={onTap}
      className="bg-slate-800 rounded-lg p-4 shadow-md border border-slate-700 active:bg-slate-700 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{owner.name}</h3>
          <p className="text-sm text-slate-400 mt-0.5">Апартамент {owner.apartment}</p>
        </div>
        <div className={`flex-shrink-0 w-3 h-3 rounded-full ${status.color} ml-3 mt-1.5`} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{status.label}</span>
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default OwnerCard;
