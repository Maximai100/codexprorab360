# Design Document: Scroll and Swipe Unification

## Overview

Данный документ описывает архитектурное решение для унификации поведения скроллинга, жестов и навигации в Telegram Mini App "Запиши меня". Решение основано на лучших практиках Telegram WebApp API и обеспечивает стабильную работу на iOS и Android устройствах.

### Текущие проблемы

Анализ текущей реализации выявил следующие проблемы:

1. **Несогласованная высота viewport**: Используется `100vh` вместо `viewportStableHeight` из WebApp API
2. **Отсутствие глобальной блокировки скролла**: `html` и `body` не имеют `overflow: hidden`
3. **Проблемы с Bottom Sheet**: Свайп-закрытие реализовано через pointer events, но отсутствует блокировка фонового скролла
4. **Конфликты touch событий**: Нет четкого разделения между пассивными и активными слушателями
5. **Проблемы с клавиатурой**: Не используется `viewportChanged` событие для адаптации высоты
6. **iOS специфичные проблемы**: Отсутствует `overscroll-behavior` и `-webkit-overflow-scrolling`

## Architecture

### Высокоуровневая архитектура

```
┌─────────────────────────────────────────┐
│         Telegram WebApp API             │
│  (viewportStableHeight, BackButton)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Viewport Height Manager            │
│   (setVH(), viewportChanged listener)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         CSS Layout System               │
│  (--vh variable, flex containers)       │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌─────────────┐  ┌─────────────┐
│   Main      │  │   Bottom    │
│   Content   │  │   Sheets    │
│   (.view)   │  │  (modal)    │
└─────────────┘  └─────────────┘
```

### Слои приложения

1. **HTML/Body Layer**: Фиксированная высота, без скролла
2. **App Container (#app)**: Flex контейнер с высотой `var(--vh)`
3. **View Layer (.view)**: Скроллируемый контейнер для основного контента
4. **Modal Layer**: Bottom Sheets с собственным скроллом и свайп-управлением

## Global CSS Rules

### Base Styles

```css
html, body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}

/* Prevent iOS auto-zoom on inputs (font-size >= 16px) */
input, textarea, select {
  font-size: 16px;
  /* Можно переопределить в конкретных компонентах, но не меньше 16px */
}

/* Prevent accidental drag on images and links */
img, a {
  -webkit-user-drag: none;
  user-drag: none;
}

/* Prevent tap highlight on all elements */
* {
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}

/* Bottom Sheet drag handle - allow gesture capture */
.bottom-sheet-handle {
  touch-action: none; /* Only on handle, not entire sheet */
  cursor: grab;
}

.bottom-sheet-handle:active {
  cursor: grabbing;
}
```

## Components and Interfaces

### 1. Viewport Height Manager

**Назначение**: Управление высотой viewport с учетом клавиатуры и системных элементов.

**Интерфейс**:
```typescript
interface ViewportManager {
  initialize(): void;
  updateHeight(): void;
  cleanup(): void;
}
```

**Реализация**:
```typescript
// В начале index.tsx, до React рендеринга
const ViewportManager = {
  rafId: null as number | null,
  debounceTimer: null as number | null,
  
  // Function declarations с .bind() для сохранения контекста this
  debouncedUpdate: function() {
    // Debounce для предотвращения частых пересчетов на "дрожащих" устройствах
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = window.setTimeout(() => {
      this.updateHeight();
    }, 50); // 50ms debounce
  },
  
  updateHeight: function() {
    // Используем RAF для оптимизации производительности
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      const tg = window.Telegram?.WebApp;
      const height = tg?.viewportStableHeight || window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${height}px`);
    });
  },
  
  initialize() {
    this.updateHeight();
    
    // Сохраняем ссылку на bound функцию для корректного on/off
    const boundUpdate = this.debouncedUpdate.bind(this);
    
    // Подписка на события с debounce
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent('viewportChanged', boundUpdate);
    }
    window.addEventListener('resize', boundUpdate);
    
    // Сохраняем для cleanup
    this._boundUpdate = boundUpdate;
  },
  
  cleanup() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this._boundUpdate) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.offEvent('viewportChanged', this._boundUpdate);
      }
      window.removeEventListener('resize', this._boundUpdate);
    }
  },
  
  _boundUpdate: null as ((() => void) | null)
};

