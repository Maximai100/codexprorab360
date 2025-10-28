# Scroll and Swipe Unification Specification

## Overview

Комплексная спецификация для унификации поведения скроллинга, жестов и навигации в Telegram Mini App "Запиши меня". Решение основано на лучших практиках Telegram WebApp API и обеспечивает стабильную работу на iOS и Android.

## Problem Statement

Текущая реализация имеет следующие проблемы:
- Скролл работает по-разному в разных окнах
- Иногда не работает свайп закрытия модалок
- При открытии клавиатуры элементы "прыгают"
- В модалках фон прокручивается
- На iOS бывают "залипания" и резинки
- Свайпы по краю конфликтуют с системным "назад"

## Solution

Унифицированная архитектура с 5 фазами реализации (23 задачи, 100+ подзадач):

### Phase 0: Hygiene (100% Blocker) - Tasks 1-5
- **ViewportManager** для стабильной высоты через --vh
- **Linting rules** (stylelint ban 100vh, eslint ban unsafe passive:false)
- **CI/CD checks** (BLOCKING: fail build if violations found)
- **Replace all 100vh** → var(--vh) (0 occurrences required)
- **Touch event policy** (passive: true default, documented exceptions)

### Phase 1: Navigation & Containers - Tasks 6-9
- **History Policy** (push vs replace, WebView exit prevention)
- **BackButton management** (show/hide, onClick once, cleanup)
- **One .view per screen** (automated verification)
- **ScrollManager** (overlay stack, background blocking, helpers)
- **Scroll restoration** (sessionStorage, nested navigation support)

### Phase 2: Overlays & Modals - Tasks 10-11
- **Enhanced BottomSheet** (velocity + threshold, will-change lifecycle)
- **Focus trap** (keyboard navigation, aria-modal, Escape support)
- **Background scroll blocking** via ScrollManager overlay stack
- **Horizontal scroll** (touch-action: pan-y, iOS edge-back compatibility)

### Phase 3: Input & Keyboard - Tasks 12-13
- **Smart useInputFocus** (expand() only when viewportStableHeight < 500px)
- **scrollIntoView** with center positioning
- **Safe area insets** (top for fixed headers only, bottom/left/right global)

### Phase 4: Platform Stability - Tasks 14-16
- **iOS fixes** (no large position: fixed, GPU hints with limits)
- **RTL support** (logical CSS properties, carousel direction)
- **Theme support** (themeChanged event, --tg-theme-* variables, contrast testing)

### Phase 5: Quality & Regression Prevention - Tasks 17-23
- **ScrollTester** (IntersectionObserver, RAF, no direct scroll handlers)
- **WebApp API mocks** (viewportChanged, BackButton, themeChanged)
- **Performance** (throttling, will-change lifecycle, IO/RAF patterns)
- **UX telemetry** (double scroll, background scroll, cancelled swipes)
- **Cross-platform testing** (iOS 15-17, Android 10-14, test matrix)
- **DoD verification** (31 binary checks, all must pass)
- **Documentation** (architecture, History Policy, linting, troubleshooting)

## Key Components

1. **ViewportManager** - Управление высотой viewport
2. **ScrollManager** - Централизованное управление скроллом
3. **NavigationManager** - History policy и навигация
4. **Enhanced BottomSheet** - Модалки с улучшенными жестами
5. **TelemetryLogger** - Мониторинг UX проблем

## Requirements

20 детальных user stories с acceptance criteria:
- Viewport management (Req 1, 9)
- iOS fixes (Req 2)
- Keyboard handling (Req 3)
- Gestures (Req 4, 7)
- Navigation (Req 5, 17)
- Modals (Req 6)
- Testing (Req 8)
- Touch responsiveness (Req 10)
- Linting (Req 11)
- Safe areas (Req 12)
- Scroll restoration (Req 13)
- Accessibility (Req 14)
- ScrollManager (Req 15)
- Testing mocks (Req 16)
- RTL support (Req 18)
- Theme support (Req 19)
- Telemetry (Req 20)

## Definition of Done (Binary Checks - ALL MUST PASS)

### Code Quality (BLOCKING)
1. [ ] **0 occurrences** of 100vh/100dvh (grep check, CI fails)
2. [ ] **0 occurrences** of will-change in static CSS (grep check, CI fails)
3. [ ] All form elements font-size >= 16px (stylelint check, CI fails)
4. [ ] All touch listeners passive: true (eslint check)
5. [ ] Pointer events used in swipe handlers (code review)
6. [ ] Exceptions documented with eslint-disable + comment

### Scroll Behavior
7. [ ] body **NEVER** scrolls (body.scrollTop === 0 always)
8. [ ] **EXACTLY ONE** .view per screen (automated count)
9. [ ] Background **NEVER** scrolls when modal open (e2e test)
10. [ ] History back restores scrollTop (exact position check)
11. [ ] Scroll restoration waits for async content (integration test)
12. [ ] **NO** visual jump during restoration (manual test)

