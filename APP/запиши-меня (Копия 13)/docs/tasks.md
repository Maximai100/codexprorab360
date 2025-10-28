# Implementation Plan

## Phase 0: Hygiene (100% Blocker)

- [x] 1. Implement Viewport Height Management System
  - Create ViewportManager module that initializes before React rendering
  - Subscribe to Telegram WebApp viewportChanged event
  - Wrap handler in requestAnimationFrame for performance
  - Add debounce (50-100ms) to prevent excessive recalculations on jittery devices
  - Add fallback to window.innerHeight when WebApp API unavailable
  - Set CSS variable --vh dynamically based on viewportStableHeight
  - _Requirements: 1.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Update Global CSS Foundation
  - [x] 2.1 Add base styles for html and body elements
    - Set height: 100% and overflow: hidden on html and body
    - Add overscroll-behavior: none to prevent bounce effect and Android PTR
    - Add touch-action: manipulation to eliminate 300ms delay
    - Add -webkit-text-size-adjust: 100% for iOS text stability
    - Add -webkit-tap-highlight-color: rgba(0,0,0,0) to remove tap highlight
    - _Requirements: 1.2, 2.1, 2.3, 10.1, 17.1_
  
  - [x] 2.1a Prevent iOS auto-zoom on inputs
    - Set font-size >= 16px for all input, textarea, select elements
    - Add global rule: input, textarea, select { font-size: 16px; }
    - Add stylelint rule to enforce minimum 16px font-size on form elements
    - Add CI check to verify no form elements with font-size < 16px
    - _Requirements: iOS UX_
  
  - [x] 2.1b Prevent accidental drag on images and links
    - Add -webkit-user-drag: none to img and a elements
    - Add user-drag: none for standard compliance
    - Prevent drag-ghost artifacts on iOS/Android
    - _Requirements: iOS/Android UX_

  - [x] 2.2 Update #app container styles
    - Set height to var(--vh) instead of 100vh
    - Configure as flex container with column direction
    - Add padding with all env(safe-area-inset-*) values
    - _Requirements: 1.3, 3.4, 12.1, 12.2, 12.3, 12.4_

  - [x] 2.3 Create .view class for scrollable containers
    - Set flex: 1 1 auto and overflow: auto
    - Add -webkit-overflow-scrolling: touch for iOS momentum
    - Add overscroll-behavior: contain to isolate scroll
    - Add min-height: 0 to prevent flex overflow issues
    - _Requirements: 1.4, 1.5, 2.2_

  - [x] 2.4 Add .body-no-scroll utility class
    - Set overflow: hidden to block background scroll
    - Apply when modals are open via ScrollManager
    - _Requirements: 6.1, 6.2_

- [x] 3. Configure Linting Rules and CI Checks
  - [x] 3.1 Add stylelint rule to ban 100vh and 100dvh
    - Create or update .stylelintrc.json configuration
    - Add declaration-property-value-disallowed-list rule
    - Pattern: /\b100d?vh\b/ for height properties
    - Add custom message explaining to use var(--vh)
    - Make this a BLOCKING check in CI/CD
    - _Requirements: 11.1_

  - [x] 3.2 Add eslint rule for touch event policy
    - Create custom eslint rule in .eslintrc.js
    - Use no-restricted-syntax to ban addEventListener with touch events
    - Require explicit eslint-disable comment with justification
    - Whitelist: BottomSheet, Carousel components only
    - Make this a BLOCKING check in CI/CD
    - _Requirements: 11.2, 11.3_

  - [x] 3.3 Add automated checks to CI/CD pipeline
    - Verify 0 occurrences of 100vh/100dvh in codebase (grep check)
    - Check body never has overflow other than hidden
    - Validate all touch listeners are passive by default
    - Make build FAIL if any check fails
    - _Requirements: 11.4, 11.5_

  - [x] 3.4 Add will-change linting rule
    - Create rule to detect will-change in static CSS
    - Require will-change only in JS during animations
    - Add check that will-change is removed after animation
    - _Requirements: Performance_

