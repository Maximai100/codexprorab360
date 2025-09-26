import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types';

export const useTheme = () => {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');

    useEffect(() => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemTheme;
        
        setThemeMode(initialTheme);
        document.body.classList.toggle('dark-theme', initialTheme === 'dark');
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newTheme);
        document.body.classList.toggle('dark-theme', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
    }, [themeMode]);

    return {
        themeMode,
        toggleTheme
    };
};

export const useTelegramTheme = () => {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        
        if (tg) {
            // Set initial theme from Telegram
            const initialTheme = tg.colorScheme === 'dark' ? 'dark' : 'light';
            setThemeMode(initialTheme);
            document.body.classList.toggle('dark-theme', initialTheme === 'dark');

            // Listen for theme changes
            const handleThemeChange = () => {
                const newTheme = tg.colorScheme === 'dark' ? 'dark' : 'light';
                setThemeMode(newTheme);
                document.body.classList.toggle('dark-theme', newTheme === 'dark');
            };

            tg.onEvent('themeChanged', handleThemeChange);

            return () => {
                tg.offEvent('themeChanged', handleThemeChange);
            };
        } else {
            // Fallback to system theme
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setThemeMode(systemTheme);
            document.body.classList.toggle('dark-theme', systemTheme === 'dark');
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newTheme);
        document.body.classList.toggle('dark-theme', newTheme === 'dark');
    }, [themeMode]);

    return {
        themeMode,
        toggleTheme
    };
};


