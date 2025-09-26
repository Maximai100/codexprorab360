// Система событий EventBus для калькулятора

import React from 'react';
import { RoomData, SavedMaterial, MaterialResult, CalculatorError } from '../types';

// Типы событий
export type CalculatorEventType = 
  | 'room:added'
  | 'room:updated'
  | 'room:deleted'
  | 'room:selected'
  | 'material:added'
  | 'material:updated'
  | 'material:deleted'
  | 'material:selected'
  | 'calculation:updated'
  | 'calculation:completed'
  | 'export:started'
  | 'export:completed'
  | 'export:failed'
  | 'save:started'
  | 'save:completed'
  | 'save:failed'
  | 'load:started'
  | 'load:completed'
  | 'load:failed'
  | 'theme:changed'
  | 'error:occurred'
  | 'validation:failed'
  | 'validation:passed';

// Данные событий
export interface CalculatorEventData {
  'room:added': { room: RoomData };
  'room:updated': { room: RoomData; previousRoom: RoomData };
  'room:deleted': { roomId: number };
  'room:selected': { room: RoomData };
  'material:added': { material: SavedMaterial };
  'material:updated': { material: SavedMaterial; previousMaterial: SavedMaterial };
  'material:deleted': { materialId: number };
  'material:selected': { material: SavedMaterial };
  'calculation:updated': { name: string; result: MaterialResult | null };
  'calculation:completed': { results: Record<string, MaterialResult> };
  'export:started': { format: string };
  'export:completed': { format: string; data: any };
  'export:failed': { format: string; error: CalculatorError };
  'save:started': { name: string };
  'save:completed': { name: string; data: any };
  'save:failed': { name: string; error: CalculatorError };
  'load:started': { name: string };
  'load:completed': { name: string; data: any };
  'load:failed': { name: string; error: CalculatorError };
  'theme:changed': { theme: 'light' | 'dark' };
  'error:occurred': { error: CalculatorError };
  'validation:failed': { errors: Record<string, string[]> };
  'validation:passed': { data: any };
}

// Обработчик событий
export type EventHandler<T extends CalculatorEventType> = (data: CalculatorEventData[T]) => void;

// Интерфейс EventBus
export interface EventBus {
  on<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): () => void;
  off<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): void;
  emit<T extends CalculatorEventType>(event: T, data: CalculatorEventData[T]): void;
  once<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): void;
  clear(): void;
  getListeners<T extends CalculatorEventType>(event: T): EventHandler<T>[];
}

// Реализация EventBus
export class CalculatorEventBus implements EventBus {
  private listeners: Map<CalculatorEventType, Set<EventHandler<CalculatorEventType>>> = new Map();
  private onceListeners: Map<CalculatorEventType, Set<EventHandler<CalculatorEventType>>> = new Map();

  on<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Возвращаем функцию для отписки
    return () => this.off(event, handler);
  }

  off<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler);
    this.onceListeners.get(event)?.delete(handler);
  }

  emit<T extends CalculatorEventType>(event: T, data: CalculatorEventData[T]): void {
    // Выполняем обычные обработчики
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }

    // Выполняем одноразовые обработчики
    const onceHandlers = this.onceListeners.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error);
        }
      });
      // Очищаем одноразовые обработчики
      onceHandlers.clear();
    }
  }

  once<T extends CalculatorEventType>(event: T, handler: EventHandler<T>): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(handler);
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  getListeners<T extends CalculatorEventType>(event: T): EventHandler<T>[] {
    const handlers = this.listeners.get(event);
    return handlers ? Array.from(handlers) : [];
  }

  // Дополнительные методы
  hasListeners<T extends CalculatorEventType>(event: T): boolean {
    const hasRegular = this.listeners.get(event)?.size > 0;
    const hasOnce = this.onceListeners.get(event)?.size > 0;
    return hasRegular || hasOnce;
  }

  getEventCount(): number {
    return this.listeners.size + this.onceListeners.size;
  }

  getTotalListenerCount(): number {
    let count = 0;
    this.listeners.forEach(handlers => count += handlers.size);
    this.onceListeners.forEach(handlers => count += handlers.size);
    return count;
  }
}

// Глобальный экземпляр EventBus
export const calculatorEventBus = new CalculatorEventBus();