// Вызов при загрузке
ViewportManager.initialize();
```

### 2. Scroll Container Component

**Назначение**: Унифицированный скроллируемый контейнер для всех экранов.

**Структура**:
```tsx
interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollContainer: FC<ScrollContainerProps> = ({ children, className }) => {
  return (
    <div className={`view ${className || ''}`}>
      {children}
    </div>
  );
};
```

**CSS**:
```css
.view {
  flex: 1 1 auto;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  min-height: 0;
}
```

### 3. Enhanced Bottom Sheet Component

**Назначение**: Модальное окно с улучшенным управлением скроллом и свайпами.

**Интерфейс**:
```typescript
interface BottomSheetProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  fixedContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

interface SwipeState {
  startY: number | null;
  currentOffset: number;
  isDragging: boolean;
  dragFromFixedArea: boolean;
}
```

**Ключевые улучшения**:

1. **Блокировка фонового скролла**:
```typescript
useEffect(() => {
  document.body.classList.add('body-no-scroll');
  return () => {
    document.body.classList.remove('body-no-scroll');
  };
}, []);
```

2. **Улучшенная логика свайпа с velocity и относительным порогом**:
```typescript
const handlePointerMove = (event: PointerEvent) => {
  if (startY === null) return;
  
  const deltaY = event.clientY - startY;
  
  // Разрешаем драг только вниз
  if (deltaY <= 0 && !isDragging) return;
  
  // Проверяем, начался ли свайп с фиксированной области
  if (!isDragging) {
    if (dragFromFixedArea) {
      // Разрешаем драг сразу
      isDragging = true;
      // Применяем will-change ТОЛЬКО во время драга
      sheetRef.current.style.willChange = 'transform';
    } else {
      // Проверяем скролл контента
      const scrollableEl = contentRef.current;
      if (scrollableEl && scrollableEl.scrollTop > 0) {
        // Контент прокручен - не начинаем драг
        startY = event.clientY;
        return;
      }
      isDragging = true;
      // Применяем will-change ТОЛЬКО во время драга
      sheetRef.current.style.willChange = 'transform';
    }
  }
  
  // Применяем transform
  currentOffset = Math.max(0, deltaY);
  sheetRef.current.style.transform = `translateY(${currentOffset}px)`;
};

const handlePointerUp = (event: PointerEvent) => {
  if (startY === null) return;
  
  const deltaY = event.clientY - startY;
  const deltaTime = Date.now() - startTime;
  const velocity = deltaY / deltaTime; // px/ms
  
  // Относительный порог: min(120px, 25% высоты модалки)
  const sheetHeight = sheetRef.current.offsetHeight;
  const threshold = Math.min(120, sheetHeight * 0.25);
  
  // Закрываем если: distance > threshold ИЛИ velocity > 0.5px/ms
  if (deltaY > threshold || velocity > 0.5) {
    onClose();
  } else {
    // Возвращаем на место
    sheetRef.current.style.transform = 'translateY(0)';
  }
  
  // ВАЖНО: Удаляем will-change сразу после завершения драга
  sheetRef.current.style.willChange = '';
  
  startY = null;
  isDragging = false;
};
```

### 4. Input Focus Manager

**Назначение**: Управление фокусом полей ввода с учетом клавиатуры.

**Реализация**:
```typescript
const useInputFocus = () => {
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const tg = window.Telegram?.WebApp;
    
    // Расширяем viewport ТОЛЬКО если высота мала (<500px)
    if (tg?.isVersionAtLeast?.('6.1') && tg.viewportStableHeight < 500) {
      tg.expand();
    }
    
    // Прокручиваем элемент в центр
    setTimeout(() => {
      event.target.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
    }, 300); // Задержка для появления клавиатуры
  }, []);
  
  return { handleFocus };
};

// Использование
const { handleFocus } = useInputFocus();
<input onFocus={handleFocus} />
```

### 5. Gesture Manager

**Назначение**: Централизованное управление touch/pointer событиями.

**Интерфейс**:
```typescript
interface GestureConfig {
  element: HTMLElement;
  onSwipeDown?: (distance: number) => void;
  onSwipeUp?: (distance: number) => void;
  passive?: boolean;
  threshold?: number;
}

class GestureManager {
  private config: GestureConfig;
  private startY: number | null = null;
  private startTime: number = 0;
  private pointerId: number | null = null;
  
  constructor(config: GestureConfig) {
    this.config = { threshold: 50, passive: true, ...config };
  }
  
  attach() {
    const options = { passive: this.config.passive };
    this.config.element.addEventListener('pointerdown', this.handleStart, options);
    this.config.element.addEventListener('pointermove', this.handleMove, options);
    this.config.element.addEventListener('pointerup', this.handleEnd, options);
    this.config.element.addEventListener('pointercancel', this.handleEnd, options);
  }
  