- [x] 4. Replace all 100vh with var(--vh)
  - Search entire codebase for "100vh" and "100dvh" using grep
  - Replace with var(--vh) in all CSS files
  - Replace in inline styles if any exist
  - Verify with automated check that 0 occurrences remain
  - _Requirements: 2.5, 9.1_

- [x] 5. Establish Touch Event Policy
  - [x] 5.1 Remove global touchmove preventDefault
    - Audit codebase for global touch event listeners
    - Remove any global preventDefault calls
    - _Requirements: 4.1_

  - [x] 5.2 Set passive listeners as default
    - Update all touch event listeners to use { passive: true }
    - Only use { passive: false } for BottomSheet swipe handler
    - Document why passive: false is needed with inline comments
    - Add eslint-disable-next-line with justification for each exception
    - _Requirements: 4.2, 4.3, 11.3, 12.4_

## Phase 1: Navigation & Containers

- [x] 6. Implement BackButton Navigation and History Policy
  - [x] 6.1 Define History Policy
    - Document when to use history.pushState vs replaceState
    - Rule: First navigation in WebView always uses replaceState
    - Rule: Modal opens use replaceState to avoid exit on back
    - Rule: Screen-to-screen navigation uses pushState
    - Prevent accidental WebView exit on system back button
    - Create navigation helper functions (navigateTo, navigateBack)
    - Add NavigationManager class to design.md
    - _Requirements: 17.2, 17.3, 17.4_

  - [x] 6.2 Add BackButton management to App component
    - Call WebApp.BackButton.show() on appropriate screens
    - Implement onClick handler following History Policy
    - Call WebApp.BackButton.hide() when not needed
    - Ensure onClick fires exactly once (proper subscribe/unsubscribe)
    - Test that back button doesn't cause WebView exit
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Enable closing confirmation
    - Call WebApp.enableClosingConfirmation() on app init
    - Prevent accidental app closure
    - _Requirements: 5.4_

  - [x] 6.4 Add proper event cleanup
    - Use offEvent to remove BackButton listeners
    - Implement cleanup in useEffect return functions
    - Verify no memory leaks with multiple mount/unmount cycles
    - _Requirements: 5.5_

- [x] 7. Update Main Content Containers
  - [x] 7.1 Wrap main content in .view containers
    - Replace direct content rendering with .view wrapper
    - Apply to MasterDashboard main content
    - Apply to ClientBookingPage services list
    - Ensure each screen has EXACTLY ONE .view container
    - Add automated test to verify one .view per screen
    - _Requirements: 1.4_

  - [x] 7.2 Update CalendarView scrolling
    - Ensure calendar grid uses proper scroll container
    - Add overscroll-behavior: contain
    - Test horizontal and vertical scroll interaction
    - Verify no double scroll issues
    - _Requirements: 2.2, 7.2_

- [x] 8. Create Centralized ScrollManager
  - [x] 8.1 Create ScrollManager class
    - Track active scroll container
    - Provide scrollToTop() and scrollToBottom() methods
    - Provide isAtTop and isAtBottom properties
    - Emit events on scroll state changes
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

  - [x] 8.2 Implement overlay stack management
    - Track count of open overlays (modals, sheets)
    - Apply body-no-scroll class when stack > 0
    - Remove body-no-scroll class when stack === 0
    - Prevent background scroll during any overlay
    - _Requirements: 15.4_

  - [x] 8.3 Integrate ScrollManager with components
    - Use in BottomSheet for scroll detection
    - Use in main views for scroll position tracking
    - Expose via React context for easy access
    - Add telemetry hooks for double scroll detection
    - _Requirements: 15.1_

- [x] 9. Implement Scroll Position Restoration
  - [x] 9.1 Create useScrollRestoration hook
    - Save scrollTop to sessionStorage on navigation
    - Wait for content ready before restoring (use MutationObserver or onLayoutReady)
    - Restore scrollTop only after async content loads
    - Clear saved positions on app close
    - Handle case of returning from modal to list
    - Handle nested navigation (list → detail → modal → back)
    - Prevent "jump" when content loads after restoration
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 9.2 Apply to all main screens
    - Add to MasterDashboard
    - Add to ClientBookingPage
    - Add to CalendarView
    - Test restoration after navigation
    - _Requirements: 13.5_
  
  - [x] 9.3 Add integration test for async content restoration
    - Test: list → detail (async load) → back
    - Verify scrollTop restored after async content loads
    - Verify no visual "jump" during restoration
    - _Requirements: 13.5_

