import React, { useState, FC, useEffect, useMemo, useRef, useCallback } from 'react';
import ViewportManager from './src/lib/ViewportManager';
import { createRoot } from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import directusApi, { loginWithTelegram } from './api';
import { getNumberParam, getTelegramUserId, getMasterId } from './src/lib/utils';
import { sendBookingNotifications } from './src/api/notify';
// Фото обновляем простым запросом к бэкенду (refresh-photo)
import { getClientContactLink, openContactLink } from './src/api/contact';
import { TelegramSubscriptionButton } from './src/components/TelegramSubscriptionButton';
import { BookingCard } from './src/components/BookingCard';
import { BreakManager } from './src/components/BreakManager';
import { getBreaks, RecurringBreak } from './src/api/breaks';
import { createBooking, prepareBookingData, type BookingInfo } from './src/api/booking';
import BackButton from './src/lib/BackButtonManager';
import ScrollManager from './src/lib/ScrollManager';
import useScrollRestoration from './src/lib/useScrollRestoration';
import useInputFocus from './src/lib/useInputFocus';
import useMainButtonInset from './src/lib/useMainButtonInset';
import { getMasterInfo, updateMaster } from './src/api/master';
import telemetry from './src/lib/TelemetryLogger';
import { ClientDashboard } from './src/components/ClientDashboard';

// Fix: Add type definition for Telegram WebApp to the window object.
declare global {
    interface Window {
        Telegram: any;
    }
}

// Initialize viewport manager BEFORE React render to set --vh
ViewportManager.initialize();

const tg = window.Telegram.WebApp;

// Инициализация Telegram WebApp

// --- CONFIGURATION ---
// ВАЖНО: Замените 'your_bot_username_here' на реальный юзернейм вашего бота,
// который вы получили от @BotFather. Например: 'MySuperMasterBot'.
// Это необходимо для правильной генерации ссылки для записи клиентов.
const BOT_USERNAME = 'zapismenya_bot';

const backendApiBaseUrl =
    ((import.meta as any)?.env?.VITE_MASTER_PHOTO_REFRESH_BASE as string | undefined) ||
    'https://api.prorab360.online';

const resolveTelegramId = (user: any): string | number | null => {
    if (!user) {
        return tg?.initDataUnsafe?.user?.id ?? null;
    }
    return user.telegram_id ?? user.telegramId ?? user.id ?? tg?.initDataUnsafe?.user?.id ?? null;
};

const checkIsMasterByTelegram = async (telegramId: string | number): Promise<boolean> => {
    const encodedId = encodeURIComponent(String(telegramId));
    const response = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${encodedId}&limit=1&fields=id`);
    const data = response?.data?.data;
    return Array.isArray(data) && data.length > 0;
};


// --- UTILS & HOOKS ---

// Хук для работы с localStorage
function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error saving to localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}

// Функции для работы с Directus API
const convertDirectusAppointmentToLocal = (directusAppt: DirectusAppointment, services: Service[]): Appointment => {
    // Получаем часовой пояс пользователя из браузера
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Конвертируем дату из UTC в локальный часовой пояс
    const localDateTime = toZonedTime(directusAppt.dateTime, timeZone);

    // Ищем услугу по ID (может быть строкой или числом)
    const serviceId = String(directusAppt.service);
    const service = services.find(s => String(s.id) === serviceId);

    // Логирование для отладки
    if (!service) {
        console.warn('⚠️ Услуга не найдена при конвертации:', {
            serviceId: directusAppt.service,
            availableServices: services.map(s => ({ id: s.id, name: s.name }))
        });
    }

    return {
        id: directusAppt.id || '',
        clientName: directusAppt.clientName,
        clientPhone: directusAppt.clientPhone,
        service: service?.name || 'Неизвестная услуга',
        serviceId: directusAppt.service ?? null,
        date: formatTz(localDateTime, 'yyyy-MM-dd', { timeZone }),
        time: formatTz(localDateTime, 'HH:mm', { timeZone }),
        duration: service?.duration || 60,
        telegramId: directusAppt.clientTelegramId,
        reminderSent: directusAppt.reminderSent
    };
};

const convertLocalAppointmentToDirectus = (localAppt: Omit<Appointment, 'id'>, masterId: number, services: Service[]): Omit<DirectusAppointment, 'id'> => {
    const service = services.find(s => s.name === localAppt.service);
    const resolvedServiceId = service?.id ?? localAppt.serviceId ?? '';
    const dateTime = new Date(`${localAppt.date}T${localAppt.time}:00`);
    return {
        master: masterId,
        service: resolvedServiceId,
        clientName: localAppt.clientName,
        clientPhone: localAppt.clientPhone,
        clientTelegramId: localAppt.telegramId,
        dateTime: dateTime.toISOString(),
        reminderSent: localAppt.reminderSent || false
    };
};

const getAvailableTimes = (
    date: Date,
    serviceDuration: number,
    schedule: Schedule,
    appointments: Appointment[],
    timeBlocks: TimeBlock[],
    recurringBreaks: RecurringBreak[]
): string[] => {
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    const daySchedule = schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.enabled) return [];

    const { startTime, endTime } = daySchedule;
    const availableSlots: string[] = [];
    const interval = 15; // check every 15 minutes

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Получаем часовой пояс пользователя и форматируем дату корректно
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayString = formatTz(date, 'yyyy-MM-dd', { timeZone });
    const dayAppointments = appointments.filter(appt => appt.date === dayString);
    const dayTimeBlocks = timeBlocks.filter(block => block.date === dayString);
    const weekdayIso = ((date.getDay() + 6) % 7) + 1; // convert JS day to ISO (1=Mon,7=Sun)
    const dayRecurringBreaks = recurringBreaks.filter(b => b.days_of_week.includes(String(weekdayIso)));

    const timeStringToMinutes = (time: string): number => {
        const [hours = 0, minutes = 0] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTimeDate = new Date(date);
    endTimeDate.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTimeDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        if (slotEnd > endTimeDate) break;

        const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
        const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

        const isOverlappingAppointment = dayAppointments.some(appt => {
            const [apptHour, apptMinute] = appt.time.split(':').map(Number);
            const apptStartDate = new Date(date);
            apptStartDate.setHours(apptHour, apptMinute, 0, 0);
            const apptEndDate = new Date(apptStartDate.getTime() + appt.duration * 60000);
            return (slotStart < apptEndDate && slotEnd > apptStartDate);
        });

        const isOverlappingBlock = dayTimeBlocks.some(block => {
            const [blockStartHour, blockStartMinute] = block.startTime.split(':').map(Number);
            const blockStartDate = new Date(date);
            blockStartDate.setHours(blockStartHour, blockStartMinute, 0, 0);

            const [blockEndHour, blockEndMinute] = block.endTime.split(':').map(Number);
            const blockEndDate = new Date(date);
            blockEndDate.setHours(blockEndHour, blockEndMinute, 0, 0);

            return (slotStart < blockEndDate && slotEnd > blockStartDate);
        });

        const isOverlappingBreak = dayRecurringBreaks.some(recBreak => {
            const [breakStartMinutes, breakEndMinutes] = [timeStringToMinutes(recBreak.start_time), timeStringToMinutes(recBreak.end_time)];
            return slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes;
        });

        if (!isOverlappingAppointment && !isOverlappingBlock && !isOverlappingBreak) {
            availableSlots.push(slotStart.toTimeString().substring(0, 5));
        }

        currentTime.setMinutes(currentTime.getMinutes() + interval);
    }

    return availableSlots;
};

const stripEmojiCharacters = (text: string | undefined): string => {
    if (!text) return '';
    try {
        return text
            .replace(/[\p{Extended_Pictographic}\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Component}\u200D\uFE0F]/gu, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    } catch {
        return text
            .replace(/[\u{1F100}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
};


// --- INTERFACES ---
// Интерфейсы для работы с Directus API
interface DirectusService {
    id?: string;
    master: string | number;
    name: string;
    price: number;
    duration: number;
}

interface DirectusAppointment {
    id?: string;
    master: string | number;
    service: string | number; // ID услуги
    clientName: string;
    clientPhone?: string;
    clientTelegramId?: number | string;
    dateTime: string; // ISO 8601 format
    reminderSent?: boolean;
}

interface DirectusTimeBlock {
    id?: string;
    master: string | number;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    title: string;
}

interface DirectusSchedule {
    id?: string;
    master: string | number;
    schedule: Schedule; // JSON объект
}

// Локальные интерфейсы для UI (упрощенные)
interface Service { id?: string; name: string; price: number; duration: number; }
interface Appointment { id: string; clientName: string; clientPhone?: string; service: string; serviceId?: number | string | null; time: string; date: string; duration: number; telegramId?: number | string; reminderSent?: boolean; }
interface TimeBlock { id: string; date: string; startTime: string; endTime: string; title: string; }
interface DaySchedule { enabled: boolean; startTime: string; endTime: string; }
interface Schedule { [day: string]: DaySchedule; }
interface Client { name: string; phone?: string; appointmentsCount: number; }
interface Task { id: string; text: string; done: boolean; }
interface Expense { id: string; description: string; amount: number; date: string; }

// --- SVG ICONS ---
const Icon = ({ name, className = '' }: { name: string, className?: string }) => {
    // Fix: Replace JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const icons: Record<string, React.ReactElement> = {
        copy: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z" /></svg>,
        add: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" /></svg>,
        chevron: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" /></svg>,
        services: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 7.562C2.5 4.504 4.504 2.5 7.562 2.5h.876a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.876C5.604 4.5 4.5 5.604 4.5 7.562v.876a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-.876Zm11-5.062a.5.5 0 0 1 .5.5v.876a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-.876C10.5 5.604 9.396 4.5 7.562 4.5h-.876a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h.876C10.496 2.5 12.5 4.504 12.5 7.562v.876a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-.876c0-1.958-1.104-3.062-3.062-3.062h-.876a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h.876C10.496 2.5 12.5 4.504 12.5 7.562z" /></svg>,
        clients: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" /></svg>,
        schedule: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" /></svg>,
        link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" /><path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" /></svg>,
        download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" /><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" /></svg>,
        upload: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" /><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" /></svg>,
        'calendar-check': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" /><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" /></svg>,
        users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4s-5 3-5 4-1 1-1 1h10zm-9.995-.944v-.002.002zM3.5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM5.5 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm3.5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6.5 2c-2 0-3.5 1.5-3.5 3h7c0-1.5-1.5-3-3.5-3z" /></svg>,
        tasks: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" /><path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z" /></svg>,
        expenses: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm12 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11zM2 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2z" /><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" /></svg>,
        instructions: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/></svg>,
        chat: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/></svg>,
    }
    return <span className={`icon ${className}`}>{icons[name]}</span>;
}

// --- COMPONENTS ---
const Toast: FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return <div className="toast">{message}</div>;
};

// removed unused openBottomSheetCount
const SWIPE_OVERLAY_SUPPRESS_MS = 400;
let lastSwipeCloseTimestamp = 0;

export const BottomSheet: FC<{ title: string; children: React.ReactNode; onClose: () => void; actions?: React.ReactNode; fixedContent?: React.ReactNode; footerContent?: React.ReactNode }> = ({ title, children, onClose, actions, fixedContent, footerContent }) => {
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const fixedRef = useRef<HTMLDivElement | null>(null);
    const footerRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const currentOffsetRef = useRef(0);
    const isDraggingRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const capturedPointerIdRef = useRef<number | null>(null);
    const dragFromFixedAreaRef = useRef(false);
    const prevFocusRef = useRef<HTMLElement | null>(null);
    const titleIdRef = useRef(`bs-title-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const handleClose = useCallback(() => {
        onCloseRef.current?.();
    }, []);

    useEffect(() => {
        ScrollManager.overlayPush();
        const backHandler = () => handleClose();
        BackButton.push(backHandler);
        // Save focus and focus sheet for a11y
        prevFocusRef.current = (document.activeElement as HTMLElement) || null;
        const first = sheetRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const shouldAvoidAutoFocus = first && (first.tagName === 'INPUT' || first.tagName === 'TEXTAREA');
        if (first && !shouldAvoidAutoFocus) {
            first.focus();
        } else {
            sheetRef.current?.focus?.();
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose();
            } else if (e.key === 'Tab' && sheetRef.current) {
                // Focus trap
                const focusables = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )).filter(el => !el.hasAttribute('disabled'));
                if (focusables.length === 0) return;
                const firstEl = focusables[0];
                const lastEl = focusables[focusables.length - 1];
                if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                } else if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            }
        };

        document.addEventListener('keydown', onKeyDown);

        // Optional history policy for modals (replaceState)
        try {
            const state = history.state || {};
            history.replaceState({ ...state, _modal: true }, document.title);
        } catch {}

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            BackButton.pop(backHandler);
            ScrollManager.overlayPop();
            // Restore focus
            prevFocusRef.current?.focus?.();
            try {
                const state = history.state || {};
                if (state && state._modal) {
                    const { _modal, ...rest } = state;
                    history.replaceState(rest, document.title);
                }
            } catch {}
        };
    }, [handleClose]);

    useEffect(() => {
        const sheetEl = sheetRef.current;
        if (!sheetEl) return;

        // overlay content scroll -> for telemetry
        const onContentScroll = () => {
            ScrollManager.notifyOverlayScroll();
        };
        contentRef.current?.addEventListener('scroll', onContentScroll, { passive: true });

        const applyTranslate = (value: number) => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(() => {
                if (!sheetRef.current) return;
                sheetRef.current.style.transform = value > 0 ? `translateY(${value}px)` : 'translateY(0px)';
            });
        };

        const resetPosition = () => {
            if (!sheetRef.current) return;
            sheetRef.current.style.transition = 'transform 0.2s ease';
            applyTranslate(0);
            const handleTransitionEnd = () => {
                if (!sheetRef.current) return;
                sheetRef.current.style.removeProperty('transition');
                sheetRef.current.style.removeProperty('transform');
                // Remove will-change after animation
                sheetRef.current.style.removeProperty('will-change');
                // Ensure any inline animation override is cleared
                sheetRef.current.style.removeProperty('animation');
                sheetRef.current.removeEventListener('transitionend', handleTransitionEnd);
            };
            sheetRef.current.addEventListener('transitionend', handleTransitionEnd);
        };

        const isPointerInDragZone = (target: EventTarget | null): boolean => {
            if (!target || !(target instanceof Node)) return false;
            const headerEl = headerRef.current;
            if (!headerEl) return false;
            // Разрешаем старт свайпа при нажатии на верхнюю область (весь header)
            return headerEl.contains(target);
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            // Разрешаем начало свайпа ТОЛЬКО с области хедера (полоска-"handle")
            dragFromFixedAreaRef.current = isPointerInDragZone(event.target);
            if (!dragFromFixedAreaRef.current) {
                startYRef.current = null;
                return;
            }
            startYRef.current = event.clientY;
            startTimeRef.current = Date.now();
            currentOffsetRef.current = 0;
            isDraggingRef.current = false;
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (startYRef.current === null || !sheetRef.current) return;

            const deltaY = event.clientY - startYRef.current;
            if (deltaY <= 0 && !isDraggingRef.current) {
                return;
            }

            if (!isDraggingRef.current) {
                // Разрешаем драг только если старт был в зоне handle
                if (!dragFromFixedAreaRef.current) return;
                isDraggingRef.current = true;
                sheetRef.current.style.transition = 'none';
                sheetRef.current.style.animation = 'none';
                sheetRef.current.style.willChange = 'transform';
                sheetRef.current.setPointerCapture(event.pointerId);
                capturedPointerIdRef.current = event.pointerId;
            }

            currentOffsetRef.current = Math.max(0, deltaY);
            applyTranslate(currentOffsetRef.current);
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (capturedPointerIdRef.current === event.pointerId && sheetRef.current) {
                sheetRef.current.releasePointerCapture(event.pointerId);
                capturedPointerIdRef.current = null;
            }

            if (isDraggingRef.current) {
                const offset = currentOffsetRef.current;
                const dt = (startTimeRef.current ? Date.now() - startTimeRef.current : 0) || 1;
                const velocity = offset / dt; // px per ms
                const sheetH = sheetRef.current ? sheetRef.current.offsetHeight : 0;
                const threshold = Math.min(120, sheetH * 0.25);
                if (offset > threshold || velocity > 0.5) {
                    lastSwipeCloseTimestamp = Date.now();
                    handleClose();
                } else {
                    resetPosition();
                    telemetry.log('swipe_cancelled', { reason: 'threshold_not_met' });
                }
            }

            startYRef.current = null;
            startTimeRef.current = null;
            currentOffsetRef.current = 0;
            isDraggingRef.current = false;
            dragFromFixedAreaRef.current = false;
            // In case we didn't animate back, ensure will-change removed
            if (sheetRef.current) sheetRef.current.style.removeProperty('will-change');
        };

        sheetEl.addEventListener('pointerdown', handlePointerDown);
        sheetEl.addEventListener('pointermove', handlePointerMove);
        sheetEl.addEventListener('pointerup', handlePointerUp);
        sheetEl.addEventListener('pointercancel', handlePointerUp);

        return () => {
            sheetEl.removeEventListener('pointerdown', handlePointerDown);
            sheetEl.removeEventListener('pointermove', handlePointerMove);
            sheetEl.removeEventListener('pointerup', handlePointerUp);
            sheetEl.removeEventListener('pointercancel', handlePointerUp);
            contentRef.current?.removeEventListener('scroll', onContentScroll as any);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [handleClose]);

    const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (Date.now() - lastSwipeCloseTimestamp < SWIPE_OVERLAY_SUPPRESS_MS) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        handleClose();
    }, [handleClose]);

    return (
        <div className="bottom-sheet-overlay" onClick={handleOverlayClick}>
            <div
                ref={sheetRef}
                className="bottom-sheet-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleIdRef.current}
                tabIndex={-1}
            >
                <div ref={headerRef} className="bottom-sheet-header">
                    <div className="handle" aria-hidden="true"></div>
                    <h3 id={titleIdRef.current}>{title}</h3>
                    {actions && <div className="bottom-sheet-header-actions">{actions}</div>}
                </div>
                {fixedContent && <div ref={fixedRef} className="bottom-sheet-fixed-content">{fixedContent}</div>}
                <div ref={contentRef} className="bottom-sheet-scrollable-content">
                    {children}
                </div>
                {footerContent && <div ref={footerRef} className="bottom-sheet-footer">{footerContent}</div>}
            </div>
        </div>
    );
};


