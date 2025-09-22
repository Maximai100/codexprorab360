// Абстракция платформенного API для независимости от конкретных платформ

export interface PlatformAPI {
  // Уведомления
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback: (ok: boolean) => void) => void;
  
  // Тактильная обратная связь
  hapticFeedback: (type: 'success' | 'error' | 'warning') => void;
  
  // Тема
  getTheme: () => 'light' | 'dark';
  onThemeChange: (callback: () => void) => void;
  offThemeChange: (callback: () => void) => void;
  
  // Данные
  sendData: (data: string) => void;
  
  // Интерфейс
  expand: () => void;
  ready: () => void;
  
  // Подтверждение закрытия
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  
  // Дополнительные возможности
  disableVerticalSwipes?: () => void;
  isClosingConfirmationEnabled?: boolean;
}

// Реализация для Telegram WebApp
export class TelegramPlatformAPI implements PlatformAPI {
  private telegram: TelegramWebApp | undefined;
  private themeChangeCallbacks: (() => void)[] = [];

  constructor() {
    this.telegram = window.Telegram?.WebApp;
    if (this.telegram) {
      this.telegram.ready();
      this.telegram.expand();
    }
  }

  showAlert(message: string, callback?: () => void): void {
    if (this.telegram?.showAlert) {
      this.telegram.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }

  showConfirm(message: string, callback: (ok: boolean) => void): void {
    if (this.telegram?.showConfirm) {
      this.telegram.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback(result);
    }
  }

  hapticFeedback(type: 'success' | 'error' | 'warning'): void {
    if (this.telegram?.HapticFeedback?.notificationOccurred) {
      this.telegram.HapticFeedback.notificationOccurred(type);
    } else {
      // Fallback для браузера - вибрация
      if (navigator.vibrate) {
        const patterns = {
          success: [100],
          error: [200, 100, 200],
          warning: [100, 100, 100]
        };
        navigator.vibrate(patterns[type]);
      }
    }
  }

  getTheme(): 'light' | 'dark' {
    if (this.telegram?.colorScheme) {
      return this.telegram.colorScheme;
    }
    
    // Fallback к системной теме
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  onThemeChange(callback: () => void): void {
    this.themeChangeCallbacks.push(callback);
    
    if (this.telegram?.onEvent) {
      this.telegram.onEvent('themeChanged', callback);
    } else {
      // Fallback для браузера
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', callback);
    }
  }

  offThemeChange(callback: () => void): void {
    const index = this.themeChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.themeChangeCallbacks.splice(index, 1);
    }
    
    if (this.telegram?.offEvent) {
      this.telegram.offEvent('themeChanged', callback);
    }
  }

  sendData(data: string): void {
    if (this.telegram?.sendData) {
      this.telegram.sendData(data);
    } else {
      console.log('PlatformAPI.sendData:', data);
    }
  }

  expand(): void {
    if (this.telegram?.expand) {
      this.telegram.expand();
    }
  }

  ready(): void {
    if (this.telegram?.ready) {
      this.telegram.ready();
    }
  }

  enableClosingConfirmation(): void {
    if (this.telegram?.enableClosingConfirmation) {
      this.telegram.enableClosingConfirmation();
    }
  }

  disableClosingConfirmation(): void {
    if (this.telegram?.disableClosingConfirmation) {
      this.telegram.disableClosingConfirmation();
    }
  }

  disableVerticalSwipes(): void {
    if (this.telegram?.disableVerticalSwipes) {
      this.telegram.disableVerticalSwipes();
    }
  }

  get isClosingConfirmationEnabled(): boolean {
    return this.telegram?.isClosingConfirmationEnabled || false;
  }
}

// Реализация для обычного браузера
export class WebPlatformAPI implements PlatformAPI {
  private themeChangeCallbacks: (() => void)[] = [];
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  showAlert(message: string, callback?: () => void): void {
    alert(message);
    callback?.();
  }

  showConfirm(message: string, callback: (ok: boolean) => void): void {
    const result = confirm(message);
    callback(result);
  }

  hapticFeedback(type: 'success' | 'error' | 'warning'): void {
    if (navigator.vibrate) {
      const patterns = {
        success: [100],
        error: [200, 100, 200],
        warning: [100, 100, 100]
      };
      navigator.vibrate(patterns[type]);
    }
  }

  getTheme(): 'light' | 'dark' {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  onThemeChange(callback: () => void): void {
    this.themeChangeCallbacks.push(callback);
    this.mediaQuery.addEventListener('change', callback);
  }

  offThemeChange(callback: () => void): void {
    const index = this.themeChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.themeChangeCallbacks.splice(index, 1);
    }
    this.mediaQuery.removeEventListener('change', callback);
  }

  sendData(data: string): void {
    console.log('WebPlatformAPI.sendData:', data);
  }

  expand(): void {
    // Ничего не делаем в браузере
  }

  ready(): void {
    // Ничего не делаем в браузере
  }

  enableClosingConfirmation(): void {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  disableClosingConfirmation(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
  };
}

// Реализация для React Native (заглушка)
export class ReactNativePlatformAPI implements PlatformAPI {
  showAlert(message: string, callback?: () => void): void {
    console.log('ReactNativePlatformAPI.showAlert:', message);
    callback?.();
  }

  showConfirm(message: string, callback: (ok: boolean) => void): void {
    console.log('ReactNativePlatformAPI.showConfirm:', message);
    callback(true);
  }

  hapticFeedback(type: 'success' | 'error' | 'warning'): void {
    console.log('ReactNativePlatformAPI.hapticFeedback:', type);
  }

  getTheme(): 'light' | 'dark' {
    return 'light';
  }

  onThemeChange(callback: () => void): void {
    console.log('ReactNativePlatformAPI.onThemeChange');
  }

  offThemeChange(callback: () => void): void {
    console.log('ReactNativePlatformAPI.offThemeChange');
  }

  sendData(data: string): void {
    console.log('ReactNativePlatformAPI.sendData:', data);
  }

  expand(): void {
    console.log('ReactNativePlatformAPI.expand');
  }

  ready(): void {
    console.log('ReactNativePlatformAPI.ready');
  }

  enableClosingConfirmation(): void {
    console.log('ReactNativePlatformAPI.enableClosingConfirmation');
  }

  disableClosingConfirmation(): void {
    console.log('ReactNativePlatformAPI.disableClosingConfirmation');
  }
}

// Фабрика для создания API
export class PlatformAPIFactory {
  static create(): PlatformAPI {
    // Проверяем Telegram WebApp
    if (window.Telegram?.WebApp) {
      return new TelegramPlatformAPI();
    }
    
    // Проверяем React Native
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return new ReactNativePlatformAPI();
    }
    
    // По умолчанию используем Web API
    return new WebPlatformAPI();
  }
}

// Глобальный экземпляр API
export const platformAPI = PlatformAPIFactory.create();

// Хук для использования PlatformAPI в React компонентах
export const usePlatformAPI = (): PlatformAPI => {
  return platformAPI;
};