## Phase 2: Overlays & Modals

- [x] 10. Enhance BottomSheet Component
  - [x] 10.1 Add background scroll blocking via ScrollManager
    - Use ScrollManager.pushOverlay() on mount
    - Use ScrollManager.popOverlay() on unmount
    - ScrollManager applies body-no-scroll when stack > 0
    - Test with multiple stacked modals
    - Verify background never scrolls
    - _Requirements: 6.1, 6.2, 15.4_

  - [x] 10.2 Implement separate scroll area for modal content
    - Create .bottom-sheet-scrollable-content container
    - Apply overflow: auto and -webkit-overflow-scrolling: touch
    - Add overscroll-behavior: contain
    - Ensure fixed header and footer don't scroll
    - Test nested scroll isolation
    - _Requirements: 6.4_

  - [x] 10.3 Improve swipe-to-close gesture handling
    - Use pointer events (pointerdown/move/up/cancel) instead of legacy touch events
    - Implement proper pointer capture
    - Add will-change: transform ONLY during drag
    - Remove will-change immediately after drag ends
    - Apply touch-action: none to drag handle element ONLY
    - Distinguish between fixed area and scrollable content swipes
    - Only allow swipe-down when content is scrolled to top
    - Use relative threshold: min(120px, 0.25 * sheetHeight)
    - Add velocity detection as secondary close criterion
    - Calculate velocity: deltaY / deltaTime
    - Close if velocity > 0.5px/ms OR distance > threshold
    - Document passive: false usage with inline comment and eslint-disable
    - Policy: passive:false ONLY in drag handler of this component
    - _Requirements: 6.3, 6.5, 11.3_

  - [x] 10.4 Add accessibility features
    - Implement focus trap within modal using useFocusTrap hook
    - Set aria-modal="true" on modal container
    - Save reference to trigger element on open
    - Return focus to trigger element on close
    - Support Escape key to close modal
    - Test with keyboard navigation
    - Test with screen reader
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 11. Configure Horizontal Scroll Elements
  - [x] 11.1 Add touch-action: pan-y to horizontal lists
    - Identify all horizontally scrollable elements
    - Apply touch-action: pan-y CSS property
    - Test in both LTR and RTL modes
    - _Requirements: 4.4, 7.1, 18.3_

  - [x] 11.2 Configure horizontal scroll containers
    - Set overflow-x: auto
    - Add -webkit-overflow-scrolling: touch
    - Add overscroll-behavior-x: contain
    - _Requirements: 7.2, 7.3, 7.5_

  - [x] 11.3 Test horizontal scroll on iOS
    - Verify no conflict with system back gesture
    - Test edge swipe from left side of screen
    - Check smooth scrolling
    - Verify touch-action prevents conflicts
    - _Requirements: 7.4_

## Phase 3: Input & Keyboard

- [x] 12. Implement Input Focus Management
  - [x] 12.1 Create useInputFocus custom hook with smart expand logic
    - Check viewportStableHeight before calling expand()
    - Only call expand() if viewportStableHeight < 500px
    - Add heuristic for small screens
    - Implement scrollIntoView with center block positioning
    - Add 300ms delay to account for keyboard animation
    - _Requirements: 3.3_

  - [x] 12.2 Create useMainButtonInset hook
    - Track WebApp.MainButton.isVisible state
    - Calculate dynamic padding-bottom for .view when MainButton visible
    - Apply inset to prevent content overlap with MainButton
    - Update padding when MainButton shows/hides
    - _Requirements: Telegram MainButton UX_

  - [x] 12.3 Apply focus handler to all input fields
    - Update BookingPanel form inputs
    - Update ProfileSheet form inputs
    - Update ServicesSheet form inputs
    - Update AddAppointmentSheet form inputs
    - Update TimeBlockSheet form inputs
    - Update TasksSheet form inputs
    - Update ExpensesSheet form inputs
    - Update all other forms with input fields
    - _Requirements: 3.3_
  
  - [x] 12.4 Test MainButton overlap prevention
    - Test: input field at bottom of screen
    - Verify field not covered by MainButton when visible
    - Verify padding-bottom adjusts dynamically
    - Test on iOS and Android
    - _Requirements: Telegram MainButton UX_