  detach() {
    this.config.element.removeEventListener('pointerdown', this.handleStart);
    this.config.element.removeEventListener('pointermove', this.handleMove);
    this.config.element.removeEventListener('pointerup', this.handleEnd);
    this.config.element.removeEventListener('pointercancel', this.handleEnd);
  }
  
  private handleStart = (e: PointerEvent) => {
    this.startY = e.clientY;
    this.startTime = Date.now();
    this.pointerId = e.pointerId;
    
    // Capture pointer for reliable tracking
    this.config.element.setPointerCapture(e.pointerId);
  };
  
  private handleMove = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    // Логика обработки движения
  };
  
  private handleEnd = (e: PointerEvent) => {
    if (this.startY === null || this.pointerId !== e.pointerId) return;
    
    const deltaY = e.clientY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    const velocity = deltaY / deltaTime; // px/ms
    
    // Check threshold OR velocity
    if (Math.abs(deltaY) > this.config.threshold || Math.abs(velocity) > 0.5) {
      if (deltaY > 0 && this.config.onSwipeDown) {
        this.config.onSwipeDown(deltaY);
      } else if (deltaY < 0 && this.config.onSwipeUp) {
        this.config.onSwipeUp(Math.abs(deltaY));
      }
    }
    
    // Release pointer capture
    if (this.pointerId !== null) {
      this.config.element.releasePointerCapture(this.pointerId);
    }
    
    this.startY = null;
    this.pointerId = null;
  };
}
```

## Data Models

### CSS Variables

```typescript
interface CSSVariables {
  '--vh': string;              // Высота viewport в px
  '--safe-area-inset-top': string;
  '--safe-area-inset-bottom': string;
  '--safe-area-inset-left': string;
  '--safe-area-inset-right': string;
}
```

### Scroll State

```typescript
interface ScrollState {
  isScrolling: boolean;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}