const Avatar: FC<{ name: string; photoUrl?: string }> = ({ name, photoUrl }) => {
    const [imageError, setImageError] = useState(false);

    // Функция для генерации цвета на основе строки (имени)
    const getColorForString = (str: string) => {
        const colors = [
            '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Преобразование в 32-битное целое
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Функция для получения инициалов из имени
    const getInitials = (name: string) => {
        if (!name) return '';
        const words = name.split(' ').filter(Boolean);
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(name);
    const backgroundColor = getColorForString(name);

    // Если есть фото и оно не вызвало ошибку загрузки
    if (photoUrl && !imageError) {
        return (
            <div className="avatar-placeholder">
                <img
                    src={photoUrl}
                    alt={name}
                    className="avatar-image"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    // Иначе показываем инициалы
    return (
        <div className="avatar-placeholder" style={{ backgroundColor }}>
            <span className="avatar-initials">{initials}</span>
        </div>
    );
};

const BookingPanel: FC<{
    service: Service;
    schedule: Schedule;
    appointments: Appointment[];
    timeBlocks: TimeBlock[];
    recurringBreaks: RecurringBreak[];
    onBook: (clientName: string, clientPhone: string, date: string, time: string) => void;
    onClose: () => void;
}> = ({ service, schedule, appointments, timeBlocks, recurringBreaks, onBook, onClose }) => {
    const [clientName, setClientName] = useState(tg.initDataUnsafe?.user?.first_name || '');
    const [clientPhone, setClientPhone] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);

    // Обработчик фокуса для полей ввода
    const { handleFocus: handleInputFocus } = useInputFocus();

    useEffect(() => {
        const times = getAvailableTimes(selectedDate, service.duration, schedule, appointments, timeBlocks, recurringBreaks);
        setAvailableTimes(times);
        setSelectedTime(times.length > 0 ? times[0] : '');
    }, [selectedDate, service.duration, schedule, appointments, timeBlocks, recurringBreaks]);

    const isFormValid = Boolean(clientName.trim() && selectedTime);

    const handleSubmit = useCallback(() => {
        if (isFormValid) {
            // Форматируем дату в локальном времени
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            onBook(clientName, clientPhone, dateString, selectedTime);
        }
    }, [isFormValid, clientName, clientPhone, selectedDate, selectedTime, onBook]);


    useEffect(() => {
        tg.MainButton.setParams({ text: 'ЗАПИСАТЬСЯ', is_visible: true, is_active: isFormValid });
        tg.onEvent('mainButtonClicked', handleSubmit);

        return () => {
            tg.MainButton.hide();
            tg.offEvent('mainButtonClicked', handleSubmit);
        };
    }, [isFormValid, handleSubmit]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Парсим дату из строки YYYY-MM-DD напрямую, чтобы избежать проблем с часовыми поясами
        const [year, month, day] = e.target.value.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month - 1, так как месяцы в JS начинаются с 0
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date >= today) {
            setSelectedDate(date);
        }
    };

    // Функция для форматирования даты в YYYY-MM-DD в локальном времени
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Форматируем минимальную дату (сегодня) в локальном времени
    const today = new Date();
    const minDate = formatDateForInput(today);

    return (
        <BottomSheet title="Запись на услугу" onClose={onClose}>
            <p style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}><strong>{service.name}</strong> ({service.price} ₽, {service.duration} мин.)</p>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="form-group"><label>Ваше имя</label><input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} onFocus={handleInputFocus} required placeholder="Как к вам обращаться?" /></div>
                <div className="form-group"><label>Ваш телефон (необязательно)</label><input type="tel" className="form-control" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} onFocus={handleInputFocus} placeholder="+7 (999) 123-45-67" /></div>
                <div className="form-group"><label>Выберите дату</label><input type="date" className="form-control" value={formatDateForInput(selectedDate)} onChange={handleDateChange} onFocus={handleInputFocus} min={minDate} /></div>
                <div className="form-group"><label>Выберите время</label>
                    <select className="form-control" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} disabled={availableTimes.length === 0}>
                        {availableTimes.length > 0 ? availableTimes.map(time => <option key={time} value={time}>{time}</option>) : <option>Нет свободного времени</option>}
                    </select>
                </div>
            </form>
        </BottomSheet>
    );
};


const ClientBookingPage: FC<{ masterName: string; profession: string; masterId: number; masterTelegramId: number | null; clientTelegramId?: number | string | null; masterPhotoUrl?: string; services: Service[]; schedule: Schedule; appointments: Appointment[]; timeBlocks: TimeBlock[]; recurringBreaks: RecurringBreak[]; onBookAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>; showToast: (message: string) => void; onOpenDashboard?: () => void; showBookingsButton?: boolean; }> = ({ masterName, profession, masterId, masterTelegramId, clientTelegramId, masterPhotoUrl, services, schedule, appointments, timeBlocks, recurringBreaks, onBookAppointment, showToast, onOpenDashboard, showBookingsButton = false }) => {
    const [bookingService, setBookingService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastAppointmentId, setLastAppointmentId] = useState<string | null>(null);

    const filteredServices = useMemo(() => {
        if (!searchTerm) return services;
        return services.filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [services, searchTerm]);

    useEffect(() => {
        const handler = () => tg.close();
        BackButton.push(handler);
        return () => BackButton.pop(handler);
    }, []);

    // --- НАЧАЛО ОТЛАДОЧНОЙ ВЕРСИИ ФУНКЦИИ handleBook ---
    const handleBook = async (clientName: string, clientPhone: string, date: string, time: string) => {
        console.log('='.repeat(80));
        console.log('--- ШАГ 1: Начало процесса создания записи (handleBook) ---');
        console.log('Полученные данные для записи:', {
            clientName,
            clientPhone,
            date,
            time,
            bookingService: bookingService ? { name: bookingService.name, duration: bookingService.duration } : null
        });

        if (!bookingService) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: bookingService не определен!');
            return;
        }

        console.log('--- ШАГ 2: Получение и валидация ID мастера ---');
        // Получаем chat_id мастера (приоритет — состояние, иначе из URL параметра)
        const masterTelegramChatId = masterTelegramId ?? getMasterId();
        console.log('masterTelegramId из состояния:', masterTelegramId);
        console.log('getMasterId() из URL:', getMasterId());
        console.log('Итоговый masterTelegramChatId:', masterTelegramChatId);

        if (!masterTelegramChatId) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ 2: Некорректный masterId!');
            showToast('⚠️ Некорректный masterId. Откройте приложение через кнопку в Telegram.');
            return;
        }
        console.log('✅ ШАГ 2 УСПЕШЕН: masterId валиден');

        console.log('--- ШАГ 3: Получение telegramId клиента ---');
        // Определяем telegramId клиента (может быть null, если клиент не нажал Start в боте)
        let resolvedClientTelegramId: string | number | null | undefined = clientTelegramId;
        if (resolvedClientTelegramId == null) {
            resolvedClientTelegramId = getTelegramUserId();
        }
        if (resolvedClientTelegramId == null) {
            try {
                const stored = window.localStorage.getItem('telegramId');
                if (stored) {
                    resolvedClientTelegramId = /^\d+$/.test(stored) ? Number(stored) : stored;
                }
            } catch (storageError) {
                console.warn('Не удалось получить telegramId из localStorage в ClientBookingPage:', storageError);
            }
        }
        console.log('clientTelegramId:', resolvedClientTelegramId);

        if (resolvedClientTelegramId == null) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ 3: Telegram ID клиента отсутствует');
            showToast('⚠️ Откройте бот и нажмите /start, чтобы продолжить запись.');
            return;
        }

        try {
            window.localStorage.setItem('telegramId', String(resolvedClientTelegramId));
        } catch (storageError) {
            console.warn('Не удалось сохранить telegramId в localStorage при бронировании клиента:', storageError);
        }

        console.log('✅ ШАГ 3 ЗАВЕРШЕН');

        console.log('--- ШАГ 4: Валидация форматов даты и времени ---');
        // Валидация форматов
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ 4: Неверный формат даты:', date);
            showToast('⚠️ Неверный формат даты. Используйте YYYY-MM-DD.');
            return;
        }
        console.log('✅ Формат даты валиден:', date);

        if (!/^\d{2}:\d{2}$/.test(time)) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ 4: Неверный формат времени:', time);
            showToast('⚠️ Неверный формат времени. Используйте HH:mm.');
            return;
        }
        console.log('✅ Формат времени валиден:', time);
        console.log('✅ ШАГ 4 УСПЕШЕН: Все форматы валидны');

        try {
            console.log('--- ШАГ 5: Подготовка данных для создания записи в Directus ---');
            // Сначала создаем запись в Directus, чтобы получить appointmentId
            const normalizedPhone = clientPhone?.trim?.() ?? '';
            const appointmentData: Omit<Appointment, 'id'> = {
                clientName,
                service: bookingService.name,
                serviceId: bookingService.id ?? null,
                date,
                time,
                duration: bookingService.duration,
                telegramId: resolvedClientTelegramId ?? undefined
            };
            if (normalizedPhone) {
                appointmentData.clientPhone = normalizedPhone;
            }
            console.log('Данные для записи (appointmentData):', appointmentData);

            console.log('--- ШАГ 6: Вызов onBookAppointment (создание записи в Directus) ---');
            // Создаем запись и получаем её ID
            const createdAppointment = await onBookAppointment(appointmentData);
            console.log('✅ УСПЕХ! Запись в Directus создана. Ответ:', createdAppointment);

            console.log('--- ШАГ 7: Финализация (haptic feedback, toast, UI обновление) ---');
            tg.HapticFeedback.notificationOccurred('success');

            // Сохраняем ID записи для показа кнопки подписки
            setLastAppointmentId(createdAppointment.id);
            console.log('Сохранен lastAppointmentId:', createdAppointment.id);

            showToast(`✅ Спасибо, ${clientName}! Вы записаны.`);
            setBookingService(null);
            console.log('✅ ШАГ 7 УСПЕШЕН: UI обновлен');
            console.log('--- ШАГ 8: Процесс создания записи ПОЛНОСТЬЮ ЗАВЕРШЕН УСПЕШНО ---');
            console.log('='.repeat(80));
        } catch (err: any) {
            console.error('='.repeat(80));
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА В БЛОКЕ TRY: Процесс создания записи прерван!');
            console.error('Тип ошибки:', err?.constructor?.name);
            console.error('Сообщение ошибки:', err?.message);
            console.error('Stack trace:', err?.stack);
            console.error('Полный объект ошибки:', err);
            console.error('='.repeat(80));

            const errorMsg = err?.message || 'Неизвестная ошибка';

            if (errorMsg.includes('не написал боту') || errorMsg.includes('chat not found')) {
                console.log('Тип ошибки: Клиент не написал боту');
                showToast('⚠️ Пожалуйста, откройте бот и нажмите /start, затем попробуйте снова.');
            } else if (errorMsg.includes('заблокировал бота') || errorMsg.includes('blocked')) {
                console.log('Тип ошибки: Бот заблокирован');
                showToast('⚠️ Бот заблокирован. Разблокируйте бота в Telegram и попробуйте снова.');
            } else {
                console.log('Тип ошибки: Общая ошибка');
                showToast(`❌ ${errorMsg}`);
            }
        }
    };
    // --- КОНЕЦ ОТЛАДОЧНОЙ ВЕРСИИ ФУНКЦИИ handleBook ---

    return (
        <>
            {bookingService && <BookingPanel service={bookingService} schedule={schedule} appointments={appointments} timeBlocks={timeBlocks} recurringBreaks={recurringBreaks} onBook={handleBook} onClose={() => setBookingService(null)} />}
            <div className="container client-view-container">
                <div className="master-profile-header">
                    <Avatar name={masterName} photoUrl={masterPhotoUrl} />
                    <h2>{masterName}</h2>
                    <p>{profession}</p>
                </div>
                {showBookingsButton && onOpenDashboard && (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            paddingTop: 0,
                            paddingBottom: '12px',
                            paddingLeft: 'calc(10px + var(--safe-area-inset-left, 0px))',
                            paddingRight: 'calc(40px + var(--safe-area-inset-right, 0px))',
                            boxSizing: 'border-box'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onOpenDashboard}
                            style={{
                                border: '1.5px solid var(--tg-theme-link-color, #2481cc)',
                                background: 'transparent',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontWeight: 700,
                                fontSize: '14px',
                                color: 'var(--tg-theme-link-color, #2481cc)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginRight: 0
                            }}
                        >
                            Мои записи
                        </button>
                    </div>
                )}

                {lastAppointmentId && (
                    <>
                        <BookingCard bookingId={lastAppointmentId} showContactButton={false} />
                        <TelegramSubscriptionButton appointmentId={lastAppointmentId} />
                    </>
                )}

                <div className="services-list-container">
                    {filteredServices.length > 0 ? filteredServices.map((service, index) => (
                        <div key={index} className="service-card">
                            <div className="service-card-info">
                                <span className="service-name">{service.name}</span>
                                <span className="service-details">{service.duration} мин.</span>
                            </div>
                            <div className="service-card-actions">
                                <span className="service-price">{service.price} ₽</span>
                                <button className="btn" onClick={() => {
                                    setBookingService(service);
                                    tg.HapticFeedback.impactOccurred('light');
                                }}>Запись</button>
                            </div>
                        </div>
                    )) : <p className="no-results-message">Услуги не найдены.</p>}
                </div>
            </div>
        </>
    );
};