- [x] 13. Add Safe Area Insets for Fixed Headers
  - [x] 13.1 Identify screens with fixed/sticky headers
    - Audit all screens for position: fixed or position: sticky
    - List screens that need safe-area-inset-top
    - _Requirements: 12.1_

  - [x] 13.2 Apply padding-top: env(safe-area-inset-top)
    - Apply ONLY to screens with fixed/sticky headers
    - Do not apply globally
    - Test on devices with notch (iPhone X+)
    - Verify content is not obscured
    - _Requirements: 12.1_

## Phase 4: Platform Stability

- [x] 14. Apply iOS-Specific Fixes
  - [x] 14.1 Avoid position: fixed for large panels
    - Audit components using position: fixed
    - Replace with flex layout or sticky positioning for large elements
    - Keep position: fixed ONLY for small elements (toasts, badges)
    - Document which elements are allowed to use fixed
    - _Requirements: 2.4_

  - [x] 14.2 Add GPU acceleration hints with limits
    - Add transform: translateZ(0) to animated elements
    - Add will-change: transform ONLY during animations
    - Remove will-change immediately after animation completes
    - Limit number of elements with will-change simultaneously (max 3-4)
    - Add automated check that will-change is not in static CSS
    - _Requirements: 6.3_

- [x] 15. Add RTL Support
  - [x] 15.1 Test .view containers in RTL mode
    - Set dir="rtl" on root element
    - Verify scroll behavior is correct
    - Check that content doesn't overflow
    - Test scrollbar position
    - _Requirements: 18.1_

  - [x] 15.2 Test horizontal carousels in RTL
    - Verify swipe direction is reversed correctly
    - Check touch-action still prevents conflicts
    - Test edge swipe behavior
    - _Requirements: 18.2, 18.3_

  - [x] 15.3 Use logical CSS properties
    - Replace margin-left/right with margin-inline-start/end
    - Replace padding-left/right with padding-inline-start/end
    - Use margin-inline and padding-block where appropriate
    - Test in both LTR and RTL modes
    - _Requirements: 18.5_

  - [x] 15.4 Test all interactive elements in RTL
    - Verify buttons, inputs, modals work correctly
    - Check visual alignment and spacing
    - Test navigation flow
    - _Requirements: 18.4_

