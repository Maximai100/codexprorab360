import type { BookingData } from '../types/booking';

const DEFAULT_BACKEND_URL = 'https://api.prorab360.online/notify';
const backendUrl = import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;

console.log('🔧 Backend URL загружен:', backendUrl);
console.log('🔧 Все env переменные:', import.meta.env);

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn('⚠️ VITE_BACKEND_URL не настроен, используется fallback:', backendUrl);
}

/**
 * Отправляет уведомление о записи на бэкенд
 * @param payload - данные записи
 * @returns Promise с ответом сервера
 * @throws Error при ошибке сети или бэкенда
 */
export async function sendBookingNotifications(
  payload: BookingData
): Promise<any> {
  console.log('');
  console.log('🔔'.repeat(40));
  console.log('📤 НАЧАЛО ОТПРАВКИ УВЕДОМЛЕНИЯ');
  console.log('🔔'.repeat(40));
  console.log('📍 URL эндпоинта:', backendUrl);
  console.log('📦 Полный payload:', JSON.stringify(payload, null, 2));
  console.log('📦 Детали payload:');
  console.log('   - masterId:', payload.masterId);
  console.log('   - clientTelegramId:', payload.clientTelegramId);
  console.log('   - clientName:', payload.clientName);
  console.log('   - clientPhone:', payload.clientPhone);
  console.log('   - serviceId:', payload.serviceId);
  console.log('   - dateTime:', payload.dateTime);
  console.log('   - masterName:', payload.masterName);
  console.log('   - notificationType:', payload.notificationType);
  
  // Создаем контроллер для отмены запроса по таймауту
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('⏱️ ТАЙМАУТ! Запрос превысил 10 секунд');
    controller.abort();
  }, 10000); // 10 секунд
  
  try {
    console.log('🚀 Отправка fetch запроса...');
    
    // Определяем эндпоинт в зависимости от типа уведомления
    const isReminder = payload.notificationType === 'reminder';
    // backendUrl по умолчанию указывает на /notify
    // Для бронирований заменяем /notify на /booking
    const endpoint = isReminder 
      ? backendUrl 
      : backendUrl.replace('/notify', '/booking');
    
    console.log('📍 Выбран эндпоинт:', endpoint, '(тип:', payload.notificationType, ')');

    let requestPayload: Record<string, unknown>;
    
    if (isReminder) {
      // Для напоминаний используем эндпоинт /notify
      // Он ожидает: masterId, telegramId, clientName, service (название), date, time
      const dateTime = new Date(payload.dateTime);
      const date = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = dateTime.toTimeString().slice(0, 5); // HH:MM
      
      requestPayload = {
        masterId: String(payload.masterId),
        telegramId: String(payload.clientTelegramId),
        clientName: payload.clientName,
        service: payload.serviceName || 'Услуга', // Название услуги для уведомления
        date: date,
        time: time,
        notificationType: 'reminder'
      };
    } else {
      // Для бронирований используем эндпоинт /booking
      const serviceId = Number(payload.serviceId);
      if (Number.isNaN(serviceId)) {
        throw new Error('serviceId должен быть числом');
      }

      if (!payload.clientPhone) {
        throw new Error('clientPhone обязателен для отправки бронирования');
      }

      requestPayload = {
        clientName: payload.clientName,
        clientPhone: payload.clientPhone,
        clientTelegramId: String(payload.clientTelegramId),
        service: serviceId,
        dateTime: payload.dateTime,
        masterName: payload.masterName,
      };

      if (payload.masterId != null) {
        requestPayload.masterId = String(payload.masterId);
      }
      if (payload.notificationType) {
        requestPayload.notificationType = payload.notificationType;
      }
    }

    const requestBody = JSON.stringify(requestPayload);
    console.log('📝 Тело запроса (строка):', requestBody);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('📥 Получен ответ от сервера!');
    console.log('📊 HTTP статус:', response.status);
    console.log('📊 HTTP статус текст:', response.statusText);
    console.log('📊 Response OK:', response.ok);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    // Парсим ответ
    let json: any;
    let responseText: string = '';
    try {
      responseText = await response.text();
      console.log('📄 Тело ответа (текст):', responseText);
      
      if (responseText) {
        json = JSON.parse(responseText);
        console.log('✅ JSON успешно распарсен:', json);
      } else {
        console.warn('⚠️ Пустое тело ответа');
        json = {};
      }
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError);
      console.error('📄 Исходный текст ответа:', responseText);
      
      // Если не удалось распарсить JSON
      if (!response.ok) {
        throw new Error(`Ошибка бэкенда: ${response.status} - ${responseText}`);
      }
      return {};
    }

    // Проверяем статус ответа
    if (!response.ok || json?.success === false) {
      const errorMessage = json?.message || `Ошибка бэкенда: ${response.status}`;
      console.error('❌ Сервер вернул ошибку:', errorMessage);
      console.error('❌ Полный ответ:', json);
      throw new Error(errorMessage);
    }

    console.log('✅ УВЕДОМЛЕНИЕ УСПЕШНО ОТПРАВЛЕНО!');
    console.log('✅ Ответ сервера:', json);
    console.log('🔔'.repeat(40));
    console.log('');
    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('');
    console.error('❌'.repeat(40));
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ОТПРАВКЕ УВЕДОМЛЕНИЯ');
    console.error('❌'.repeat(40));
    console.error('🔴 Тип ошибки:', error?.name);
    console.error('🔴 Сообщение:', error?.message);
    console.error('🔴 Stack trace:', error?.stack);
    console.error('🔴 Полный объект ошибки:', error);
    
    if (error.name === 'AbortError') {
      console.error('⏱️ Причина: Превышено время ожидания (10 секунд)');
      throw new Error('Превышено время ожидания ответа от сервера');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Причина: Проблема с сетью или CORS');
    }
    
    console.error('❌'.repeat(40));
    console.error('');
    throw error;
  }
}
