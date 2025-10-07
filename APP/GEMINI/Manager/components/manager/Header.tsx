import React from 'react';
import { PlusIcon } from '../icons/Icons';

interface HeaderProps {
    onNewProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewProject }) => {
    return (
        <header className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Дашборд руководителя</h1>
                <p className="text-sm sm:text-base text-slate-400">Управляйте текущими проектами, задачами и ресурсами.</p>
            </div>
            <div>
                <button
                    onClick={onNewProject}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800"
                >
                    <PlusIcon className="w-5 h-5"/>
                    <span>Новый проект</span>
                </button>
            </div>
        </header>
    );
};

export default Header;