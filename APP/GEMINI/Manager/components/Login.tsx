
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SpinnerIcon } from './icons/Icons';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка входа');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="bg-slate-800 shadow-2xl rounded-lg p-8">
                    <h1 className="text-2xl font-bold text-center text-white mb-2">Вход в систему</h1>
                    <p className="text-sm text-slate-400 text-center mb-6">Панель управления</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-300">Логин</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputClasses}
                                placeholder="director"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block mb-2 text-sm font-medium text-slate-300">Пароль</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClasses}
                                placeholder="password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                         {error && (
                            <div className="text-sm text-center text-red-400 bg-red-900/30 p-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !username || !password}
                                className="w-full inline-flex justify-center items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-blue-800 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5 mr-3 -ml-1 animate-spin" />
                                        Вход...
                                    </>
                                ) : (
                                    'Войти'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;