```

## Error Handling

### 1. Fallback для WebApp API

```typescript
const getViewportHeight = (): number => {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.viewportStableHeight) {
      return tg.viewportStableHeight;
    }
  } catch (error) {
    console.warn('WebApp API недоступен:', error);
  }
  
  // Fallback на window.innerHeight
  return window.innerHeight;
};
```

### 2. Обработка ошибок touch событий

```typescript
const safeAddEventListener = (
  element: HTMLElement,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  try {
    element.addEventListener(event, handler, options);
  } catch (error) {
    console.error(`Ошибка добавления слушателя ${event}:`, error);
    // Fallback на пассивный слушатель
    element.addEventListener(event, handler, { passive: true });
  }
};
```

### 3. Защита от memory leaks

```typescript
const useGestureCleanup = (ref: RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const cleanup = () => {
      // Удаление всех слушателей
    };
    
    return cleanup;
  }, [ref]);
};
```

## Testing Strategy

### 1. Unit Tests

**Viewport Manager**:
```typescript
describe('ViewportManager', () => {
  it('должен устанавливать --vh при инициализации', () => {
    ViewportManager.initialize();
    const vh = document.documentElement.style.getPropertyValue('--vh');
    expect(vh).toBeTruthy();
  });
  
  it('должен обновлять --vh при изменении viewport', () => {
    const initialVh = document.documentElement.style.getPropertyValue('--vh');
    window.dispatchEvent(new Event('resize'));
    const newVh = document.documentElement.style.getPropertyValue('--vh');
    expect(newVh).toBeDefined();
  });
});
```

**Bottom Sheet Swipe**:
```typescript
describe('BottomSheet swipe', () => {
  it('должен закрываться при свайпе вниз > min(120px, 0.25*sheetHeight)', () => {
    const onClose = jest.fn();
    const { container } = render(<BottomSheet onClose={onClose} />);
    
    const sheet = container.querySelector('.bottom-sheet-content');
    const sheetHeight = sheet.offsetHeight;
    const threshold = Math.min(120, sheetHeight * 0.25);
    
    fireEvent.pointerDown(sheet, { clientY: 100 });
    fireEvent.pointerMove(sheet, { clientY: 100 + threshold + 10 });
    fireEvent.pointerUp(sheet, { clientY: 100 + threshold + 10 });
    
    expect(onClose).toHaveBeenCalled();
  });
  
  it('должен закрываться при высокой velocity даже если distance < threshold', () => {
    const onClose = jest.fn();
    const { container } = render(<BottomSheet onClose={onClose} />);
    
    const sheet = container.querySelector('.bottom-sheet-content');
    const startTime = Date.now();
    
    fireEvent.pointerDown(sheet, { clientY: 100 });
    // Быстрый свайп: 80px за 100ms = 0.8px/ms > 0.5px/ms
    fireEvent.pointerMove(sheet, { clientY: 180 });
    fireEvent.pointerUp(sheet, { clientY: 180 });
    
    expect(onClose).toHaveBeenCalled();
  });
  
  it('не должен закрываться при малом distance и низкой velocity', () => {
    const onClose = jest.fn();
    const { container } = render(<BottomSheet onClose={onClose} />);
    
    const sheet = container.querySelector('.bottom-sheet-content');
    fireEvent.pointerDown(sheet, { clientY: 100 });
    fireEvent.pointerMove(sheet, { clientY: 150 }); // 50px медленно
    fireEvent.pointerUp(sheet, { clientY: 150 });
    
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

### 2. Integration Tests

**Scroll Behavior**:
```typescript
describe('Scroll integration', () => {
  it('должен блокировать фоновый скролл при открытии Bottom Sheet', () => {
    const { container } = render(<App />);
    
    // Открываем Bottom Sheet
    fireEvent.click(container.querySelector('[data-testid="open-sheet"]'));
    
    // Проверяем класс body
    expect(document.body.classList.contains('body-no-scroll')).toBe(true);
    
    // Закрываем Bottom Sheet
    fireEvent.click(container.querySelector('[data-testid="close-sheet"]'));
    
    // Проверяем что класс удален
    expect(document.body.classList.contains('body-no-scroll')).toBe(false);
  });
});
```

### 3. E2E Tests (Manual)

**iOS Testing Checklist**:
- [ ] Скролл работает плавно без "резинки"
- [ ] Свайп-to-close работает в Bottom Sheet
- [ ] Клавиатура не вызывает скачков интерфейса
- [ ] Горизонтальные списки не конфликтуют с системным свайпом назад
- [ ] BackButton корректно работает на всех экранах

**Android Testing Checklist**:
- [ ] Скролл работает плавно
- [ ] Свайп-to-close работает в Bottom Sheet
- [ ] Клавиатура корректно изменяет viewport
- [ ] Touch события обрабатываются без задержек

### 4. ScrollTester Component

```typescript
const ScrollTester: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({
    scrollTop: 0,
    isAtTop: true,
    isAtBottom: false
  });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Используем IntersectionObserver для отслеживания границ
    const topSentinel = document.createElement('div');
    const bottomSentinel = document.createElement('div');
    topSentinel.style.height = '1px';
    bottomSentinel.style.height = '1px';
    
    container.prepend(topSentinel);
    container.append(bottomSentinel);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === topSentinel) {
            setScrollInfo(prev => ({ ...prev, isAtTop: entry.isIntersecting }));
          } else if (entry.target === bottomSentinel) {
            setScrollInfo(prev => ({ ...prev, isAtBottom: entry.isIntersecting }));
          }
        });
      },
      { root: container, threshold: 1.0 }
    );
    
    observer.observe(topSentinel);
    observer.observe(bottomSentinel);
    
    // Обновление scrollTop через RAF (не прямой scroll handler)
    let rafId: number;
    const updateScrollPosition = () => {
      if (container) {
        setScrollInfo(prev => ({ ...prev, scrollTop: container.scrollTop }));
      }
      rafId = requestAnimationFrame(updateScrollPosition);
    };
    rafId = requestAnimationFrame(updateScrollPosition);
    
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      topSentinel.remove();
      bottomSentinel.remove();
    };
  }, []);
  
  return (
    <div ref={containerRef} className="view">
      <div style={{ padding: '20px' }}>
        <h2>Scroll Tester</h2>
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          background: 'var(--tg-theme-bg-color)',
          padding: '10px',
          marginBottom: '10px',
          zIndex: 10
        }}>
          <p>Scroll Position: {scrollInfo.scrollTop}px</p>
          <p>At Top: {scrollInfo.isAtTop ? 'Yes' : 'No'}</p>
          <p>At Bottom: {scrollInfo.isAtBottom ? 'Yes' : 'No'}</p>
          <p><small>Using IntersectionObserver + RAF (no direct scroll handler)</small></p>
        </div>
        
        <ul>
          {Array.from({ length: 100 }, (_, i) => (
            <li key={i} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              Item {i + 1}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

## Performance Considerations

### 1. Оптимизация transform

```css
.bottom-sheet-content {
  /* will-change применяется ТОЛЬКО через JS во время анимации */
  /* transform: translateZ(0) также применяется ТОЛЬКО во время анимации через JS */
  /* Статический GPU hint увеличивает расход батареи и риск layout-глитчей */
}

/* Применяем GPU acceleration ТОЛЬКО во время анимации */
.bottom-sheet-content.is-animating {
  transform: translateZ(0);
  will-change: transform;
}
```

### 2. Throttling scroll events

```typescript
const useThrottledScroll = (callback: () => void, delay: number = 100) => {
  const timeoutRef = useRef<number | null>(null);
  
  return useCallback(() => {
    if (timeoutRef.current) return;
    
    timeoutRef.current = window.setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay]);
};
```

### 3. Passive event listeners

```typescript
// По умолчанию все touch события пассивные
element.addEventListener('touchmove', handler, { passive: true });

// Только для специфичных случаев (карусели, свайпы)
element.addEventListener('touchmove', handler, { passive: false });
```

## Migration Plan

### Phase 0: Code Hygiene (100% Blocker)
1. Добавить ViewportManager в начало index.tsx
2. Обновить глобальные стили (html, body, #app)
3. Настроить eslint/stylelint правила для запрета 100vh и unsafe touch events
4. Заменить все `100vh` на `var(--vh)` (должно быть 0 вхождений)
5. Установить touch event policy (passive: true по умолчанию)

### Phase 1: Base Navigation & Containers (Критично)
1. Настроить BackButton и enableClosingConfirmation
2. Обернуть все экраны в .view контейнеры
3. Добавить `.body-no-scroll` класс
4. Создать отдельные scroll-area для вложенного контента
5. Определить History Policy (push vs replace)

### Phase 2: Overlays & Modals (Высокий приоритет)
1. Обновить BottomSheet с блокировкой фонового скролла
2. Реализовать улучшенный swipe-to-close с velocity detection
3. Добавить focus trap и aria-modal для accessibility
4. Применить touch-action: pan-y к горизонтальным элементам
5. Создать ScrollManager для централизованного управления

### Phase 3: Input & Keyboard (Высокий приоритет)
1. Создать useInputFocus hook с умной логикой expand()
2. Реализовать scrollIntoView с центрированием
3. Добавить safe-area-inset-top для фиксированных заголовков
4. Тестировать поведение клавиатуры на разных устройствах

### Phase 4: Platform Stability (Средний приоритет)
1. Заменить position: fixed на sticky/flex где возможно
2. Добавить GPU hints (will-change) с ограничениями
3. Настроить горизонтальные списки с touch-action
4. Реализовать scroll position restoration
5. Добавить RTL поддержку

### Phase 5: Quality & Regression Prevention (Средний приоритет)
1. Создать ScrollTester компонент
2. Добавить Telegram WebApp API mocks
3. Реализовать fallbacks и safe event listeners
4. Настроить UX телеметрию
5. Провести кросс-платформенное тестирование
6. Создать документацию и troubleshooting guide

## Definition of Done (Binary Checks)

### Code Quality (BLOCKING)
- [ ] **0 occurrences** of `100vh` or `100dvh` in codebase (grep check, CI fails if found)
- [ ] **0 occurrences** of `will-change` in static CSS (grep check, CI fails)
- [ ] All form elements have `font-size >= 16px` (stylelint check, CI fails)
- [ ] All touch event listeners use `{ passive: true }` by default (eslint check)
- [ ] Exceptions for `{ passive: false }` have eslint-disable with justification comment
- [ ] Pointer events used instead of legacy touch events in swipe handlers
- [ ] Stylelint and ESLint rules configured and passing in CI
- [ ] CI build FAILS if any hygiene check fails

### Scroll Behavior (BINARY)
- [ ] `body` **NEVER** scrolls (automated test: body.scrollTop always === 0)
- [ ] Each screen has **EXACTLY ONE** `.view { overflow: auto; min-height: 0 }` container (automated count via check-view-containers.sh)
- [ ] **NO** screens with zero or multiple .view containers (automated verification)
- [ ] When modal opens, `body` gets `.body-no-scroll` class (unit test)
- [ ] Background **NEVER** scrolls when modal is open (e2e test with scroll attempt)
- [ ] History back restores previous scrollTop (integration test with exact position check)
- [ ] Scroll restoration waits for async content (integration test: list → async detail → back)
- [ ] **NO** visual "jump" during scroll restoration (manual test)

### Navigation (BINARY)
- [ ] BackButton shows/hides correctly on each screen (unit test)
- [ ] BackButton onClick fires **EXACTLY ONCE** per click (unit test with spy)
- [ ] History policy documented with push/replace rules
- [ ] **NO** accidental WebView exit on system back (manual test on real device)
- [ ] First navigation in WebView uses replaceState (unit test)

### Keyboard & Input (BINARY)
- [ ] **NO** height jump on iOS when keyboard opens (manual test, visual verification)
- [ ] **NO** auto-zoom on iOS when focusing inputs (font-size >= 16px check)
- [ ] Input field **VISIBLE** after focus() (automated test: element.getBoundingClientRect in viewport)
- [ ] Input field **NOT COVERED** by MainButton when visible (manual test)
- [ ] expand() called **ONLY** when viewportStableHeight < 500px (unit test with mock)
- [ ] MainButton inset applied dynamically when MainButton shows/hides (unit test)

### Gestures (BINARY)
- [ ] Horizontal lists **DO NOT** conflict with iOS swipe-back (manual test on real iPhone)
- [ ] `touch-action: pan-y` applied to **ALL** horizontal containers (automated CSS check)
- [ ] `touch-action: none` applied to drag handle **ONLY** (automated CSS check)
- [ ] Pointer events used instead of touch events in swipe handlers (code review)
- [ ] Swipe-to-close uses velocity **AND** distance (unit test with both criteria)
- [ ] Close threshold is `min(120px, 0.25 * sheetHeight)` (unit test with calculation)
- [ ] **NO** accidental drag-ghost on images/links (manual test on iOS/Android)

### Accessibility (BINARY)
- [ ] Focus trap **WORKS** in all modals (unit test: Tab cycles within modal)
- [ ] `aria-modal="true"` on **ALL** modal containers (automated DOM check)
- [ ] Focus returns to trigger element on close (unit test with activeElement check)
- [ ] Escape key closes modal (unit test with keyboard event)

### Platform Compatibility (BINARY)
- [ ] Safe area insets applied: top (fixed headers only), bottom, left, right (CSS check)
- [ ] RTL mode: all screens work correctly with `dir="rtl"` (manual test)
- [ ] Theme switch: **NO** contrast issues, **NO** reload (manual test + automated contrast check)
- [ ] `overscroll-behavior: none` on root element (CSS check)

### Performance (BINARY)
- [ ] `will-change` **ABSENT** in static CSS (automated grep check)
- [ ] `will-change` removed after animation completes (runtime check in tests)
- [ ] **NO** large elements with `position: fixed` (automated check, only small elements allowed)
- [ ] Scroll tracking uses IntersectionObserver/RAF, **NOT** direct scroll events (code review)
- [ ] Throttling (100ms) applied to scroll metrics **ONLY** (unit test)
- [ ] viewportChanged handler uses RAF + debounce (50-100ms) (code review)

### Monitoring (BINARY)
- [ ] UX telemetry logs: double scroll, background scroll, cancelled swipe (integration test)
- [ ] All logs include platform (iOS/Android) and container context (automated check)
- [ ] **0 UX errors** on clean user flow (integration test: no error logs)

### Testing (BINARY)
- [ ] Unit tests with WebApp API mocks (viewportChanged, BackButton, themeChanged)
- [ ] Integration tests for scroll behavior (restoration, blocking, isolation)
- [ ] E2E tests on iOS 15/16/17 (Safari + Telegram) - manual checklist
- [ ] E2E tests on Android 10-14 (Chrome + Telegram) - manual checklist
- [ ] Test cases executed: keyboard, long lists, carousels, nested scrolls, 2+ modal stack

## Linting Configuration

### Stylelint - Ban 100vh/100dvh

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/^(height|min-height|max-height)$/": ["/\\b100d?vh\\b/"]
    },
    "custom-messages": {
      "declaration-property-value-disallowed-list": "Use var(--vh) instead of 100vh/100dvh for viewport height"
    }
  }
}
```

### ESLint - Touch Event Policy

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^touch/]",
        message: 'Touch listeners must use { passive: true } by default. Use { passive: false } only in whitelisted components (BottomSheet, Carousel) with eslint-disable and justification comment.'
      }
    ]
  }
};
```

### CI/CD Checks

```bash
#!/bin/bash
# check-scroll-hygiene.sh

