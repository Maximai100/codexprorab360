export type BookingData = {
  clientName: string;
  clientPhone: string;
  clientTelegramId: string | number;
  serviceId: number | string;
  dateTime: string; // ISO 8601
  masterName: string;
  masterId?: number | string;
  notificationType?: 'booking' | 'reminder' | 'cancel';
  serviceName?: string; // Название услуги для уведомлений
};
