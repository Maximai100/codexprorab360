
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as authService from '../services/auth';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password_hash: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from sessionStorage", error);
            sessionStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password_hash: string) => {
        const loggedInUser = await authService.login(username, password_hash);
        setUser(loggedInUser);
        sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('user');
    };

    if (loading) {
        // You can return a global loader here if you want
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