// Хук для использования EventBus в React компонентах
export const useEventBus = () => {
  const eventBus = calculatorEventBus;

  const useEventListener = <T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>,
    deps: React.DependencyList = []
  ) => {
    React.useEffect(() => {
      const unsubscribe = eventBus.on(event, handler);
      return unsubscribe;
    }, [event, ...deps]);
  };

  const emitEvent = <T extends CalculatorEventType>(
    event: T,
    data: CalculatorEventData[T]
  ) => {
    eventBus.emit(event, data);
  };

  const addEventListener = <T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>
  ) => {
    return eventBus.on(event, handler);
  };

  const removeEventListener = <T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>
  ) => {
    eventBus.off(event, handler);
  };

  const addOnceListener = <T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>
  ) => {
    eventBus.once(event, handler);
  };

  return {
    eventBus,
    useEventListener,
    emitEvent,
    addEventListener,
    removeEventListener,
    addOnceListener
  };
};

// Утилиты для работы с событиями
export const EventUtils = {
  // Создание события с метаданными
  createEvent<T extends CalculatorEventType>(
    type: T,
    data: CalculatorEventData[T],
    metadata?: {
      timestamp?: number;
      source?: string;
      userId?: string;
    }
  ) {
    return {
      type,
      data,
      metadata: {
        timestamp: Date.now(),
        source: 'calculator',
        ...metadata
      }
    };
  },

  // Логирование событий
  logEvent<T extends CalculatorEventType>(
    event: T,
    data: CalculatorEventData[T],
    level: 'info' | 'warn' | 'error' = 'info'
  ) {
    const logData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      level
    };

    switch (level) {
      case 'info':
        console.log('Calculator Event:', logData);
        break;
      case 'warn':
        console.warn('Calculator Event:', logData);
        break;
      case 'error':
        console.error('Calculator Event:', logData);
        break;
    }
  },

  // Дебаунс для событий
  debounce<T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>,
    delay: number
  ): EventHandler<T> {
    let timeoutId: NodeJS.Timeout;
    
    return (data: CalculatorEventData[T]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handler(data);
      }, delay);
    };
  },

  // Троттлинг для событий
  throttle<T extends CalculatorEventType>(
    event: T,
    handler: EventHandler<T>,
    delay: number
  ): EventHandler<T> {
    let lastCall = 0;
    
    return (data: CalculatorEventData[T]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        handler(data);
      }
    };
  }
};

// Предустановленные обработчики событий
export const DefaultEventHandlers = {
  // Логирование всех событий
  logAllEvents: () => {
    const eventTypes: CalculatorEventType[] = [
      'room:added', 'room:updated', 'room:deleted', 'room:selected',
      'material:added', 'material:updated', 'material:deleted', 'material:selected',
      'calculation:updated', 'calculation:completed',
      'export:started', 'export:completed', 'export:failed',
      'save:started', 'save:completed', 'save:failed',
      'load:started', 'load:completed', 'load:failed',
      'theme:changed', 'error:occurred',
      'validation:failed', 'validation:passed'
    ];

    eventTypes.forEach(eventType => {
      calculatorEventBus.on(eventType, (data) => {
        EventUtils.logEvent(eventType, data);
      });
    });
  },

  // Обработка ошибок
  handleErrors: () => {
    calculatorEventBus.on('error:occurred', (data) => {
      console.error('Calculator Error:', data.error);
      // Здесь можно добавить отправку ошибок в систему мониторинга
    });
  },

  // Аналитика событий
  trackAnalytics: () => {
    const trackEvent = (event: CalculatorEventType, data: unknown) => {
      // Здесь можно добавить отправку данных в аналитику
      console.log('Analytics Event:', { event, data });
    };

    calculatorEventBus.on('room:added', (data) => trackEvent('room:added', data));
    calculatorEventBus.on('material:added', (data) => trackEvent('material:added', data));
    calculatorEventBus.on('export:completed', (data) => trackEvent('export:completed', data));
  }
};

// Инициализация предустановленных обработчиков
export const initializeDefaultHandlers = () => {
  DefaultEventHandlers.logAllEvents();
  DefaultEventHandlers.handleErrors();
  DefaultEventHandlers.trackAnalytics();
};