echo "Checking for 100vh/100dvh usage..."
if grep -r "100vh\|100dvh" src/ --include="*.css" --include="*.tsx" --include="*.ts"; then
  echo "❌ FAIL: Found 100vh/100dvh usage. Use var(--vh) instead."
  exit 1
fi

echo "Checking body overflow..."
if grep -r "body.*overflow.*auto\|body.*overflow.*scroll" src/ --include="*.css"; then
  echo "❌ FAIL: body should only have overflow: hidden"
  exit 1
fi

echo "Checking for will-change in static CSS..."
if grep -r "will-change" src/ --include="*.css"; then
  echo "❌ FAIL: will-change should only be applied via JS during animations"
  exit 1
fi

echo "✅ All scroll hygiene checks passed"
```

## Browser Compatibility

### Поддерживаемые браузеры
- iOS Safari 15+ (iOS 15, 16, 17)
- Android Chrome 80+ (Android 10-14)
- Telegram WebView (iOS/Android)

### Fallbacks
- `viewportStableHeight` → `window.innerHeight`
- `pointer events` → `touch events`
- CSS `overscroll-behavior` → JavaScript prevention

## Security Considerations

1. **XSS Protection**: Все пользовательские вводы санитизируются
2. **Event Listener Cleanup**: Все слушатели удаляются при unmount
3. **Memory Leaks**: Используем WeakMap для хранения ссылок на элементы

## Accessibility

1. **Keyboard Navigation**: Все интерактивные элементы доступны с клавиатуры
2. **Screen Readers**: ARIA атрибуты для модальных окон
3. **Focus Management**: Фокус возвращается при закрытии модалок
4. **Focus Trap**: Фокус остается внутри модального окна

```typescript
const useFocusTrap = (containerRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [containerRef]);
};