### Navigation
13. [ ] BackButton onClick fires **EXACTLY ONCE** (spy test)
14. [ ] **NO** accidental WebView exit (manual test)
15. [ ] First navigation uses replaceState (unit test)

### Keyboard & Input
16. [ ] **NO** height jump on iOS keyboard open (manual test)
17. [ ] **NO** auto-zoom on iOS input focus (font-size check)
18. [ ] Input field **VISIBLE** after focus (viewport check)
19. [ ] Input **NOT COVERED** by MainButton (manual test)
20. [ ] expand() **ONLY** when viewportStableHeight < 500px
21. [ ] MainButton inset applied dynamically (unit test)

### Gestures & Accessibility
22. [ ] Horizontal lists **NO** conflict with iOS swipe-back ([GES-001 Test](./IOS_HORIZONTAL_SCROLL_GESTURE_TEST.md))
23. [ ] touch-action: none **ONLY** on drag handle (CSS check)
24. [ ] **NO** drag-ghost on images/links (manual test)
25. [ ] Focus trap **WORKS** (Tab cycles within modal)
26. [ ] Focus returns to trigger on close (activeElement check)

### Platform & Performance
27. [ ] will-change removed after animation (runtime check)
28. [ ] viewportChanged uses RAF + debounce (code review)
29. [ ] RTL mode works (manual test)
30. [ ] Theme switch **NO** contrast issues (manual + automated)
31. [ ] **0 UX errors** on clean flow (telemetry check)

### Test Matrix
- iOS 15, 16, 17 (Safari + Telegram)
- Android 10-14 (Chrome + Telegram)
- Test cases: keyboard, long lists, carousels, nested scrolls, modal stacks

## Files

- `requirements.md` - 20 EARS-compliant requirements with acceptance criteria
- `design.md` - Architecture, components, testing strategy, DoD with 31 binary checks
- `tasks.md` - 23 implementation tasks (100+ subtasks) organized in 5 phases
- `LINTING_CONFIG.md` - Stylelint, ESLint, CI/CD configuration snippets
- `EDGE_CASES.md` - 7 critical edge cases for production-ready solution
- `README.md` - This file (overview and getting started)

## Getting Started

1. Review requirements.md to understand what we're building
2. Study design.md to understand the architecture
3. Open tasks.md and start with Phase 0, Task 1
4. Follow the phases sequentially
5. Verify DoD criteria after each phase

## Key Principles (System Standards)

1. **Viewport Height**: Always use `var(--vh)`, **NEVER** 100vh/100dvh (CI enforced)
2. **iOS Auto-Zoom Prevention**: All form elements `font-size >= 16px` (CI enforced)
3. **Touch Events**: Use pointer events, `{ passive: true }` by default, `{ passive: false }` only with eslint-disable + justification
4. **Drag Handle**: `touch-action: none` **ONLY** on drag handle element, not entire sheet
5. **Scroll Isolation**: **EXACTLY ONE** `.view` per screen, `overscroll-behavior: contain`
6. **Modal Blocking**: Use ScrollManager overlay stack, body **NEVER** scrolls when modal open
7. **will-change Lifecycle**: Apply **ONLY** during animation, remove immediately after
8. **History Policy** (see [HISTORY_POLICY.md](./HISTORY_POLICY.md)):
   - **First navigation in WebView**: ALWAYS use `replaceState` (prevents exit on back)
   - **Modal opens**: Use `replaceState` (prevents exit on back button)
   - **Screen-to-screen navigation**: Use `pushState` (proper back navigation)
   - **System back button**: Handled via Telegram WebApp BackButton API
9. **Scroll Restoration**: Wait for async content ready (MutationObserver) before restoring
10. **MainButton Spacing**: Dynamic `padding-bottom` when MainButton visible (useMainButtonInset)
11. **Accessibility**: Focus trap, `aria-modal="true"`, Escape key, focus return
12. **Performance**: RAF + debounce (50ms) for viewportChanged, IntersectionObserver for tracking
13. **Platform Awareness**: Test on real devices (iOS 15-17, Android 10-14)
14. **Monitoring**: UX telemetry for double scroll, background scroll, cancelled swipes
15. **No Drag Artifacts**: `-webkit-user-drag: none` on images/links, `-webkit-tap-highlight-color: transparent`

## Success Criteria

After implementation:
- Scroll works identically in all windows
- No "bounce" or double scroll
- Keyboard doesn't cause jumps
- Swipe-to-close is predictable
- Modals don't scroll background
- Horizontal lists don't conflict with system gestures
- All automated checks pass
- 0 UX errors in telemetry

## Support

For questions or issues during implementation:
1. Check troubleshooting guide in design.md
2. Review inline code comments
3. Check Definition of Done for specific criteria
4. Run ScrollTester to debug scroll issues