const ScheduleEditor: FC<{ schedule: Schedule; setSchedule: (schedule: Schedule) => void; }> = ({ schedule, setSchedule }) => {
    const days = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };
    const handleDayChange = (day: string, field: keyof DaySchedule, value: any) => setSchedule({ ...schedule, [day]: { ...schedule[day], [field]: value } });

    return (
        <div className="schedule-editor">
            {Object.entries(days).map(([key, name]) => (
                <div className="schedule-day" key={key}>
                    <div className="schedule-day-toggle"><input type="checkbox" id={`check-${key}`} checked={schedule[key]?.enabled || false} onChange={e => handleDayChange(key, 'enabled', e.target.checked)} /><label htmlFor={`check-${key}`}>{name}</label></div>
                    <div className="form-group"><input type="time" className="form-control" value={schedule[key]?.startTime || '09:00'} onChange={e => handleDayChange(key, 'startTime', e.target.value)} disabled={!schedule[key]?.enabled} /></div>
                    <div className="form-group"><input type="time" className="form-control" value={schedule[key]?.endTime || '18:00'} onChange={e => handleDayChange(key, 'endTime', e.target.value)} disabled={!schedule[key]?.enabled} /></div>
                </div>
            ))}
        </div>
    );
};


const Popover: FC<{ children: React.ReactNode; onClose: () => void; position: { top: number; left: number }; ref: React.Ref<HTMLDivElement> }> = React.forwardRef(({ children, onClose, position }, ref) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) { onClose(); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, ref]);
    return <div className="appointment-popover" ref={ref} style={position}>{children}</div>;
});

type CalendarPopoverState =
    | { type: 'appointment'; position: { top: number; left: number }; appointment: Appointment }
    | { type: 'block'; position: { top: number; left: number }; block: TimeBlock };

type CalendarPopoverPayload =
    | { type: 'appointment'; appointment: Appointment }
    | { type: 'block'; block: TimeBlock };

