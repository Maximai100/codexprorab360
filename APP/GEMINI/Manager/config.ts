// config.ts

// URL вашего проекта Directus
// В режиме разработки используем прокси для обхода CORS
// В продакшене используем прямой URL
export const DIRECTUS_URL = import.meta.env.DEV 
  ? '/api' 
  : (import.meta.env.VITE_DIRECTUS_URL || 'https://1.cycloscope.online');

// Статичный токен для аутентификации из переменных окружения
export const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_STATIC_TOKEN || '7JeEQ9bKtgX7onxJQZyGu8w8tCziiblV';