const BottomSheet: FC<BottomSheetProps> = ({ onClose, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useFocusTrap(sheetRef);
  
  useEffect(() => {
    // Сохраняем текущий фокус
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Обработка Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Возвращаем фокус при закрытии
      previousFocusRef.current?.focus();
    };
  }, [onClose]);
  
  return (
    <div ref={sheetRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};
```

## Additional Components

### ScrollManager

Централизованное управление скроллом и оверлеями:

```typescript
class ScrollManager {
  private activeContainer: HTMLElement | null = null;
  private overlayStack: number = 0;
  private listeners: Map<string, Set<Function>> = new Map();
  
  setActiveContainer(container: HTMLElement) {
    this.activeContainer = container;
    this.emit('activeContainerChanged', container);
  }
  
  scrollToTop() {
    if (this.activeContainer) {
      this.activeContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  scrollToBottom() {
    if (this.activeContainer) {
      this.activeContainer.scrollTo({ 
        top: this.activeContainer.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }
  
  get isAtTop(): boolean {
    return this.activeContainer?.scrollTop === 0;
  }
  
  get isAtBottom(): boolean {
    if (!this.activeContainer) return false;
    const { scrollTop, scrollHeight, clientHeight } = this.activeContainer;
    return scrollTop + clientHeight >= scrollHeight - 1;
  }
  
  pushOverlay() {
    this.overlayStack++;
    if (this.overlayStack === 1) {
      document.body.classList.add('body-no-scroll');
    }
  }
  
  popOverlay() {
    this.overlayStack = Math.max(0, this.overlayStack - 1);
    if (this.overlayStack === 0) {
      document.body.classList.remove('body-no-scroll');
    }
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }
  
  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const scrollManager = new ScrollManager();
```

### History Policy Helper

**Implementation**: See `src/lib/NavigationManager.ts`

**History Policy Rules**:
1. **First navigation in WebView**: ALWAYS use `replaceState` to prevent accidental exit
2. **Modal opens**: Use `replaceState` to avoid exit on back button
3. **Screen-to-screen navigation**: Use `pushState` for proper back navigation
4. **System back button**: Handled via Telegram WebApp BackButton API

```typescript
interface NavigationOptions {
  replace?: boolean;
  state?: any;
}

class NavigationManager {
  private isInWebView: boolean;
  private firstNavigationDone: boolean = false;
  
  constructor() {
    this.isInWebView = !!window.Telegram?.WebApp;
  }
  
  /**
   * Navigate to a path with proper history management
   * 
   * @param path - The path to navigate to
   * @param options - Navigation options
   * @param options.replace - Force replaceState instead of pushState
   * @param options.state - State object to store with history entry
   */
  navigateTo(path: string, options: NavigationOptions = {}) {
    const { replace = false, state = {} } = options;
    
    // In WebView, ALWAYS use replace for first navigation
    // This prevents exit when user presses back on the first screen
    if (this.isInWebView && !this.firstNavigationDone) {
      window.history.replaceState(state, '', path);
      this.firstNavigationDone = true;
      return;
    }
    
    // Use replaceState if explicitly requested (e.g., for modals)
    if (replace) {
      window.history.replaceState(state, '', path);
    } else {
      // Normal screen-to-screen navigation uses pushState
      window.history.pushState(state, '', path);
    }
  }
  
  /**
   * Navigate back in history
   * If no history exists, closes the WebApp
   */
  navigateBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // No history - close the WebApp
      window.Telegram?.WebApp?.close();
    }
  }
  
  /**
   * Check if this is the first navigation in the session
   */
  isFirstNavigation(): boolean {
    return !this.firstNavigationDone;
  }
  
  /**
   * Reset the first navigation flag (useful for testing)
   */
  reset() {
    this.firstNavigationDone = false;
  }
}

export const navigationManager = new NavigationManager();
```

**Usage Examples**:

```typescript
// Screen-to-screen navigation (uses pushState)
navigationManager.navigateTo('/services');

// Modal open (uses replaceState to prevent exit on back)
navigationManager.navigateTo('/modal/add-service', { replace: true });

// Navigate back
navigationManager.navigateBack();
```

### Scroll Position Restoration

```typescript
const useScrollRestoration = (key: string) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Ждем готовности контента через MutationObserver
    const observer = new MutationObserver((mutations) => {
      // Проверяем, что контент загружен (есть дочерние элементы)
      if (container.children.length > 0) {
        setIsContentReady(true);
        observer.disconnect();
      }
    });
    
    observer.observe(container, { childList: true, subtree: true });
    
    // Если контент уже есть
    if (container.children.length > 0) {
      setIsContentReady(true);
      observer.disconnect();
    }
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!isContentReady || !containerRef.current) return;
    
    // Восстанавливаем позицию ТОЛЬКО после готовности контента
    const savedPosition = sessionStorage.getItem(`scroll_${key}`);
    if (savedPosition) {
      // Используем RAF для предотвращения "прыжка"
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = parseInt(savedPosition, 10);
        }
      });
    }
  }, [isContentReady, key]);
  
  useEffect(() => {
    // Сохраняем позицию при размонтировании
    return () => {
      if (containerRef.current) {
        sessionStorage.setItem(
          `scroll_${key}`, 
          containerRef.current.scrollTop.toString()
        );
      }
    };
  }, [key]);
  
  return containerRef;
};

