import React from 'react';
import { LogOutIcon, UserIcon } from '../icons/Icons';
import BottomSheet from './BottomSheet';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  role: 'director' | 'manager';
  onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, username, role, onLogout }) => {
  const roleLabel = role === 'director' ? 'Руководитель' : 'Менеджер';

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Профиль">
      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-white truncate">{username}</p>
            <p className="text-sm text-slate-400">{roleLabel}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ProfileMenu;