const CalendarView: FC<{ appointments: Appointment[], timeBlocks: TimeBlock[], onCancelAppointment: (id: string) => void, onAddTimeBlock: () => void, onAddAppointment: () => void, onRemoveTimeBlock: (id: string) => void, onShowToast?: (message: string) => void }> = ({ appointments, timeBlocks, onCancelAppointment, onAddTimeBlock, onAddAppointment, onRemoveTimeBlock, onShowToast }) => {
    // Remove emojis and pictographs from displayed text in the calendar
    const stripEmojis = useCallback(stripEmojiCharacters, []);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popover, setPopover] = useState<CalendarPopoverState | null>(null);
    const [contactLoadingId, setContactLoadingId] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
        d.setHours(0, 0, 0, 0);
        return d;
    }, [currentDate]);

    const calendarTitle = useMemo(() => {
        const formatted = startOfWeek.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        const cleaned = formatted.replace(/[\s\u00A0\u202F]*г\.?$/i, '');
        if (!cleaned) {
            return '';
        }
        return cleaned.charAt(0).toLocaleUpperCase('ru-RU') + cleaned.slice(1);
    }, [startOfWeek]);
    const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    // Display hour labels without trailing ":00" to save space
    const timeLabels = Array.from({ length: 15 }, (_, i) => `${i + 8}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventGapPx = 8;

    const openPopover = (event: React.MouseEvent, payload: CalendarPopoverPayload) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const popoverWidth = 250; // Ширина popover из CSS
        const popoverHeight = 200; // Примерная высота popover
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Горизонтальное позиционирование
        const spaceOnRight = viewportWidth - rect.right;
        const spaceOnLeft = rect.left;

        let left = rect.left + window.scrollX;

        // Если не помещается справа, но помещается слева - открываем слева
        if (spaceOnRight < popoverWidth && spaceOnLeft > popoverWidth) {
            left = rect.right + window.scrollX - popoverWidth;
        }
        // Если не помещается ни справа, ни слева - центрируем
        else if (spaceOnRight < popoverWidth && spaceOnLeft < popoverWidth) {
            left = (viewportWidth - popoverWidth) / 2 + window.scrollX;
        }

        // Вертикальное позиционирование
        const spaceBelow = viewportHeight - rect.bottom;
        let top = rect.bottom + window.scrollY;

        // Если не помещается снизу - открываем сверху
        if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
            top = rect.top + window.scrollY - popoverHeight;
        }

        setPopover({
            ...payload,
            position: {
                top: Math.max(10, top), // Минимум 10px от верха
                left: Math.max(10, Math.min(left, viewportWidth - popoverWidth - 10)) // Ограничиваем справа
            }
        });
    };

    const notify = useCallback(
        (message: string) => {
            if (onShowToast) {
                onShowToast(message);
            } else {
                alert(message);
            }
        },
        [onShowToast]
    );

    const handleContactClick = useCallback(
        async (appointment: Appointment) => {
            setContactLoadingId(appointment.id);
            try {
                console.log('🔘 Contact button clicked for booking:', appointment.id);
                const response = await getClientContactLink(String(appointment.id));
                openContactLink(response);
            } catch (error) {
                console.error('Error getting contact link:', error);
                WebApp.showAlert('Не удалось получить контакт');
            } finally {
                setContactLoadingId(null);
            }
        },
        []
    );

    return (
        <div className="calendar-container">
            {popover && (
                <Popover onClose={() => setPopover(null)} position={popover.position} ref={popoverRef}>
                    {popover.type === 'appointment' ? (
                        <>
                            <h4>{stripEmojis(popover.appointment.clientName)}</h4>
                            <p><strong>Услуга:</strong> {stripEmojis(popover.appointment.service)}</p>
                            <p><strong>Время:</strong> {popover.appointment.time} ({popover.appointment.duration} мин)</p>
                            {popover.appointment.clientPhone && <p><strong>Телефон:</strong> {popover.appointment.clientPhone}</p>}
                            <button
                                type="button"
                                onClick={() => handleContactClick(popover.appointment)}
                                disabled={contactLoadingId === popover.appointment.id}
                                style={{
                                    width: '100%',
                                    marginBottom: '12px',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: contactLoadingId === popover.appointment.id ? 'default' : 'pointer',
                                    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                                    color: 'var(--tg-theme-button-text-color, #fff)',
                                    fontWeight: 600
                                }}
                            >
                                {contactLoadingId === popover.appointment.id ? 'Загрузка...' : 'Написать клиенту'}
                            </button>
                            <button className="delete-btn" onClick={() => { onCancelAppointment(popover.appointment.id); setPopover(null); }}>
                                Отменить запись
                            </button>
                        </>
                    ) : (
                        <>
                            <h4>Блок: {popover.block.title}</h4>
                            <p><strong>Время:</strong> {popover.block.startTime} - {popover.block.endTime}</p>
                            <button className="delete-btn" onClick={() => { onRemoveTimeBlock(popover.block.id); setPopover(null); }}>Разблокировать</button>
                        </>
                    )}
                </Popover>
            )}
            <div className="calendar-header">
                <h3>{calendarTitle}</h3>
                <div className="calendar-nav">
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))}>‹</button>
                    <button onClick={() => setCurrentDate(new Date())}>Сегодня</button>
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))}>›</button>
                </div>
                <div className="calendar-actions">
                    <button className="add-block-btn" onClick={onAddTimeBlock}>Блок</button>
                    <button className="add-appointment-btn" onClick={onAddAppointment}>+ Запись</button>
                </div>
            </div>
            <div className="calendar-grid">
                <div className="calendar-time-labels">{timeLabels.map(time => <div key={time} className="time-label">{time}</div>)}</div>
                <div className="calendar-background-grid">
                    {timeLabels.map(time => <div key={time} className="calendar-grid-line" />)}
                </div>
                {weekDays.map(day => {
                    // Получаем часовой пояс пользователя и форматируем дату корректно
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const dayString = formatTz(day, 'yyyy-MM-dd', { timeZone });
                    const isToday = day.getTime() === today.getTime();
                    return (
                        <div key={day.toISOString()} className="calendar-day-column">
                            <div className={`calendar-day-header ${isToday ? 'today' : ''}`}>{day.toLocaleDateString('ru-RU', { weekday: 'short' })}<br />{day.getDate()}</div>
                            <div className="day-column">
                                {appointments.filter(a => a.date === dayString).map(appt => {
                                    const [hour, minute] = appt.time.split(':').map(Number);
                                    const top = (hour - 8 + minute / 60) * 60;
                                    const height = appt.duration;
                                    // Dynamic text clamps based on event height (in minutes == px)
                                    const clamps = (() => {
                                        if (height < 24) return { t: 1, s: 0 };        // very short
                                        if (height < 40) return { t: 1, s: 1 };        // short
                                        if (height < 60) return { t: 2, s: 1 };        // medium
                                        if (height < 90) return { t: 2, s: 2 };        // long
                                        return { t: 2, s: 3 };                          // very long
                                    })();
                                    const popoverPayload: CalendarPopoverPayload = {
                                        type: 'appointment',
                                        appointment: appt
                                    };
                                    const adjustedTop = top;
                                    const adjustedHeight = Math.max(height - eventGapPx, Math.min(height, 6));
                                    return (
                                        <div
                                            key={appt.id}
                                            className="appointment-block"
                                            style={{ top: `${adjustedTop}px`, height: `${adjustedHeight}px`, ['--title-clamp' as any]: clamps.t, ['--subtitle-clamp' as any]: clamps.s } as React.CSSProperties}
                                            title={`${stripEmojis(appt.clientName)} — ${stripEmojis(appt.service)}`}
                                            onClick={(e) => openPopover(e, popoverPayload)}
                                        >
                                            <strong className="appointment-title">{stripEmojis(appt.clientName)}</strong>
                                            {clamps.s > 0 && (
                                                <span className="appointment-subtitle">{stripEmojis(appt.service)}</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {timeBlocks.filter(b => b.date === dayString).map(block => {
                                    const [startHour, startMinute] = block.startTime.split(':').map(Number); const [endHour, endMinute] = block.endTime.split(':').map(Number);
                                    const top = (startHour - 8 + startMinute / 60) * 60; const height = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                                    const popoverPayload: CalendarPopoverPayload = {
                                        type: 'block',
                                        block
                                    };
                                    return <div key={block.id} className="time-block-block" style={{ top: `${top}px`, height: `${height}px` }} onClick={(e) => openPopover(e, popoverPayload)}>{block.title}</div>;
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const StatisticsCard: FC<{ appointments: Appointment[], services: Service[] }> = ({ appointments, services }) => {
    const stats = useMemo(() => {
        const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
        const monthlyAppointments = appointments.filter(appt => { const apptDate = new Date(appt.date); return apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear; });
        const revenue = monthlyAppointments.reduce((sum, appt) => { const service = services.find(s => s.name === appt.service); return sum + (service?.price || 0); }, 0);
        const serviceCounts = monthlyAppointments.reduce((acc, appt) => { acc[appt.service] = (acc[appt.service] || 0) + 1; return acc; }, {} as Record<string, number>);
        const popularServiceRaw = Object.keys(serviceCounts).sort((a, b) => serviceCounts[b] - serviceCounts[a])[0];
        const popularService = stripEmojiCharacters(popularServiceRaw) || '—';
        return { count: monthlyAppointments.length, revenue: revenue.toLocaleString('ru-RU'), popularService };
    }, [appointments, services]);
    return (
        <section className="tg-section"><div className="tg-section-header"><h2>Статистика (этот месяц)</h2></div><div className="tg-section-content statistics-card">
            <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-value">{stats.count}</div>
                <div className="stat-label">записей</div>
            </div>
            <div className="stat-item">
                <div className="stat-icon stat-icon-gold">🪙</div>
                <div className="stat-value">{stats.revenue}₽</div>
                <div className="stat-label">Доход</div>
            </div>
            <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-value small-text">{stats.popularService}</div>
                <div className="stat-label">Популярная услуга</div>
            </div>
        </div></section>
    );
};

const RemindersCard: FC<{ appointments: Appointment[]; onSendReminder: (id: string) => void | Promise<void> }> = ({ appointments, onSendReminder }) => {
    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    const upcomingAppointments = appointments.filter(a => a.date === tomorrow);

    return (
        <section className="tg-section">
            <div className="tg-section-header"><h2>Напоминания на завтра</h2></div>
            <div className="tg-section-content no-padding">
                <ul className="tg-list">
                    {upcomingAppointments.length > 0 ? upcomingAppointments.map(appt => (
                        <li key={appt.id} className="tg-list-item reminder-item">
                            <div>
                                <span>{appt.clientName}</span>
                                <span>{appt.time}, {appt.service}</span>
                            </div>
                            <button className="btn" onClick={() => onSendReminder(appt.id)} disabled={!appt.telegramId || appt.reminderSent} >
                                {appt.reminderSent ? 'Отправлено' : 'Напомнить'}
                            </button>
                        </li>
                    )) : <p style={{ padding: '15px', margin: 0, color: 'var(--tg-theme-hint-color)' }}>На завтра записей нет.</p>}
                </ul>
            </div>
        </section>
    );
};

// --- BOTTOM SHEET CONTENT COMPONENTS ---
const ProfileSheet: FC<{ masterId: number | null, masterName: string, setMasterName: (s: string) => void, profession: string, setProfession: (s: string) => void, onClose: () => void, showToast?: (message: string) => void }> = ({ masterId, masterName, setMasterName, profession, setProfession, onClose, showToast }) => {
    const [localName, setLocalName] = useState(masterName);
    const [localProfession, setLocalProfession] = useState(profession);
    const [localAddress, setLocalAddress] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { handleFocus: handleInputFocus } = useInputFocus();

    // Load current master profile to prefill address
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!masterId) return;
            try {
                setIsLoading(true);
                const info = await getMasterInfo(masterId);
                if (!cancelled) {
                    setLocalAddress(info?.address || '');
                    // Optionally sync name/profession from server if desired
                }
            } catch (e) {
                console.warn('Не удалось загрузить профиль мастера:', e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [masterId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Prefer masterId from props; fallback to resolving via telegramId if absent
            let idToUse: number | null | undefined = masterId;
            if (!idToUse) {
                const telegramId = tg.initDataUnsafe?.user?.id;
                const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`);
                idToUse = masterResponse.data.data[0]?.id;
            }

            if (!idToUse) {
                showToast?.('Ошибка: не найден профиль мастера.');
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            // 1) Сохраняем name/profession в Directus (как и раньше)
            await directusApi.patch(`/items/masters/${idToUse}`, {
                name: localName,
                profession: localProfession
            });

            // 2) Сохраняем address в backend API
            try {
                await updateMaster(idToUse, { address: localAddress || '' });
            } catch (e) {
                console.error('Ошибка сохранения адреса:', e);
                throw e;
            }

            setMasterName(localName);
            setProfession(localProfession);
            tg.HapticFeedback.notificationOccurred('success');
            showToast?.('Профиль успешно обновлен');
            onClose();
        } catch (err) {
            console.error('Ошибка сохранения профиля:', err);
            tg.HapticFeedback.notificationOccurred('error');
            showToast?.('Не удалось сохранить профиль');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BottomSheet title="Профиль мастера" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-group"><label>Ваше имя</label><input type="text" className="form-control" value={localName} onChange={(e) => setLocalName(e.target.value)} onFocus={handleInputFocus} /></div>
                <div className="form-group"><label>Ваша специализация</label><input type="text" className="form-control" value={localProfession} onChange={(e) => setLocalProfession(e.target.value)} onFocus={handleInputFocus} /></div>
                <div className="form-group"><label>Ваш рабочий адрес (необязательно)</label>
                    <textarea className="form-control" rows={3} placeholder="г. Москва, ул. ..." value={localAddress} onChange={(e) => setLocalAddress(e.target.value)} onFocus={handleInputFocus} />
                </div>
                <button type="submit" className="btn" disabled={isSaving}>
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </form>
        </BottomSheet>
    );
};
const ServicesSheet: FC<{ services: Service[], setServices: (s: Service[]) => void, showToast: (message: string) => void, onClose: () => void }> = ({ services, setServices, showToast, onClose }) => {
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');
    const [newServiceDuration, setNewServiceDuration] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newServiceName && newServicePrice && !isSubmitting) {
            const price = parseFloat(newServicePrice);
            const duration = newServiceDuration ? parseInt(newServiceDuration, 10) : 60; // По умолчанию 60 минут
            if (!isNaN(price)) {
                setIsSubmitting(true);
                try {
                    const telegramId = tg.initDataUnsafe?.user?.id;
                    // Получаем ID мастера
                    const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`);
                    const masterId = masterResponse.data.data[0]?.id;

                    if (masterId) {
                        const response = await directusApi.post('/items/services', {
                            master: masterId,
                            name: newServiceName,
                            price,
                            duration
                        });

                        setServices([...services, response.data.data]);
                        setNewServiceName('');
                        setNewServicePrice('');
                        setNewServiceDuration('');
                        tg.HapticFeedback.notificationOccurred('success');
                    }
                } catch (err) {
                    console.error('Ошибка добавления услуги:', err);
                    tg.HapticFeedback.notificationOccurred('error');
                } finally {
                    setIsSubmitting(false);
                }
            }
        }
    };

    const handleDeleteService = async (serviceId: string, index: number) => {
        try {
            await directusApi.delete(`/items/services/${serviceId}`);
            setServices(services.filter((_, i) => i !== index));
            tg.HapticFeedback.notificationOccurred('success');
        } catch (err) {
            console.error('Ошибка удаления услуги:', err);
            tg.HapticFeedback.notificationOccurred('error');
        }
    };

    const handleDownloadTemplate = async () => {
        const headers = ['Название', 'Цена', 'Длительность'];
        const exampleData = [
            'Маникюр + гель-лак,1500,90',
            'Стрижка мужская,1000,45'
        ];
        const csvContent = headers.join(',') + '\n' + exampleData.join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = 'services_template.csv';

        const fallbackDownload = () => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.rel = 'noopener';
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('✅ Шаблон сохранён.');
            tg.HapticFeedback.notificationOccurred('success');
        };

        const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        const shareData: ShareData & { files: File[] } = {
            title: 'Шаблон услуг',
            text: 'Файл, который можно импортировать в мини-приложение «Запиши меня».',
            files: [new File([blob], fileName, { type: 'text/csv' })]
        };

        if (nav?.share && nav?.canShare && nav.canShare({ files: shareData.files })) {
            try {
                await nav.share(shareData);
                showToast('✅ Шаблон отправлен.');
                tg.HapticFeedback.notificationOccurred('success');
            } catch (error) {
                if ((error as DOMException)?.name !== 'AbortError') {
                    fallbackDownload();
                }
            }
            return;
        }

        fallbackDownload();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) {
                showToast("Ошибка: Файл пустой.");
                return;
            }
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const importedServices: Service[] = [];

                // Проверяем, является ли первая строка заголовком, и начинаем со следующей, если да.
                const startIndex = (lines[0] && lines[0].toLowerCase().includes('название')) ? 1 : 0;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i];
                    const [name, priceStr, durationStr] = line.split(',').map(s => s.trim());
                    const price = parseFloat(priceStr);
                    const duration = parseInt(durationStr, 10);

                    if (name && !isNaN(price) && !isNaN(duration)) {
                        importedServices.push({ name, price, duration });
                    } else {
                        console.warn(`Skipping invalid line ${i + 1}: ${line}`);
                    }
                }

                if (importedServices.length > 0) {
                    // Проверяем на дубликаты, чтобы не добавлять существующие услуги
                    const existingServiceNames = new Set(services.map(s => s.name.toLowerCase()));
                    const newUniqueServices = importedServices.filter(is => !existingServiceNames.has(is.name.toLowerCase()));

                    if (newUniqueServices.length === 0) {
                        showToast("Все услуги из файла уже существуют.");
                        return;
                    }

                    // Получаем ID мастера
                    const telegramId = tg.initDataUnsafe?.user?.id;
                    const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`);
                    const masterId = masterResponse.data.data[0]?.id;

                    if (!masterId) {
                        showToast("Ошибка: не найден профиль мастера.");
                        return;
                    }

                    // Сохраняем каждую услугу в базу данных
                    const savedServices: Service[] = [];
                    let successCount = 0;
                    let errorCount = 0;

                    for (const service of newUniqueServices) {
                        try {
                            const response = await directusApi.post('/items/services', {
                                master: masterId,
                                name: service.name,
                                price: service.price,
                                duration: service.duration
                            });
                            savedServices.push(response.data.data);
                            successCount++;
                        } catch (err) {
                            console.error(`Ошибка при сохранении услуги "${service.name}":`, err);
                            errorCount++;
                        }
                    }

                    if (savedServices.length > 0) {
                        setServices([...services, ...savedServices]);
                        showToast(`Импортировано ${successCount} услуг${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}.`);
                        tg.HapticFeedback.notificationOccurred('success');
                    } else {
                        showToast("Не удалось импортировать услуги. Проверьте подключение.");
                    }
                } else {
                    showToast("Не найдено корректных услуг для импорта.");
                }
            } catch (error) {
                console.error("Error parsing CSV:", error);
                showToast("Ошибка при чтении файла. Убедитесь, что формат верный.");
            } finally {
                // Сбрасываем значение input, чтобы можно было загрузить тот же файл снова
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const { handleFocus: handleInputFocus } = useInputFocus();
    const footerContent = (
        <div className="services-form-section">
            <form
                onSubmit={handleAddService}
                className="add-service-form"
            >
                <div className="form-group"><label>Название</label><input type="text" className="form-control" placeholder="Стрижка" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} onFocus={handleInputFocus} required /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group"><label>Цена (₽)</label><input type="number" className="form-control" placeholder="1000" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} onFocus={handleInputFocus} required /></div>
                    <div className="form-group"><label>Время (мин)</label><input type="number" className="form-control" placeholder="60 (необязательно)" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} onFocus={handleInputFocus} /></div>
                </div>
                <button type="submit" className="btn">Добавить услугу</button>
            </form>

            <div className="import-section">
                <p className="import-description">
                    Скачайте шаблон, заполните его и импортируйте, чтобы быстро добавить много услуг.
                </p>
                <div className="import-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate}>
                        <Icon name="download" />
                        Скачать шаблон
                    </button>

                    <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".csv" />
                    <button type="button" className="btn" onClick={handleImportClick}>
                        <Icon name="upload" />
                        Импортировать из файла
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <BottomSheet title="Мои услуги" onClose={onClose} footerContent={footerContent}>
            <div className="services-list">
                {services.length > 0 ? (
                    <ul className="tg-list">
                        {services.map((service, index) => (
                            <li key={index} className="tg-list-item">
                                <div className="tg-list-item-content">
                                    <div>
                                        <div className="text-main">{service.name}</div>
                                        <div className="text-secondary">{service.price} ₽, {service.duration} мин.</div>
                                    </div>
                                </div>
                                <button className="delete-btn" onClick={() => handleDeleteService(service.id || '', index)} title="Удалить услугу">×</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-results-message" style={{ marginTop: '10px' }}>Добавьте первую услугу, чтобы начать.</p>
                )}
            </div>
        </BottomSheet>
    );
};
const ClientsSheet: FC<{ appointments: Appointment[], services: Service[], clientNotes: Record<string, string>, setClientNotes: (notes: Record<string, string>) => void, showToast: (message: string) => void, onClose: () => void }> = ({ appointments, services, clientNotes, setClientNotes, showToast, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo<Client[]>(() => {
        const clientMap = new Map<string, Client>();
        appointments.forEach(appt => { const normalizedName = appt.clientName.trim().toLowerCase(); const existingClient = clientMap.get(normalizedName); if (existingClient) { existingClient.appointmentsCount++; if (appt.clientPhone && !existingClient.phone) existingClient.phone = appt.clientPhone; } else { clientMap.set(normalizedName, { name: appt.clientName.trim(), phone: appt.clientPhone, appointmentsCount: 1 }); } });

        const allClients = Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        if (!searchTerm) {
            return allClients;
        }

        // Логика фильтрации: ищем совпадения в имени (без учета регистра)
        // и в номере телефона (сравнивая только цифры)
        return allClients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone && client.phone.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')))
        );
    }, [appointments, searchTerm]);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isContactLoading, setIsContactLoading] = useState(false);
    const clientAppointments = appointments.filter(a => selectedClient && a.clientName.trim().toLowerCase() === selectedClient.name.trim().toLowerCase()).sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
    const latestAppointment = clientAppointments[0];

    const handleContactClick = async () => {
        if (!latestAppointment) {
            WebApp.showAlert('Для этого клиента нет записей.');
            return;
        }
        try {
            console.log('🔘 Contact button clicked for client:', latestAppointment.id);
            const response = await getClientContactLink(String(latestAppointment.id));
            openContactLink(response);
        } catch (error) {
            console.error('Error getting contact link:', error);
            WebApp.showAlert('Не удалось получить контакт');
        }
    };

    const handleExportCSV = async () => {
        const headers = ['Дата', 'Время', 'Имя клиента', 'Телефон клиента', 'Услуга', 'Длительность (мин)', 'Цена (₽)'];
        let csvContent = headers.join(',') + '\n';

        const sortedAppointments = [...appointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        sortedAppointments.forEach(appt => {
            const service = services.find(s => s.name === appt.service);
            const price = service ? service.price : 0;
            const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
            const row = [
                new Date(appt.date).toLocaleDateString('ru-RU'),
                appt.time,
                escapeCSV(appt.clientName),
                escapeCSV(appt.clientPhone || ''),
                escapeCSV(appt.service),
                appt.duration,
                price
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `zapisi_${dateStr}.csv`;

        const fallbackDownload = () => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.rel = 'noopener';
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('✅ Файл сохранён.');
            tg.HapticFeedback.notificationOccurred('success');
        };

        const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        const shareData: ShareData & { files: File[] } = {
            title: 'Экспорт записей',
            text: 'CSV с клиентскими записями из мини-приложения «Запиши меня».',
            files: [new File([blob], fileName, { type: 'text/csv' })]
        };

        if (nav?.share && nav?.canShare && nav.canShare({ files: shareData.files })) {
            try {
                await nav.share(shareData);
                showToast('✅ Файл отправлен.');
                tg.HapticFeedback.notificationOccurred('success');
            } catch (error) {
                if ((error as DOMException)?.name !== 'AbortError') {
                    fallbackDownload();
                }
            }
            return;
        }

        fallbackDownload();
    };

    const exportButton = (
        <button className="icon-btn" onClick={handleExportCSV} title="Экспорт в CSV">
            <Icon name="download" />
        </button>
    );

    const searchContent = (
        <div className="search-filter-container">
            <input
                type="search"
                className="form-control"
                placeholder="Найти по имени или телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    );

    const normalizedSelectedName = selectedClient?.name.trim().toLowerCase() ?? '';

    return (
        <>
            <BottomSheet title="Мои клиенты" onClose={onClose} actions={exportButton} fixedContent={searchContent}>
                <ul className="tg-list">{filteredClients.length > 0 ? filteredClients.map((client, index) => (<li key={index} className="tg-list-item" onClick={() => setSelectedClient(client)}>
                    <div className="tg-list-item-content"><div><div className="text-main">{client.name}</div><div className="text-secondary">{client.phone || 'Телефон не указан'}</div></div></div>
                    <div className="tg-list-item-side">Записей: {client.appointmentsCount}</div>
                </li>)) : <p className="no-results-message">Клиенты не найдены.</p>}</ul>
            </BottomSheet>

            {selectedClient && (
                <BottomSheet title={selectedClient.name} onClose={() => setSelectedClient(null)}>
                    <p style={{ textAlign: 'center', marginTop: 0, color: 'var(--tg-theme-hint-color)' }}>{selectedClient.phone || 'Телефон не указан'}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={handleContactClick}
                            disabled={!latestAppointment || isContactLoading}
                        >
                            {isContactLoading ? 'Загрузка...' : 'Написать клиенту'}
                        </button>
                    </div>

                    <div className="form-group"><label>Заметки о клиенте</label><textarea className="form-control" rows={4} value={clientNotes[normalizedSelectedName] || ''} onChange={e => setClientNotes({ ...clientNotes, [normalizedSelectedName]: e.target.value })} placeholder="Предпочтения, аллергии, о чем говорили..." /></div>
                    <div className="tg-section-header" style={{ padding: '10px 0', borderTop: '1px solid var(--tg-theme-bg-color)' }}><h4>История записей</h4></div>
                    <ul className="tg-list">
                        {clientAppointments.length > 0 ? clientAppointments.map(appt => (<li key={appt.id} className="tg-list-item"><div><span>{appt.service}</span><span className="text-secondary">{new Date(appt.date).toLocaleDateString('ru-RU')} в {appt.time}</span></div></li>)) : <p>У этого клиента еще не было записей.</p>}
                    </ul>
                </BottomSheet>
            )}
        </>
    );
};
const ScheduleSheet: FC<{ schedule: Schedule; setSchedule: (s: Schedule) => void; masterId: number | null; breaks: RecurringBreak[]; onBreaksChange: (items: RecurringBreak[]) => void; onClose: () => void }> = ({ schedule, setSchedule, masterId, breaks, onBreaksChange, onClose }) => {
    const [localSchedule, setLocalSchedule] = useState(schedule);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const telegramId = tg.initDataUnsafe?.user?.id;
            let resolvedMasterId = masterId;

            if (!resolvedMasterId) {
                const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`);
                resolvedMasterId = masterResponse.data.data[0]?.id ?? null;
            }

            if (resolvedMasterId) {
                // Проверяем, существует ли уже расписание
                const existingScheduleResponse = await directusApi.get(`/items/schedules?filter[master][_eq]=${resolvedMasterId}&fields=id`);

                if (existingScheduleResponse.data.data && existingScheduleResponse.data.data.length > 0) {
                    // Обновляем существующее
                    const scheduleId = existingScheduleResponse.data.data[0].id;
                    await directusApi.patch(`/items/schedules/${scheduleId}`, {
                        schedule: localSchedule
                    });
                } else {
                    // Создаем новое
                    await directusApi.post('/items/schedules', {
                        master: resolvedMasterId,
                        schedule: localSchedule
                    });
                }

                setSchedule(localSchedule);
                tg.HapticFeedback.notificationOccurred('success');
                onClose();
            }
        } catch (err) {
            console.error('Ошибка сохранения расписания:', err);
            tg.HapticFeedback.notificationOccurred('error');
        } finally {
            setIsSaving(false);
        }
    };

    const footerContent = (
        <button
            className="btn"
            onClick={handleSave}
            disabled={isSaving}
            style={{ width: '100%' }}
        >
            {isSaving ? 'Сохранение...' : 'Сохранить расписание'}
        </button>
    );

    return (
        <BottomSheet title="Моё расписание" onClose={onClose} footerContent={footerContent}>
            <ScheduleEditor schedule={localSchedule} setSchedule={setLocalSchedule} />
            {masterId ? (
                <BreakManager masterId={masterId} initialBreaks={breaks} onBreaksChange={onBreaksChange} />
            ) : (
                <p style={{ marginTop: '16px', color: 'var(--tg-theme-hint-color, gray)' }}>
                    Идентификатор мастера не найден. Перезапустите приложение, чтобы управлять перерывами.
                </p>
            )}
        </BottomSheet>
    );
}
const TimeBlockSheet: FC<{ onClose: () => void; onAddBlock: (block: Omit<TimeBlock, 'id'>) => void }> = ({ onClose, onAddBlock }) => {
    const [title, setTitle] = useState('Перерыв'); const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [startTime, setStartTime] = useState('13:00'); const [endTime, setEndTime] = useState('14:00');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAddBlock({ title, date, startTime, endTime }); onClose(); };
    const { handleFocus: handleInputFocus } = useInputFocus();
    return (
        <BottomSheet title="Заблокировать время" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Причина</label><input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} onFocus={handleInputFocus} required /></div>
                <div className="form-group"><label>Дата</label><input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} onFocus={handleInputFocus} required min={new Date().toISOString().split('T')[0]} /></div>
                <div className="form-group"><label>Начало</label><input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} onFocus={handleInputFocus} required /></div>
                <div className="form-group"><label>Конец</label><input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} onFocus={handleInputFocus} required /></div>
                <div className="bottom-sheet-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button><button type="submit" className="btn">Заблокировать</button></div>
            </form>
        </BottomSheet>
    );
};

const AddAppointmentSheet: FC<{
    services: Service[];
    onClose: () => void;
    onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
}> = ({ services, onClose, onAddAppointment }) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');

    const handleInputFocus = useCallback(() => {
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.expand();
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedService = services[selectedServiceIndex];
        const trimmedPhone = clientPhone.trim();
        if (clientName && selectedService && trimmedPhone) {
            onAddAppointment({
                clientName,
                clientPhone: trimmedPhone,
                service: selectedService.name,
                serviceId: selectedService.id ?? null,
                date,
                time,
                duration: selectedService.duration,
            });
            onClose();
        }
    };

    return (
        <BottomSheet title="Создать запись вручную" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Имя клиента</label><input type="text" className="form-control" value={clientName} onChange={e => setClientName(e.target.value)} onFocus={handleInputFocus} required placeholder="Иван Петров" /></div>
                <div className="form-group"><label>Телефон клиента</label><input type="tel" className="form-control" value={clientPhone} onChange={e => setClientPhone(e.target.value)} onFocus={handleInputFocus} placeholder="+7 (999) 123-45-67" required /></div>
                <div className="form-group"><label>Услуга</label>
                    <select className="form-control" value={selectedServiceIndex} onChange={e => setSelectedServiceIndex(parseInt(e.target.value, 10))}>
                        {services.map((service, index) => (<option key={index} value={index}>{service.name} ({service.duration} мин.)</option>))}
                    </select>
                </div>
                <div className="form-group"><label>Дата</label><input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} onFocus={handleInputFocus} required min={new Date().toISOString().split('T')[0]} /></div>
                <div className="form-group"><label>Время</label><input type="time" className="form-control" value={time} onChange={e => setTime(e.target.value)} onFocus={handleInputFocus} required /></div>
                <div className="bottom-sheet-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button><button type="submit" className="btn">Создать запись</button></div>
            </form>
        </BottomSheet>
    );
};

const TasksSheet: FC<{ tasks: Task[], onAddTask: (text: string) => void, onToggleTask: (id: string) => void, onClearCompleted: () => void, onClose: () => void }> = ({ tasks, onAddTask, onToggleTask, onClearCompleted, onClose }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const handleAddTask = (e: React.FormEvent) => { e.preventDefault(); if (newTaskText.trim()) { onAddTask(newTaskText.trim()); setNewTaskText(''); } };
    const completedCount = tasks.filter(t => t.done).length;
    return (
        <BottomSheet title="Мои задачи" onClose={onClose}>
            <div className="tasks-list">
                <ul className="tg-list">{tasks.map(task => (<li key={task.id} className={`task-item ${task.done ? 'done' : ''}`} onClick={() => onToggleTask(task.id)}>
                    <input type="checkbox" className="task-checkbox" checked={task.done} readOnly />
                    <span className="task-text">{task.text}</span>
                </li>))}</ul>
            </div>
            <form onSubmit={handleAddTask} className="add-service-form" style={{ borderTop: '1px solid var(--tg-theme-bg-color)', paddingTop: '15px', marginTop: '0' }}>
                <div className="form-group"><input type="text" className="form-control" placeholder="Новая задача..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} /></div>
                <button type="submit" className="btn">Добавить задачу</button>
            </form>
            {completedCount > 0 && <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={onClearCompleted}>Очистить завершенные ({completedCount})</button>}
        </BottomSheet>
    );
};

const InstructionsSheet: FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <BottomSheet title="📖 Инструкция для пользователя" onClose={onClose} fixedContent={<></>}>
            <div style={{ padding: '15px 20px' }}>
                <p style={{ marginTop: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                    При первом входе настройте профиль, добавьте услуги с ценами и укажите своё рабочее расписание — это займёт всего пару минут.
                </p>

                <h3 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '1.1rem' }}>💼 Основные разделы</h3>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>👤 Профиль</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--tg-theme-hint-color)' }}>
                        Укажите имя и специализацию
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>✂️ Услуги</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: 'var(--tg-theme-hint-color)' }}>
                        <li>Добавьте услуги вручную: название, цену и длительность</li>
                        <li>Или скачайте шаблон, заполните и загрузите его обратно</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>👥 Клиенты</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: 'var(--tg-theme-hint-color)' }}>
                        <li>В базе сохраняются имя, телефон и история посещений</li>
                        <li>Добавляйте заметки о клиентах</li>
                        <li>Кнопка «Написать клиенту» откроет чат в Telegram</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>🗓️ Расписание</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--tg-theme-hint-color)' }}>
                        В открывшемся окне укажите своё рабочее расписание
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>🗓️ Календарь</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: 'var(--tg-theme-hint-color)' }}>
                        <li>Просматривайте записи</li>
                        <li>Блокируйте время на перерывы или выходные</li>
                        <li>Создавайте новые записи вручную</li>
                        <li>Кнопка «Напомнить» отправляет клиенту напоминание о записи</li>
                    </ul>
                </div>

                <h3 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '1.1rem' }}>🔗 Публичная ссылка</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--tg-theme-hint-color)' }}>
                    На главном экране — ваша персональная ссылка. Скопируйте и отправьте её клиентам (в Telegram, Instagram и т. д.) 
                    или разместите в Telegram-канале, любом другом месте. По этой ссылке они смогут записаться к вам онлайн.
                </p>

                <div style={{ marginTop: '15px', marginBottom: '20px', padding: '15px', backgroundColor: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, marginBottom: '10px', fontWeight: 'bold' }}>Клиент видит:</p>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>Услуги и цены</li>
                        <li>Свободное время</li>
                        <li>Форму записи</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, marginBottom: '10px', fontWeight: 'bold' }}>Процесс записи:</p>
                    <p style={{ margin: 0, lineHeight: '1.6' }}>
                        Выбрать услугу → дату → указать имя и телефон → нажать «Записаться» → получить уведомление в Telegram ✅
                    </p>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        (показываются только свободные слоты с учётом вашего графика и записей)
                    </p>
                </div>

                <p style={{ lineHeight: '1.6', color: 'var(--tg-theme-hint-color)' }}>
                    После заполнения полей активируется главная кнопка Telegram «Записаться», клиент нажимает её.
                </p>

                <p style={{ lineHeight: '1.6', marginBottom: '20px', fontWeight: 'bold' }}>
                    Готово. Клиент видит сообщение об успешной записи, а запись мгновенно появляется в вашем календаре в приложении.
                </p>
            </div>
        </BottomSheet>
    );
};

const ExpensesSheet: FC<{ expenses: Expense[], onAddExpense: (desc: string, amount: number) => void, onDeleteExpense: (id: string) => void, onClose: () => void }> = ({ expenses, onAddExpense, onDeleteExpense, onClose }) => {
    const [desc, setDesc] = useState(''); const [amount, setAmount] = useState('');
    const handleAddExpense = (e: React.FormEvent) => { e.preventDefault(); const numAmount = parseFloat(amount); if (desc.trim() && !isNaN(numAmount) && numAmount > 0) { onAddExpense(desc, numAmount); setDesc(''); setAmount(''); } };
    const monthlyTotal = useMemo(() => {
        const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
        return expenses.filter(exp => { const expDate = new Date(exp.date); return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear; })
            .reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const groupedExpenses = useMemo(() => {
        const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.reduce((acc, exp) => {
            const date = new Date(exp.date);
            const monthYear = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(exp);
            return acc;
        }, {} as Record<string, Expense[]>);
    }, [expenses]);

    return (
        <BottomSheet 
            title="Мои расходы" 
            onClose={onClose}
            fixedContent={
                <div className="expense-total">Расходы за этот месяц: <strong>{monthlyTotal.toLocaleString('ru-RU')} ₽</strong></div>
            }
            footerContent={
                <form onSubmit={handleAddExpense} className="add-service-form">
                    <div className="form-group"><label>Описание</label><input type="text" className="form-control" placeholder="Аренда, материалы..." value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                    <div className="form-group"><label>Сумма (₽)</label><input type="number" className="form-control" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                    <button type="submit" className="btn">Добавить расход</button>
                </form>
            }
        >
            <div className="expense-list">
                {Object.entries(groupedExpenses).map(([monthYear, monthExpenses]: [string, Expense[]]) => (
                    <div key={monthYear}>
                        <h4 className="expense-month-header">{monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}</h4>
                        <ul className="tg-list">
                            {monthExpenses.map(exp => (
                                <li key={exp.id} className="tg-list-item">
                                    <div className="tg-list-item-content">
                                        <div>
                                            <div className="text-main">{exp.description}</div>
                                            <div className="text-secondary">{new Date(exp.date).toLocaleDateString('ru-RU')}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <strong style={{ fontSize: '1rem' }}>{exp.amount.toLocaleString('ru-RU')} ₽</strong>
                                        <button className="delete-btn" onClick={() => onDeleteExpense(exp.id)} title="Удалить расход">×</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </BottomSheet>
    );
};

const MasterDashboard: FC<{ masterName: string; masterPhotoUrl?: string; setMasterName: (name: string) => void; profession: string; setProfession: (prof: string) => void; services: Service[]; setServices: (services: Service[]) => void; appointments: Appointment[]; onCancelAppointment: (id: string) => void; onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void; onSendReminder: (id: string) => void; schedule: Schedule; setSchedule: (schedule: Schedule) => void; masterId: number | null; recurringBreaks: RecurringBreak[]; setRecurringBreaks: (items: RecurringBreak[]) => void; timeBlocks: TimeBlock[]; onAddTimeBlock: (block: Omit<TimeBlock, 'id'>) => void; onRemoveTimeBlock: (id: string) => void; showToast: (message: string) => void; tasks: Task[]; onAddTask: (text: string) => void; onToggleTask: (id: string) => void; onClearCompletedTasks: () => void; expenses: Expense[]; onAddExpense: (desc: string, amount: number) => void; onDeleteExpense: (id: string) => void; clientNotes: Record<string, string>; setClientNotes: (notes: Record<string, string>) => void; }> = (props) => {
    const { masterName, masterPhotoUrl, setMasterName, profession, setProfession, services, setServices, appointments, onCancelAppointment, onAddAppointment, onSendReminder, schedule, setSchedule, masterId, recurringBreaks, setRecurringBreaks, timeBlocks, onAddTimeBlock, onRemoveTimeBlock, showToast, tasks, onAddTask, onToggleTask, onClearCompletedTasks, expenses, onAddExpense, onDeleteExpense, clientNotes, setClientNotes } = props;

    type SheetType = 'profile' | 'services' | 'clients' | 'schedule' | 'addBlock' | 'addAppointment' | 'tasks' | 'expenses' | 'instructions';
    const [activeSheet, setActiveSheet] = useState<SheetType | null>(null);

    // Рендерим sheet на основе типа, чтобы он всегда получал актуальные props
    const renderSheet = () => {
        switch (activeSheet) {
            case 'profile':
                return <ProfileSheet masterId={masterId} masterName={masterName} setMasterName={setMasterName} profession={profession} setProfession={setProfession} onClose={() => setActiveSheet(null)} showToast={showToast} />;
            case 'services':
                return <ServicesSheet services={services} setServices={setServices} showToast={showToast} onClose={() => setActiveSheet(null)} />;
            case 'clients':
                return <ClientsSheet appointments={appointments} services={services} clientNotes={clientNotes} setClientNotes={setClientNotes} showToast={showToast} onClose={() => setActiveSheet(null)} />;
            case 'schedule':
                return <ScheduleSheet schedule={schedule} setSchedule={setSchedule} masterId={masterId} breaks={recurringBreaks} onBreaksChange={setRecurringBreaks} onClose={() => setActiveSheet(null)} />;
            case 'addBlock':
                return <TimeBlockSheet onAddBlock={onAddTimeBlock} onClose={() => setActiveSheet(null)} />;
            case 'addAppointment':
                return <AddAppointmentSheet services={services} onAddAppointment={onAddAppointment} onClose={() => setActiveSheet(null)} />;
            case 'tasks':
                return <TasksSheet tasks={tasks} onAddTask={onAddTask} onToggleTask={onToggleTask} onClearCompleted={onClearCompletedTasks} onClose={() => setActiveSheet(null)} />;
            case 'expenses':
                return <ExpensesSheet expenses={expenses} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} onClose={() => setActiveSheet(null)} />;
            case 'instructions':
                return <InstructionsSheet onClose={() => setActiveSheet(null)} />;
            default:
                return null;
        }
    };

    const masterTelegramChatId = tg.initDataUnsafe?.user?.id || 'master';
    // Используем 'menu' - это Short Name, настроенный в @BotFather для Web App
    const publicLink = `https://t.me/${BOT_USERNAME}/menu?startapp=${masterTelegramChatId}`;

    const master = useMemo(() => ({
        name: masterName,
        profession,
        photoUrl: masterPhotoUrl
    }), [masterName, profession, masterPhotoUrl]);

    return (
        <div className="container">
            {renderSheet()}
            <section className="tg-section">
                <div className="tg-section-content app-header">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ marginRight: '14px' }}>
                            <Avatar name={master.name} photoUrl={master.photoUrl} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px' }}>{master.name}</h1>
                            <span style={{ color: 'var(--tg-theme-hint-color, gray)' }}>{master.profession}</span>
                        </div>
                    </div>
                    <div className="public-link-container"><input type="text" readOnly value={publicLink} /><button onClick={() => { navigator.clipboard.writeText(publicLink); showToast('Ссылка скопирована!'); tg.HapticFeedback.notificationOccurred('success'); }} title="Копировать"><Icon name="copy" /></button></div>
                </div>
            </section>

            <StatisticsCard appointments={appointments} services={services} />
            <RemindersCard appointments={appointments} onSendReminder={onSendReminder} />

            <section className="tg-section calendar-full-bleed"><div className="tg-section-header"><h2>Календарь записей</h2></div><div className="tg-section-content no-padding"><CalendarView appointments={appointments} timeBlocks={timeBlocks} onCancelAppointment={onCancelAppointment} onAddTimeBlock={() => setActiveSheet('addBlock')} onAddAppointment={() => setActiveSheet('addAppointment')} onRemoveTimeBlock={onRemoveTimeBlock} onShowToast={showToast} /></div></section>

            <section className="tg-section">
                <div className="tg-section-content no-padding">
                    <ul className="tg-list">
                        <li className="tg-list-item" onClick={() => setActiveSheet('profile')}>
                            <div className="tg-list-item-content"><Icon name="clients" /><span className="text-main">Профиль</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                        <li className="tg-list-item" onClick={() => setActiveSheet('services')}>
                            <div className="tg-list-item-content"><Icon name="services" /><span className="text-main">Услуги</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                        <li className="tg-list-item" onClick={() => setActiveSheet('clients')}>
                            <div className="tg-list-item-content"><Icon name="clients" /><span className="text-main">Клиенты</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                        <li className="tg-list-item" onClick={() => setActiveSheet('schedule')}>
                            <div className="tg-list-item-content"><Icon name="schedule" /><span className="text-main">Расписание</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                    </ul>
                </div>
            </section>

            <section className="tg-section">
                <div className="tg-section-header"><h2>Инструменты</h2></div>
                <div className="tg-section-content no-padding">
                    <ul className="tg-list">
                        <li className="tg-list-item" onClick={() => setActiveSheet('tasks')}>
                            <div className="tg-list-item-content"><Icon name="tasks" /><span className="text-main">Задачи</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                        <li className="tg-list-item" onClick={() => setActiveSheet('expenses')}>
                            <div className="tg-list-item-content"><Icon name="expenses" /><span className="text-main">Расходы</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                        <li className="tg-list-item" onClick={() => setActiveSheet('instructions')}>
                            <div className="tg-list-item-content"><Icon name="instructions" /><span className="text-main">Инструкции</span></div>
                            <Icon name="chevron" className="chevron-right" />
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

const LandingPage: FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
    return (
        <div className="landing-page-container">
            <div className="landing-content">
                <h1 className="landing-title">Ваш бизнес в Telegram</h1>
                <p className="landing-subtitle">Бесплатный помощник для мастеров и специалистов. Управляйте записями, клиентами и услугами прямо в мессенджере.</p>
                <ul className="features-list">
                    <li className="feature-item"><Icon name="link" /> <span><b>Ссылка для онлайн-записи</b><br />Клиенты смогут записываться сами в любое время.</span></li>
                    <li className="feature-item"><Icon name="calendar-check" /> <span><b>Умный календарь</b><br />Все ваши записи и свободные слоты в одном месте.</span></li>
                    <li className="feature-item"><Icon name="users" /> <span><b>База клиентов и услуг</b><br />Вся важная информация всегда под рукой.</span></li>
                </ul>
                <button className="btn cta-button" onClick={onGetStarted}>Начать работу</button>
            </div>
        </div>
    );
}

const App: FC = () => {
    // Автоматическое определение режима
    const startParam = tg.initDataUnsafe?.start_param;
    const [isClientView] = useState(!!startParam);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<'loading' | 'master' | 'client'>('loading');
    const [clientScreen, setClientScreen] = useState<'booking' | 'dashboard'>(() => (startParam ? 'booking' : 'dashboard'));
    const [clientTelegramId, setClientTelegramId] = useState<string | number | null>(null);

    // Локальное состояние для приветственного экрана (не зависит от сервера)
    // Используем обычный useState и localStorage напрямую
    const [hasOnboarded, setHasOnboarded] = useState(() => {
        return window.localStorage.getItem('hasOnboarded') === 'true';
    });

    // Заменяем все `useLocalStorageState` на `useState`
    const [masterName, setMasterName] = useState('');
    const [profession, setProfession] = useState('');
    const [masterId, setMasterId] = useState<number | null>(null); // Directus ID мастера
    const [masterTelegramId, setMasterTelegramId] = useState<number | null>(null); // chat_id мастера в Telegram
    const [masterPhotoUrl, setMasterPhotoUrl] = useState<string | undefined>(undefined);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
    const [schedule, setSchedule] = useState<Schedule>({ mon: { enabled: false, startTime: '09:00', endTime: '18:00' }, tue: { enabled: false, startTime: '09:00', endTime: '18:00' }, wed: { enabled: false, startTime: '09:00', endTime: '18:00' }, thu: { enabled: false, startTime: '09:00', endTime: '18:00' }, fri: { enabled: false, startTime: '09:00', endTime: '18:00' }, sat: { enabled: false, startTime: '10:00', endTime: '16:00' }, sun: { enabled: false, startTime: '10:00', endTime: '16:00' } });
    const [recurringBreaks, setRecurringBreaks] = useState<RecurringBreak[]>([]);

    // Новые состояния для задач, расходов и заметок о клиентах
    const [tasks, setTasks] = useLocalStorageState<Task[]>('tasks', []);
    const [expenses, setExpenses] = useLocalStorageState<Expense[]>('expenses', []);
    const [clientNotes, setClientNotes] = useLocalStorageState<Record<string, string>>('clientNotes', {});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [newBookingId, setNewBookingId] = useState<string | number | null>(null);
    const [newBookingInfo, setNewBookingInfo] = useState<BookingInfo | null>(null);
    const [, forceRerender] = useState(0);

    // Ensure Telegram WebApp expands when the root component mounts
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
    }, []);

    // Основной useEffect для инициализации приложения
    useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const authResult = await loginWithTelegram();

                if (!authResult?.success || !authResult.user) {
                    setError(authResult?.error || 'Ошибка авторизации. Откройте приложение через Telegram.');
                    return;
                }

                setUser(authResult.user);
                let telegramId = resolveTelegramId(authResult.user);

                if (!telegramId) {
                    try {
                        const storedId = window.localStorage.getItem('telegramId');
                        if (storedId) {
                            telegramId = /^\d+$/.test(storedId) ? Number(storedId) : storedId;
                        }
                    } catch (storageError) {
                        console.warn('Не удалось получить telegramId из localStorage:', storageError);
                    }
                }

                if (!telegramId) {
                    throw new Error('Не удалось определить ваш Telegram ID');
                }

                setClientTelegramId(telegramId);
                try {
                    window.localStorage.setItem('telegramId', String(telegramId));
                } catch (storageError) {
                    console.warn('Не удалось сохранить telegramId в localStorage:', storageError);
                }
                const encodedTelegramId = encodeURIComponent(String(telegramId));
                const numericTelegramId = Number(telegramId);

                if (isClientView) {
                    setRole('client');
                    setClientScreen('booking');
                } else {
                    let isMaster = false;
                    try {
                        isMaster = await checkIsMasterByTelegram(telegramId);
                    } catch (checkError) {
                        console.error('Ошибка проверки роли мастера:', checkError);
                        throw new Error('Не удалось определить роль пользователя');
                    }

                    if (!isMaster) {
                        setRole('client');
                        setClientScreen('dashboard');
                        return;
                    }

                    setRole('master');
                }

                if (!isClientView) {
                    // Режим мастера - загружаем данные текущего пользователя
                    const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${encodedTelegramId}&fields=*`);
                    let masterData = masterResponse.data.data[0];

                    // Если мастер не найден, создаем запись
                    if (!masterData) {
                        const createResponse = await directusApi.post('/items/masters', {
                            telegramId,
                            name: authResult.user?.first_name || tg.initDataUnsafe?.user?.first_name || 'Мастер',
                            profession: ''
                        });
                        masterData = createResponse.data.data;

                        if (masterData?.id) {
                            const baseUrl = backendApiBaseUrl.replace(/\/$/, '');
                            const refreshUrl = `${baseUrl}/masters/${masterData.id}/refresh-photo`;
                            fetch(refreshUrl, { method: 'POST' }).catch(err =>
                                console.warn('⚠️ Не удалось обновить аватар мастера через бэкенд:', err)
                            );
                        }
                    }

                    if (!masterData) {
                        setError("Мастер не найден");
                        return;
                    }

                    setMasterName(masterData.name || 'Мастер');
                    setProfession(masterData.profession || '');
                    const telegramIdNumber = masterData.telegramId ? Number(masterData.telegramId) : (!Number.isNaN(numericTelegramId) ? numericTelegramId : null);
                    console.log('💾 Telegram ID мастера:', masterData.telegramId, 'тип:', typeof masterData.telegramId);
                    setMasterTelegramId(telegramIdNumber);
                    setMasterId(masterData.id ? Number(masterData.id) : null);

                    const directusUrl = (import.meta.env.VITE_DIRECTUS_API_URL || 'https://1.cycloscope.online').replace(/\/+$/, '');
                    let resolvedPhotoUrl: string | undefined;

                    if (masterData.photoUrl) {
                        const isDirectusFileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(masterData.photoUrl);
                        resolvedPhotoUrl = isDirectusFileId ? `${directusUrl}/assets/${masterData.photoUrl}` : masterData.photoUrl;
                        setMasterPhotoUrl(resolvedPhotoUrl);
                    } else if (masterData?.id) {
                        try {
                            const baseUrl = backendApiBaseUrl.replace(/\/$/, '');
                            const refreshUrl = `${baseUrl}/masters/${masterData.id}/refresh-photo`;
                            // Фоновое обновление: не блокируем рендеринг
                            fetch(refreshUrl, { method: 'POST' })
                                .then(r => r.json())
                                .then((data) => {
                                    if ((data?.ok || data?.success) && data?.photoUrl) {
                                        setMasterPhotoUrl(data.photoUrl);
                                    }
                                })
                                .catch(() => {});
                        } catch {}
                        // Пока ждем — показываем инициалы
                        setMasterPhotoUrl(undefined);
                    } else {
                        setMasterPhotoUrl(undefined);
                    }

                    // Загружаем услуги мастера
                    console.log('🔍 Загружаем услуги мастера (режим мастера)...');
                    const servicesResponse = await directusApi.get(`/items/services?filter[master][_eq]=${masterData.id}&fields=*`);
                    const loadedServices = servicesResponse.data.data || [];
                    console.log('📋 Загружено услуг:', loadedServices.length);
                    console.log('📋 Услуги:', loadedServices.map((s: Service) => ({ id: s.id, name: s.name })));
                    setServices(loadedServices);

                    // Загружаем записи мастера
                    const appointmentsResponse = await directusApi.get(`/items/appointments?filter[master][_eq]=${masterData.id}&filter[status][_eq]=confirmed&fields=*&limit=-1&sort=-dateTime`);
                    const directusAppointments = appointmentsResponse.data.data || [];
                    const localAppointments = directusAppointments.map((appt: DirectusAppointment) =>
                        convertDirectusAppointmentToLocal(appt, loadedServices)
                    );
                    setAppointments(localAppointments);

                    // Загружаем блокировки времени
                    const timeBlocksResponse = await directusApi.get(`/items/time_blocks?filter[master][_eq]=${masterData.id}&fields=*`);
                    const directusTimeBlocks = timeBlocksResponse.data.data || [];
                    const localTimeBlocks: TimeBlock[] = directusTimeBlocks.map((block: DirectusTimeBlock) => ({
                        id: block.id || '',
                        date: block.date,
                        startTime: block.startTime,
                        endTime: block.endTime,
                        title: block.title
                    }));
                    setTimeBlocks(localTimeBlocks);

                    // Загружаем расписание
                    const scheduleResponse = await directusApi.get(`/items/schedules?filter[master][_eq]=${masterData.id}&fields=*`);
                    if (scheduleResponse.data.data && scheduleResponse.data.data.length > 0) {
                        setSchedule(scheduleResponse.data.data[0].schedule);
                    }

                    try {
                        const breaks = await getBreaks(masterData.id);
                        setRecurringBreaks(breaks);
                    } catch (breakError: any) {
                        if (breakError.name !== 'AbortError') {
                            console.error('⚠️ Не удалось загрузить повторяющиеся перерывы (режим мастера):', breakError);
                        }
                    }
                } else {
                    // Режим клиента - загружаем данные мастера по startParam
                    const encodedStartParam = encodeURIComponent(String(startParam));
                    const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${encodedStartParam}&fields=*`);
                    const masterData = masterResponse.data.data[0];

                    if (masterData) {
                        setMasterName(masterData.name || 'Мастер');
                        setProfession(masterData.profession || '');
                        const telegramIdNumber = masterData.telegramId ? Number(masterData.telegramId) : null;
                        console.log('💾 Telegram ID мастера (клиентский режим):', masterData.telegramId, 'тип:', typeof masterData.telegramId);
                        setMasterTelegramId(telegramIdNumber);
                        setMasterId(masterData.id ? Number(masterData.id) : null);

                        const directusUrl = (import.meta.env.VITE_DIRECTUS_API_URL || 'https://1.cycloscope.online').replace(/\/+$/, '');
                        let resolvedPhotoUrl: string | undefined;

                        if (masterData.photoUrl) {
                            const isDirectusFileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(masterData.photoUrl);
                            resolvedPhotoUrl = isDirectusFileId ? `${directusUrl}/assets/${masterData.photoUrl}` : masterData.photoUrl;
                            setMasterPhotoUrl(resolvedPhotoUrl);
                        } else {
                            try {
                                const baseUrl = backendApiBaseUrl.replace(/\/$/, '');
                                const refreshUrl = `${baseUrl}/masters/${masterData.id}/refresh-photo`;
                                // Фоновый запрос: обновляем state по готовности
                                fetch(refreshUrl, { method: 'POST' })
                                    .then(r => r.json())
                                    .then((data) => {
                                        if ((data?.ok || data?.success) && data?.photoUrl) {
                                            setMasterPhotoUrl(data.photoUrl);
                                        }
                                    })
                                    .catch(() => {});
                            } catch {}
                            // До получения — инициалы
                            setMasterPhotoUrl(undefined);
                        }

                        console.log('🔍 Загружаем услуги мастера (клиентский режим)...');
                        const servicesResponse = await directusApi.get(`/items/services?filter[master][_eq]=${masterData.id}&fields=*`);
                        const loadedServices = servicesResponse.data.data || [];
                        console.log('📋 Загружено услуг:', loadedServices.length);
                        console.log('📋 Услуги:', loadedServices.map((s: Service) => ({ id: s.id, name: s.name })));
                        setServices(loadedServices);

                        const appointmentsResponse = await directusApi.get(`/items/appointments?filter[master][_eq]=${masterData.id}&filter[status][_eq]=confirmed&fields=*&limit=-1&sort=-dateTime`);
                        const directusAppointments = appointmentsResponse.data.data || [];
                        const localAppointments = directusAppointments.map((appt: DirectusAppointment) =>
                            convertDirectusAppointmentToLocal(appt, loadedServices)
                        );
                        setAppointments(localAppointments);

                        const timeBlocksResponse = await directusApi.get(`/items/time_blocks?filter[master][_eq]=${masterData.id}&fields=*`);
                        const directusTimeBlocks = timeBlocksResponse.data.data || [];
                        const localTimeBlocks: TimeBlock[] = directusTimeBlocks.map((block: DirectusTimeBlock) => ({
                            id: block.id || '',
                            date: block.date,
                            startTime: block.startTime,
                            endTime: block.endTime,
                            title: block.title
                        }));
                        setTimeBlocks(localTimeBlocks);

                        const scheduleResponse = await directusApi.get(`/items/schedules?filter[master][_eq]=${masterData.id}&fields=*`);
                        if (scheduleResponse.data.data && scheduleResponse.data.data.length > 0) {
                            setSchedule(scheduleResponse.data.data[0].schedule);
                        }

                        try {
                            const breaks = await getBreaks(masterData.id);
                            setRecurringBreaks(breaks);
                        } catch (breakError: any) {
                            if (breakError.name !== 'AbortError') {
                                console.error('⚠️ Не удалось загрузить повторяющиеся перерывы (режим клиента):', breakError);
                            }
                        }
                    } else {
                        setError("Мастер не найден");
                    }
                }
            } catch (err: any) {
                console.error("Ошибка инициализации:", err);
                setError(`Не удалось загрузить данные: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
        tg.ready();
        tg.expand();
        if (typeof tg.disableClosingConfirmation === 'function') {
            tg.disableClosingConfirmation();
        }
        if (typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes(); // Блокируем свайп вниз, чтобы не сворачивалось приложение
        }
        if (!isClientView) tg.BackButton.hide();

        return () => {
            if (typeof tg.enableVerticalSwipes === 'function') {
                tg.enableVerticalSwipes(); // Возвращаем стандартное поведение при размонтировании
            }
        };
    }, [isClientView, startParam]);

    // Re-render on theme changes (Telegram updates CSS vars)
    useEffect(() => {
        const onTheme = () => forceRerender(v => v + 1);
        try {
            tg.onEvent('themeChanged', onTheme);
        } catch {}
        return () => {
            try { tg.offEvent('themeChanged', onTheme); } catch {}
        };
    }, []);

    // Обработчики с интеграцией Directus API
    // --- НАЧАЛО ОТЛАДОЧНОЙ ВЕРСИИ ФУНКЦИИ handleBookAppointment ---
    const handleBookAppointment = async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
        console.log('');
        console.log('*'.repeat(80));
        console.log('*** ВХОД В handleBookAppointment (создание записи в Directus) ***');
        console.log('*'.repeat(80));
        console.log('--- ШАГ A1: Получены данные для создания записи ---');
        console.log('Данные записи (data):', data);
        console.log('Режим клиента (isClientView):', isClientView);
        console.log('startParam:', startParam);

        try {
            console.log('--- ШАГ A2: Определение ID мастера в БД ---');
            // Получаем реальный ID мастера из БД
            let masterDbId: string;

            if (isClientView) {
                console.log('Режим: КЛИЕНТ записывается к мастеру');
                // Клиент записывается - ищем мастера по telegramId из startParam
                console.log('Ищем мастера по telegramId из startParam:', startParam);
                const queryUrl = `/items/masters?filter[telegramId][_eq]=${startParam}&fields=id`;
                console.log('URL запроса к БД:', queryUrl);

                try {
                    const masterResponse = await directusApi.get(queryUrl);
                    console.log('Ответ от БД (полный):', masterResponse);
                    console.log('Данные мастера:', masterResponse.data);

                    if (!masterResponse.data.data || masterResponse.data.data.length === 0) {
                        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ A2: Мастер не найден в БД!');
                        console.error('startParam:', startParam);
                        throw new Error('Мастер не найден в базе данных');
                    }
                    masterDbId = masterResponse.data.data[0].id;
                    console.log('✅ ID мастера в БД найден:', masterDbId);
                } catch (dbError: any) {
                    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при запросе к БД на ШАГЕ A2!');
                    console.error('Детали ошибки:', dbError);
                    console.error('Сообщение:', dbError?.message);
                    console.error('Ответ сервера:', dbError?.response?.data);
                    throw dbError;
                }
            } else {
                console.log('Режим: МАСТЕР записывает клиента сам');
                // Мастер записывает сам - ищем по своему telegramId
                const telegramId = tg.initDataUnsafe?.user?.id;
                console.log('telegramId мастера из Telegram:', telegramId);
                const queryUrl = `/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`;
                console.log('URL запроса к БД:', queryUrl);

                try {
                    const masterResponse = await directusApi.get(queryUrl);
                    console.log('Ответ от БД (полный):', masterResponse);
                    console.log('Данные мастера:', masterResponse.data);

                    if (!masterResponse.data.data || masterResponse.data.data.length === 0) {
                        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ A2: Мастер не найден в БД!');
                        console.error('telegramId:', telegramId);
                        throw new Error('Мастер не найден в базе данных');
                    }
                    masterDbId = masterResponse.data.data[0].id;
                    console.log('✅ ID мастера в БД найден:', masterDbId);
                } catch (dbError: any) {
                    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при запросе к БД на ШАГЕ A2!');
                    console.error('Детали ошибки:', dbError);
                    console.error('Сообщение:', dbError?.message);
                    console.error('Ответ сервера:', dbError?.response?.data);
                    throw dbError;
                }
            }
            console.log('✅ ШАГ A2 УСПЕШЕН: masterDbId =', masterDbId);

            console.log('--- ШАГ A3: Поиск ID услуги ---');
            // Находим ID услуги
            console.log('Ищем услугу по данным:', { name: data.service, serviceId: data.serviceId });
            console.log('Доступные услуги:', services.map(s => ({ id: s.id, name: s.name })));
            let service = data.serviceId != null
                ? services.find(s => String(s.id) === String(data.serviceId))
                : undefined;
            if (!service) {
                service = services.find(s => s.name === data.service);
            }

            if (!service || !service.id) {
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ A3: Услуга не найдена!');
                console.error('Искомое имя услуги:', data.service);
                console.error('Искомый ID услуги:', data.serviceId);
                console.error('Доступные услуги:', services);
                throw new Error(`Услуга "${data.service}" не найдена`);
            }
            console.log('✅ ШАГ A3 УСПЕШЕН: ID услуги =', service.id);

            console.log('--- ШАГ A4: Формирование данных для Directus API ---');
            // Создаем запись
            const dateTime = new Date(`${data.date}T${data.time}:00`);
            console.log('Создан объект dateTime:', dateTime);
            const isoDateTime = dateTime.toISOString();
            console.log('ISO строка dateTime:', isoDateTime);

            if (typeof data.telegramId === 'undefined' || data.telegramId === null) {
                console.error('❌ Telegram ID отсутствует в данных записи!');
                throw new Error('Telegram ID обязателен для создания записи');
            }

            const trimmedClientPhone = data.clientPhone?.trim() || '';

            const directusData: Omit<DirectusAppointment, 'id'> & { status?: string } = {
                master: masterDbId,
                service: service.id,
                clientName: data.clientName,
                clientTelegramId: data.telegramId,
                dateTime: isoDateTime,
                reminderSent: false,
                status: 'confirmed' // <--- ВАЖНОЕ ИЗМЕНЕНИЕ! Добавлено поле status
            };
            if (trimmedClientPhone) {
                directusData.clientPhone = trimmedClientPhone;
            }
            console.log('Сформированы данные для Directus (directusData):', directusData);
            console.log('⚠️ ВНИМАНИЕ: Добавлено поле status: "confirmed"');
            console.log('✅ ШАГ A4 УСПЕШЕН');

            console.log('--- ШАГ A5: Отправка POST запроса в Directus для создания записи ---');
            console.log('URL: /items/appointments');
            console.log('Данные:', directusData);

            let response;
            try {
                response = await directusApi.post('/items/appointments', directusData);
                console.log('✅ УСПЕХ! Запись создана в Directus');
                console.log('Полный ответ от сервера:', response);
                console.log('Данные созданной записи:', response.data);
            } catch (createError: any) {
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ A5: Не удалось создать запись в Directus!');
                console.error('Детали ошибки:', createError);
                console.error('Сообщение:', createError?.message);
                console.error('Статус:', createError?.response?.status);
                console.error('Ответ сервера:', createError?.response?.data);
                throw createError;
            }
            console.log('✅ ШАГ A5 УСПЕШЕН');

            const createdAppointmentId = response?.data?.data?.id;

            console.log('--- ШАГ A5.1: Синхронизация с API /booking ---');
            const clientUsername = tg?.initDataUnsafe?.user?.username;
            const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const bookingMasterName = masterName?.trim() || 'Мастер';
            const bookingPayload = prepareBookingData({
                masterId: masterDbId,
                masterName: bookingMasterName,
                clientName: data.clientName,
                ...(trimmedClientPhone ? { clientPhone: trimmedClientPhone } : {}),
                clientTelegramId: data.telegramId ?? null,
                username: clientUsername || undefined,
                serviceId: service.id ?? '',
                dateTime: isoDateTime,
            });
            console.log('Payload для /booking:', bookingPayload);
            console.log('Idempotency-Key:', idempotencyKey);

            try {
                const bookingResponse = await createBooking(bookingPayload, idempotencyKey);
                console.log('✅ Бронирование отправлено на API /booking');
                console.log('Ответ /booking:', bookingResponse);
            } catch (bookingError) {
                console.error('❌ Ошибка синхронизации с API /booking:', bookingError);
                if (createdAppointmentId) {
                    try {
                        console.log('🔄 Откат созданной записи в Directus из-за ошибки API /booking');
                        await directusApi.delete(`/items/appointments/${createdAppointmentId}`);
                    } catch (rollbackError) {
                        console.error('⚠️ Не удалось откатить запись в Directus:', rollbackError);
                    }
                }
                throw bookingError;
            }
            console.log('✅ ШАГ A5.1 УСПЕШЕН');

            console.log('--- ШАГ A6: Конвертация данных из формата Directus в локальный формат ---');
            console.log('Доступные услуги для конвертации:', services.map(s => ({ id: s.id, name: s.name })));

            let newAppointment;
            try {
                newAppointment = convertDirectusAppointmentToLocal(response.data.data, services);
                console.log('✅ Запись сконвертирована:', newAppointment);
            } catch (convertError: any) {
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА НА ШАГЕ A6: Не удалось сконвертировать запись!');
                console.error('Детали ошибки:', convertError);
                throw convertError;
            }
            console.log('✅ ШАГ A6 УСПЕШЕН');

            console.log('--- ШАГ A7: Обновление состояния appointments ---');
            setAppointments(p => {
                const updated = [...p, newAppointment].sort((a, b) => 
                    new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
                );
                console.log('Обновленный список записей (appointments):', updated);
                return updated;
            });
            console.log('✅ ШАГ A7 УСПЕШЕН');

            console.log('--- ШАГ A8: Нормализация ID записи и обновление состояния ---');
            const normalizeToNumber = (value: unknown): number | null => {
                if (typeof value === 'number' && !Number.isNaN(value)) return value;
                if (typeof value === 'string') {
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? null : parsed;
                }
                return null;
            };

            const bookingIdCandidate = normalizeToNumber(response.data?.data?.id) ?? normalizeToNumber(newAppointment.id) ?? Date.now();
            console.log('Нормализованный ID записи (bookingIdCandidate):', bookingIdCandidate);
            setNewBookingId(bookingIdCandidate);
            console.log('✅ ШАГ A8 УСПЕШЕН');

            console.log('--- ШАГ A9: Формирование объекта BookingInfo ---');
            const masterNumericId = normalizeToNumber(masterDbId);
            console.log('masterNumericId:', masterNumericId);

            const bookingInfo: BookingInfo = {
                id: bookingIdCandidate,
                service: newAppointment.service,
                dateTime: new Date(`${newAppointment.date}T${newAppointment.time}:00`).toISOString(),
                master: masterNumericId !== null
                    ? {
                        id: masterNumericId,
                        name: masterName || 'Мастер',
                        profession: profession || '',
                        photoUrl: masterPhotoUrl || null
                    }
                    : null,
                client: {
                    name: newAppointment.clientName,
                    telegramId: typeof newAppointment.telegramId !== 'undefined' && newAppointment.telegramId !== null
                        ? String(newAppointment.telegramId)
                        : null,
                    username: null
                }
            };
            console.log('Сформирован объект bookingInfo:', bookingInfo);
            setNewBookingInfo(bookingInfo);
            console.log('✅ ШАГ A9 УСПЕШЕН');

            console.log('--- ШАГ A10: Финализация (toast, haptic feedback) ---');
            showToast('Запись успешно создана!');
            tg.HapticFeedback.notificationOccurred('success');
            console.log('✅ ШАГ A10 УСПЕШЕН');

            console.log('--- ШАГ A11: Возврат созданной записи ---');
            console.log('Возвращаем запись:', newAppointment);
            console.log('*** ВЫХОД ИЗ handleBookAppointment - УСПЕШНО ***');
            console.log('*'.repeat(80));
            console.log('');

            // Возвращаем созданную запись для использования в handleBook
            return newAppointment;
        } catch (err: any) {
            console.error('');
            console.error('*'.repeat(80));
            console.error('*** КРИТИЧЕСКАЯ ОШИБКА В handleBookAppointment ***');
            console.error('*'.repeat(80));
            console.error('Тип ошибки:', err?.constructor?.name);
            console.error('Сообщение ошибки:', err?.message);
            console.error('Stack trace:', err?.stack);
            console.error('Детали ответа сервера:', err?.response?.data);
            console.error('Статус ответа:', err?.response?.status);
            console.error('Полный объект ошибки:', err);
            console.error('*'.repeat(80));
            console.error('');

            showToast(err.message || 'Ошибка при создании записи');
            tg.HapticFeedback.notificationOccurred('error');
            setNewBookingInfo(null);
            throw err; // Пробрасываем ошибку дальше
        }
    };
    // --- КОНЕЦ ОТЛАДОЧНОЙ ВЕРСИИ ФУНКЦИИ handleBookAppointment ---

    const handleCancelAppointment = async (id: string) => {
        if (window.confirm('Вы уверены?')) {
            try {
                await directusApi.delete(`/items/appointments/${id}`);
                setAppointments(p => p.filter(a => a.id !== id));
                showToast('Запись отменена.');
            } catch (err: any) {
                console.error('Ошибка удаления записи:', err);
                showToast('Ошибка при удалении записи');
            }
        }
    };

    const handleAddTimeBlock = async (data: Omit<TimeBlock, 'id'>) => {
        try {
            const telegramId = tg.initDataUnsafe?.user?.id;
            const masterResponse = await directusApi.get(`/items/masters?filter[telegramId][_eq]=${telegramId}&fields=id`);
            const masterId = masterResponse.data.data[0]?.id;

            if (masterId) {
                const directusData: Omit<DirectusTimeBlock, 'id'> = {
                    master: masterId,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    title: data.title
                };

                const response = await directusApi.post('/items/time_blocks', directusData);
                const newBlock: TimeBlock = {
                    id: response.data.data.id,
                    ...data
                };

                setTimeBlocks(p => [...p, newBlock]);
                showToast('Время заблокировано.');
                tg.HapticFeedback.notificationOccurred('success');
            }
        } catch (err) {
            console.error('Ошибка блокировки времени:', err);
            showToast('Ошибка при блокировке времени');
            tg.HapticFeedback.notificationOccurred('error');
        }
    };

    const handleRemoveTimeBlock = async (id: string) => {
        try {
            await directusApi.delete(`/items/time_blocks/${id}`);
            setTimeBlocks(p => p.filter(b => b.id !== id));
            showToast('Время разблокировано.');
            tg.HapticFeedback.notificationOccurred('success');
        } catch (err) {
            console.error('Ошибка разблокировки времени:', err);
            showToast('Ошибка при разблокировке времени');
            tg.HapticFeedback.notificationOccurred('error');
        }
    };
    const showToast = (message: string) => setToastMessage(message);
    const handleSendReminder = async (id: string) => {
        const appointment = appointments.find(appt => appt.id === id);
        if (!appointment) {
            showToast('❌ Запись не найдена');
            return;
        }

        const masterTelegramChatId = masterTelegramId ?? tg.initDataUnsafe?.user?.id;
        if (typeof masterTelegramChatId !== 'number') {
            showToast('❌ Ошибка: не удалось определить Telegram ID мастера');
            console.error('masterTelegramId is null or undefined');
            return;
        }

        if (!appointment.telegramId) {
            showToast('⚠️ У клиента нет Telegram ID');
            return;
        }

        if (appointment.reminderSent) {
            showToast('ℹ️ Напоминание уже было отправлено');
            return;
        }

        try {
            const clientPhone = appointment.clientPhone?.trim();
            if (!clientPhone) {
                showToast('⚠️ Для отправки напоминания нужен номер телефона клиента');
                console.error('clientPhone отсутствует для appointment:', appointment);
                return;
            }

            let serviceId: number | string | null | undefined = appointment.serviceId ?? null;
            if (serviceId == null) {
                const matchedService = services.find(s => s.name === appointment.service);
                serviceId = matchedService?.id ?? null;
            }
            if (serviceId == null) {
                showToast('⚠️ Не удалось определить услугу для напоминания');
                console.error('serviceId отсутствует для appointment:', appointment);
                return;
            }

            const dateTime = new Date(`${appointment.date}T${appointment.time}:00`);
            if (Number.isNaN(dateTime.getTime())) {
                showToast('⚠️ Некорректная дата или время записи');
                console.error('Некорректная дата/время для appointment:', appointment);
                return;
            }
            const dateTimeISO = dateTime.toISOString();
            const bookingMasterName = masterName?.trim() || 'Мастер';

            console.log('📤 Отправка напоминания:', {
                masterId: masterTelegramChatId,
                telegramId: appointment.telegramId,
                clientName: appointment.clientName,
                serviceId,
                dateTime: dateTimeISO,
            });

            // Отправляем напоминание через API
            await sendBookingNotifications({
                masterId: Number(masterTelegramChatId),
                masterName: bookingMasterName,
                serviceName: appointment.service || 'Услуга', // Название услуги для уведомления
                clientName: appointment.clientName,
                clientPhone,
                clientTelegramId: appointment.telegramId!,
                serviceId,
                dateTime: dateTimeISO,
                notificationType: 'reminder', // Указываем что это напоминание
            });

            // Обновляем статус в локальном состоянии
            setAppointments(prev => prev.map(appt =>
                appt.id === id ? { ...appt, reminderSent: true } : appt
            ));

            // Обновляем в Directus
            if (masterId) {
                await directusApi.patch(`/items/appointments/${id}`, {
                    reminderSent: true
                });
            }

            showToast('✅ Напоминание отправлено клиенту');
            tg.HapticFeedback.notificationOccurred('success');
        } catch (error: any) {
            console.error('Ошибка отправки напоминания:', error);
            const errorMsg = error?.message || 'Неизвестная ошибка';

            if (errorMsg.includes('не написал боту') || errorMsg.includes('chat not found')) {
                showToast('⚠️ Клиент не написал боту. Попросите его нажать /start');
            } else if (errorMsg.includes('заблокировал бота') || errorMsg.includes('blocked')) {
                showToast('⚠️ Клиент заблокировал бота');
            } else {
                showToast(`❌ Ошибка: ${errorMsg}`);
            }
            tg.HapticFeedback.notificationOccurred('error');
        }
    };

    // Обработчики для задач
    const handleAddTask = (text: string) => setTasks(prev => [...prev, { id: `task-${Date.now()}`, text, done: false }]);
    const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    const handleClearCompletedTasks = () => setTasks(prev => prev.filter(t => !t.done));

    // Обработчики для расходов
    const handleAddExpense = (description: string, amount: number) => setExpenses(prev => [...prev, { id: `exp-${Date.now()}`, description, amount, date: new Date().toISOString() }]);
    const handleDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

    const handleGetStarted = () => {
        setHasOnboarded(true);
        window.localStorage.setItem('hasOnboarded', 'true');
        tg.HapticFeedback.impactOccurred('light');
    };

    // History policy: set initial state on mount
    useEffect(() => {
        try {
            if (!history.state || !history.state._initialized) {
                history.replaceState({ _initialized: true, route: isClientView ? 'client' : (hasOnboarded ? 'dashboard' : 'landing') }, document.title);
            }
        } catch {}
    }, []);

    useEffect(() => {
        if (!newBookingId) return;
        const handleBack = () => {
            setNewBookingId(null);
            setNewBookingInfo(null);
            BackButton.pop(handleBack);
        };
        BackButton.push(handleBack);
        return () => BackButton.pop(handleBack);
    }, [newBookingId]);

    // Клиентский режим личного кабинета
    if (role === 'client' && clientScreen === 'dashboard') {
        if (!clientTelegramId) {
            return <div style={{ padding: '20px', textAlign: 'center' }}>Не удалось определить ваш аккаунт. Попробуйте перезапустить приложение.</div>;
        }
        return (
            <ScreenView id="client-dashboard">
                <ClientDashboard
                    telegramId={clientTelegramId}
                    onBackToBooking={isClientView ? () => setClientScreen('booking') : undefined}
                />
            </ScreenView>
        );
    }

    // Экраны загрузки и ошибок
    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Подключаемся к серверу...</div>;
    }
    if (error) {
        return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Ошибка: {error}</div>;
    }

    return (
        <>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {newBookingId ? (
                <main>
                    <BookingCard
                        bookingId={newBookingId}
                        initialInfo={newBookingInfo ?? undefined}
                        showContactButton={!isClientView}
                    />
                </main>
            ) : (
                <main>
                    {isClientView ? (
                        masterId ? (
                            <ScreenView id="client">
                                <ClientBookingPage
                                    masterName={masterName}
                                    profession={profession}
                                    masterId={masterId}
                                    masterTelegramId={masterTelegramId}
                                    clientTelegramId={clientTelegramId}
                                    masterPhotoUrl={masterPhotoUrl}
                                    services={services}
                                    schedule={schedule}
                                    appointments={appointments}
                                    timeBlocks={timeBlocks}
                                    recurringBreaks={recurringBreaks}
                                    onBookAppointment={handleBookAppointment}
                                    showToast={showToast}
                                    onOpenDashboard={role === 'client' ? () => setClientScreen('dashboard') : undefined}
                                    showBookingsButton={role === 'client'}
                                />
                            </ScreenView>
                        ) : (
                            <div className="container"><p>Загрузка данных мастера...</p></div>
                        )
                    ) : hasOnboarded ? (
                        <ScreenView id="dashboard">
                            <MasterDashboard
                                masterName={masterName}
                                masterPhotoUrl={masterPhotoUrl}
                                setMasterName={setMasterName}
                                profession={profession}
                                setProfession={setProfession}
                                services={services}
                                setServices={setServices}
                                appointments={appointments}
                                onCancelAppointment={handleCancelAppointment}
                                onAddAppointment={handleBookAppointment}
                                onSendReminder={handleSendReminder}
                                schedule={schedule}
                                setSchedule={setSchedule}
                                masterId={masterId}
                                recurringBreaks={recurringBreaks}
                                setRecurringBreaks={setRecurringBreaks}
                                timeBlocks={timeBlocks}
                                onAddTimeBlock={handleAddTimeBlock}
                                onRemoveTimeBlock={handleRemoveTimeBlock}
                                showToast={showToast}
                                tasks={tasks}
                                onAddTask={handleAddTask}
                                onToggleTask={handleToggleTask}
                                onClearCompletedTasks={handleClearCompletedTasks}
                                expenses={expenses}
                                onAddExpense={handleAddExpense}
                                onDeleteExpense={handleDeleteExpense}
                                clientNotes={clientNotes}
                                setClientNotes={setClientNotes}
                            />
                        </ScreenView>
                    ) : (
                        <ScreenView id="landing">
                            <LandingPage
                                onGetStarted={() => {
                                    try {
                                        history.pushState({ route: 'dashboard' }, document.title);
                                    } catch {}
                                    setHasOnboarded(true);
                                    window.localStorage.setItem('hasOnboarded', 'true');
                                    const back = () => {
                                        setHasOnboarded(false);
                                        try { history.replaceState({ route: 'landing' }, document.title); } catch {}
                                        BackButton.pop(back);
                                    };
                                    BackButton.push(back);
                                    tg.HapticFeedback.impactOccurred('light');
                                }}
                            />
                        </ScreenView>
                    )}
                </main>
            )}
        </>
    );
};

const ScreenView: FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const viewRef = useRef<HTMLDivElement | null>(null);
    const inset = useMainButtonInset();
    useEffect(() => {
        if (viewRef.current) ScrollManager.setActiveContainer(viewRef.current);
        const handler = () => ScrollManager.notifyActiveScroll();
        viewRef.current?.addEventListener('scroll', handler, { passive: true });
        return () => viewRef.current?.removeEventListener('scroll', handler);
    }, []);
    useScrollRestoration(id);
    return <div ref={viewRef} className="view" style={{ paddingBottom: `${inset}px` }}>{children}</div>;
};

const container = document.getElementById('root');

// Функция для безопасного рендеринга после готовности Telegram WebApp
const renderApp = () => {
    if (container) {
        const root = createRoot(container);
        root.render(<App />);
    }
};

// Оборачиваем рендеринг для предотвращения гонки со скриптами Telegram
// Сначала сигнализируем Telegram, что приложение готово
WebApp.ready();

// Затем откладываем рендеринг на следующий тик, чтобы дать Telegram время на инициализацию
// Это предотвращает ошибку "s.closest is not a function" в Telegram /k/
setTimeout(renderApp, 0);