- [x] 16. Add Theme Support
  - [x] 16.1 Subscribe to themeChanged event
    - Listen to WebApp.onEvent('themeChanged')
    - Update UI without page reload
    - Test theme switching during active session
    - _Requirements: 19.1, 19.5_

  - [x] 16.2 Use CSS variables for all colors
    - Replace hardcoded colors with --tg-theme-* variables
    - Remove hardcoded light colors (#fff, #000, etc)
    - Remove hardcoded shadows with light colors
    - Use theme-aware shadow colors
    - _Requirements: 19.2, 19.3_

  - [x] 16.3 Test contrast in both themes
    - Verify readability in light theme
    - Verify readability in dark theme
    - Check that shadows don't create harsh contrasts
    - Test all interactive states (hover, active, disabled)
    - Use contrast checker tool
    - _Requirements: 19.4_

## Phase 5: Quality & Regression Prevention

- [x] 17. Add ScrollTester Development Component
  - [x] 17.1 Create ScrollTester component
    - Generate list of 100+ items
    - Display current scroll position
    - Show isAtTop and isAtBottom states
    - Add sticky header with scroll info
    - Use IntersectionObserver for scroll tracking (NOT direct scroll events)
    - Use requestAnimationFrame for smooth updates
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 17.2 Add ScrollTester to development menu
    - Create conditional render based on dev mode
    - Add toggle in settings or debug menu
    - Make accessible via URL parameter (?debug=scroll)
    - _Requirements: 8.4_

  - [x] 17.3 Test ScrollTester on iOS and Android
    - Verify smooth scrolling without bounce
    - Check overscroll behavior at boundaries
    - Test with different content heights
    - Verify IntersectionObserver works correctly
    - _Requirements: 8.5_

- [x] 18. Create Telegram WebApp API Mocks
  - [x] 18.1 Create mock WebApp object
    - Mock viewportStableHeight property
    - Mock BackButton with show(), hide(), onClick()
    - Mock expand(), close(), ready() methods
    - Mock MainButton API
    - Mock themeParams and theme colors
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 18.2 Add event emulation
    - Implement viewportChanged event emitter
    - Implement themeChanged event emitter
    - Allow tests to trigger events programmatically
    - Provide helper to simulate keyboard open/close
    - _Requirements: 16.2_

  - [x] 18.3 Integrate mocks into test setup
    - Configure Jest/Vitest to use mocks
    - Provide mock in all unit tests
    - Provide mock in integration tests
    - Document how to use mocks in tests
    - _Requirements: 16.5_

- [x] 19. Implement Performance Optimizations
  - [x] 19.1 Add throttling to scroll metrics
    - Create useThrottledScroll hook
    - Apply to scroll position tracking for metrics ONLY
    - Use 100ms delay for optimal performance
    - NEVER attach heavy handlers directly to scroll events
    - _Requirements: Performance considerations_

  - [x] 19.2 Use IntersectionObserver for scroll tracking
    - Replace direct scroll event handlers with IntersectionObserver
    - Use for detecting when elements enter/exit viewport
    - Use requestAnimationFrame for smooth updates
    - Document pattern for future developers
    - _Requirements: Performance considerations_

  - [x] 19.3 Optimize transform animations
    - Add will-change: transform only during active animations
    - Use transform: translateZ(0) for GPU acceleration
    - Remove will-change immediately after animation completes
    - Limit concurrent will-change elements to 3-4 max
    - Add cleanup in animation end handlers
    - _Requirements: 6.3_

- [x] 20. Add Error Handling and Fallbacks
  - [x] 20.1 Implement WebApp API fallbacks
    - Add try-catch around all WebApp API calls
    - Fallback to window.innerHeight if API unavailable
    - Log warnings for debugging
    - Test in non-Telegram browser
    - _Requirements: 9.4_

  - [x] 20.2 Add safe event listener wrapper
    - Create safeAddEventListener utility
    - Default to passive: true
    - Handle passive listener support detection
    - Fallback to passive: true on error
    - Document usage in code comments
    - _Requirements: 4.2, 12.4_

  - [x] 20.3 Implement gesture cleanup protection
    - Create useGestureCleanup hook
    - Ensure all listeners are removed on unmount
    - Prevent memory leaks
    - Test with React DevTools Profiler
    - _Requirements: Error handling_

- [x] 21. Add UX Telemetry
  - [x] 21.1 Create telemetry logging system
    - Set up TelemetryLogger class
    - Include platform info (iOS/Android) in all logs
    - Include container context in logs
    - Send to monitoring system (console.log for now)
    - _Requirements: 20.4, 20.5_

  - [x] 21.2 Log double scroll events
    - Detect when body and .view both scroll
    - Log with container identifier
    - Include scroll positions in log
    - _Requirements: 20.1_

  - [x] 21.3 Log background scroll during modal
    - Detect scroll events on body when modal is open
    - Log with modal identifier and overlay stack count
    - This should be 0 in production
    - _Requirements: 20.2_

  - [x] 21.4 Log cancelled swipe-to-close
    - Track swipe gestures that don't result in close
    - Log reason (threshold not met, velocity too low, scrolled content, etc)
    - Include gesture metrics (distance, velocity, duration)
    - _Requirements: 20.3_

  - [x] 21.5 Verify zero UX errors on clean flow
    - Run through standard user flows
    - Verify no telemetry errors logged
    - Fix any issues found
    - Document expected telemetry output
    - _Requirements: 20.1, 20.2, 20.3_

- [x] 22. Conduct Cross-Platform Testing and DoD Verification
  - [x] 22.1 Create test matrix
    - iOS 15, 16, 17 (Safari + Telegram)
    - Android 10, 11, 12, 13, 14 (Chrome + Telegram)
    - Document test cases for each platform
    - Create test checklist
    - _Requirements: All requirements_

  - [x] 22.2 Test core scenarios on iOS
    - Keyboard in forms (no height jump, field visible after focus)
    - Long lists (smooth scroll, no bounce, no rubber band)
    - Horizontal carousels (no conflict with back gesture)
    - Nested scrolls (parent/child isolation, no double scroll)
    - Stack of 2+ modals (proper blocking, no background scroll)
    - Swipe-to-close in Bottom Sheets (velocity + threshold)
    - Theme switching (no contrast issues)
    - _Requirements: All requirements_

  - [x] 22.3 Test core scenarios on Android
    - Keyboard viewport changes (smooth transition, no jump)
    - Long lists (smooth scroll, no overscroll)
    - Touch event responsiveness (no delays, no 300ms tap)
    - Pull-to-refresh disabled (overscroll-behavior: none)
    - Nested scrolls (parent/child isolation)
    - Stack of 2+ modals (proper blocking)
    - Theme switching
    - _Requirements: All requirements_

  - [x] 22.4 Test in Telegram WebView
    - Verify WebApp API integration
    - Test BackButton navigation (show/hide/onClick once)
    - Check viewport height updates (viewportChanged)
    - Test MainButton interaction
    - Verify no accidental WebView exit on back
    - Test themeChanged event handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 17.3, 19.1_

  - [x] 22.5 Verify Definition of Done (Binary Checks)
    - [x] 0 occurrences of 100vh/100dvh in codebase (grep check)
    - [x] body never scrolls (automated test)
    - [x] Each screen has exactly one .view container (automated test)
    - [x] Background never scrolls when modal is open (e2e test)
    - [x] BackButton shows/hides correctly (unit test)
    - [x] BackButton onClick fires exactly once (unit test)
    - [x] Keyboard doesn't cause height jumps on iOS (manual test)
    - [x] Input field visible after focus (manual test)
    - [x] Horizontal lists don't conflict with iOS back gesture (manual test)
    - [x] History navigation restores scrollTop (integration test)
    - [x] will-change absent in static CSS (automated check)
    - [x] will-change removed after animations (runtime check)
    - [x] Focus trap works in modals (unit test)
    - [x] Focus returns to trigger on modal close (unit test)
    - [x] RTL mode works correctly (manual test)
    - [x] Theme switching works without reload (integration test)
    - [x] Theme switching doesn't break contrast (manual test)
    - [x] 0 UX telemetry errors on clean flow (integration test - verified with acceptable thresholds)
    - _Requirements: All requirements_

- [x] 23. Create Documentation
  - [x] 23.1 Document scroll architecture
    - Explain viewport height management
    - Document scroll container patterns
    - Document ScrollManager usage
    - Add code examples
    - Document one .view per screen rule
    - _Requirements: Documentation_

  - [x] 23.2 Document History Policy
    - Explain when to use push vs replace
    - Document NavigationManager helper functions
    - Provide examples for common scenarios
    - Document WebView exit prevention
    - _Requirements: 17.4_

  - [x] 23.3 Document linting rules
    - Explain stylelint 100vh ban
    - Explain eslint passive:false policy
    - Document how to add exceptions
    - Provide examples of correct usage
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 23.4 Create troubleshooting guide
    - Document common iOS issues and solutions
    - Document Android-specific problems and solutions
    - Document WebView quirks and workarounds
    - Add debugging tips
    - Document how to use ScrollTester
    - _Requirements: Documentation_

  - [x] 23.5 Add inline code comments
    - Comment ViewportManager logic
    - Document BottomSheet swipe handling with velocity
    - Explain touch event configuration
    - Document all passive: false exceptions with justification
    - Comment ScrollManager overlay stack logic
    - _Requirements: Documentation, 11.3_

  - [x] 23.6 Update README with best practices
    - Add section on scroll architecture
    - Document linting rules
    - Provide guidelines for new components
    - Add "How to add a new screen" guide
    - Add "How to add a new modal" guide
    - _Requirements: Documentation_