// Использование
const MyScreen = () => {
  const scrollRef = useScrollRestoration('my-screen');
  
  return (
    <div ref={scrollRef} className="view">
      {/* content */}
    </div>
  );
};
```

### MainButton Inset Hook

```typescript
const useMainButtonInset = () => {
  const [inset, setInset] = useState(0);
  
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    
    const updateInset = () => {
      // MainButton высота обычно ~48px + safe-area-inset-bottom
      const mainButtonHeight = tg.MainButton.isVisible ? 48 : 0;
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--safe-area-inset-bottom') || '0'
      );
      setInset(mainButtonHeight + safeAreaBottom);
    };
    
    // Начальное значение
    updateInset();
    
    // Проверяем изменения каждые 150ms (polling fallback)
    // Telegram WebApp API не предоставляет событие для MainButton visibility
    // 150ms снижает шум без ухудшения UX
    const interval = setInterval(updateInset, 150);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return inset;
};

// Использование
const MyScreen = () => {
  const mainButtonInset = useMainButtonInset();
  
  return (
    <div 
      className="view" 
      style={{ paddingBottom: `${mainButtonInset}px` }}
    >
      {/* content */}
    </div>
  );
};
```

### UX Telemetry

```typescript
interface TelemetryEvent {
  type: 'double_scroll' | 'background_scroll' | 'swipe_cancelled';
  context: {
    platform: 'ios' | 'android';
    container?: string;
    reason?: string;
  };
  timestamp: number;
}

class TelemetryLogger {
  private events: TelemetryEvent[] = [];
  
  log(type: TelemetryEvent['type'], context: Partial<TelemetryEvent['context']>) {
    const event: TelemetryEvent = {
      type,
      context: {
        platform: this.detectPlatform(),
        ...context
      },
      timestamp: Date.now()
    };
    
    this.events.push(event);
    this.sendToMonitoring(event);
  }
  
  private detectPlatform(): 'ios' | 'android' {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('iphone') || ua.includes('ipad') ? 'ios' : 'android';
  }
  
  private sendToMonitoring(event: TelemetryEvent) {
    // Отправка в систему мониторинга
    console.log('[UX Telemetry]', event);
  }
  
  getEvents() {
    return this.events;
  }
  
  clearEvents() {
    this.events = [];
  }
}

export const telemetry = new TelemetryLogger();

// Использование
// В ScrollManager
if (document.body.scrollTop > 0 && this.overlayStack > 0) {
  telemetry.log('background_scroll', { 
    container: 'body',
    reason: 'modal_open'
  });
}
```
