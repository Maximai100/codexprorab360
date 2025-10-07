
import type { User } from '../types';

// Mock user data. In a real application, this would be an API call.
const users: (User & { password_hash: string })[] = [
    { id: '1', username: 'director', password_hash: 'password', role: 'director' },
    { id: '2', username: 'manager', password_hash: 'password', role: 'manager' },
];

export const login = (username: string, password_hash: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password_hash === password_hash);
            if (user) {
                const { password_hash, ...userWithoutPassword } = user;
                resolve(userWithoutPassword);
            } else {
                reject(new Error('Неверный логин или пароль'));
            }
        }, 500); // Simulate network delay
    });
};
