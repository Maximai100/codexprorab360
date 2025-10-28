# Edge Cases & Production Fixes

7 критичных edge cases для production-ready решения.

## 1. iOS Auto-Zoom Prevention

**Проблема**: iOS автоматически зумит страницу при фокусе на input с `font-size < 16px`.

**Решение**:
```css
/* Глобально для всех форм */
input, textarea, select {
  font-size: 16px;
}
```

**Проверка**:
- Stylelint rule: запрет `font-size < 16px` на form elements
- CI check: grep для поиска нарушений
- Manual test: фокус на input на iPhone не вызывает zoom

**Где**: Task 2.1a

---

## 2. MainButton Overlap Prevention

**Проблема**: Telegram MainButton перекрывает контент у нижней кромки экрана.

**Решение**:
```typescript
const useMainButtonInset = () => {
  const [inset, setInset] = useState(0);
  
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    
    const updateInset = () => {
      const height = tg.MainButton.isVisible ? 48 : 0;
      const safeArea = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-bottom') || '0');
      setInset(height + safeArea);
    };
    
    updateInset();
    // 150ms снижает шум без ухудшения UX
    const interval = setInterval(updateInset, 150);
    return () => clearInterval(interval);
  }, []);
  
  return inset;
};

// Использование
<div className="view" style={{ paddingBottom: `${inset}px` }}>
```

**Проверка**:
- Unit test: inset обновляется при show/hide MainButton
- Manual test: поле у нижней кромки не перекрывается

**Где**: Task 12.2, 12.4

---

## 3. ViewportChanged Debounce

**Проблема**: На некоторых устройствах `viewportChanged` срабатывает слишком часто, вызывая лаги.

**Решение**:
```typescript
const ViewportManager = {
  rafId: null,
  debounceTimer: null,
  
  debouncedUpdate() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      
      this.rafId = requestAnimationFrame(() => {
        const height = tg?.viewportStableHeight || window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${height}px`);
      });
    }, 50); // 50ms debounce
  }
};
```

**Проверка**:
- Code review: RAF + debounce присутствуют
- Performance test: нет лагов при изменении viewport

**Где**: Task 1

---

## 4. Pointer Events Instead of Touch

**Проблема**: Legacy touch events не поддерживают pointer capture и менее универсальны.

**Решение**:
```typescript
// ❌ OLD
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);

// ✅ NEW
element.addEventListener('pointerdown', handler);
element.addEventListener('pointermove', handler);
element.addEventListener('pointerup', handler);
element.addEventListener('pointercancel', handler);

// С pointer capture
element.setPointerCapture(event.pointerId);
```

**Policy**: 
- Используй pointer events для всех новых свайпов
- `passive: false` только в drag-обработчике конкретного компонента
- Документируй каждое исключение

**Проверка**:
- Code review: pointer events в swipe handlers
- ESLint: запрет touch events без обоснования

**Где**: Task 10.3

---

## 5. Drag Handle with touch-action: none

**Проблема**: Свайп на handle может конфликтовать с вертикальным скроллом контента.

**Решение**:
```css
/* Только на handle, НЕ на весь sheet */
.bottom-sheet-handle {
  touch-action: none;
  cursor: grab;
}

.bottom-sheet-handle:active {
  cursor: grabbing;
}

/* Контент sheet остается с обычным touch-action */
.bottom-sheet-content {
  touch-action: auto;
}
```

**Проверка**:
- CSS check: `touch-action: none` только на `.bottom-sheet-handle`
- Manual test: свайп на handle всегда работает, скролл контента не мешает

**Где**: Task 10.3

---

## 6. Async Content Scroll Restoration

**Проблема**: Восстановление scrollTop до загрузки контента вызывает "прыжок".

**Решение**:
```typescript
const useScrollRestoration = (key: string) => {
  const [isContentReady, setIsContentReady] = useState(false);
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (container.children.length > 0) {
        setIsContentReady(true);
        observer.disconnect();
      }
    });
    
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!isContentReady) return;
    
    const savedPosition = sessionStorage.getItem(`scroll_${key}`);
    if (savedPosition) {
      requestAnimationFrame(() => {
        container.scrollTop = parseInt(savedPosition, 10);
      });
    }
  }, [isContentReady, key]);
};
```

**Проверка**:
- Integration test: list → async detail → back (no jump)
- Manual test: визуально нет "прыжка"

**Где**: Task 9.1, 9.3

---

## 7. Prevent Drag Artifacts

**Проблема**: На iOS/Android случайные drag-ghost на изображениях и ссылках.

**Решение**:
```css
/* Запрет drag на изображениях и ссылках */
img, a {
  -webkit-user-drag: none;
  user-drag: none;
}

/* Убираем tap highlight на всех элементах */
* {
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}

html, body {
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}
```

**Проверка**:
- CSS check: правила присутствуют в global styles
- Manual test: нет drag-ghost при свайпе по изображениям
- Manual test: нет синей подсветки при тапе

**Где**: Task 2.1b

---

## Summary

Все 7 edge cases добавлены в спецификацию:

| # | Edge Case | Task | DoD Check |
|---|-----------|------|-----------|
| 1 | iOS auto-zoom | 2.1a | #17 |
| 2 | MainButton overlap | 12.2, 12.4 | #19, #21 |
| 3 | viewportChanged debounce | 1 | #28 |
| 4 | Pointer events | 10.3 | #5 |
| 5 | Drag handle touch-action | 10.3 | #23 |
| 6 | Async scroll restoration | 9.1, 9.3 | #11, #12 |
| 7 | Drag artifacts | 2.1b | #24 |

**Total DoD checks**: 31 (было 21)

**Все проверки BINARY** (pass/fail, no gray area)
