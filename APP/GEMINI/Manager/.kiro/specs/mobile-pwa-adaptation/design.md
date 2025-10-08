# Design Document

## Overview

Данный документ описывает архитектурное решение для адаптации приложения "Панель управления собственниками" под мобильную PWA версию. Дизайн фокусируется на создании полноценного Progressive Web App с офлайн-поддержкой, оптимизированным мобильным интерфейсом и нативными возможностями.

### Key Design Principles

1. **Mobile-First Approach**: Дизайн начинается с мобильной версии и расширяется для больших экранов
2. **Progressive Enhancement**: Базовая функциональность работает везде, расширенные возможности добавляются при наличии поддержки
3. **Offline-First**: Приложение должно работать без подключения к интернету
4. **Touch-Optimized**: Все элементы интерфейса оптимизированы для сенсорного управления
5. **Performance-Focused**: Минимальное время загрузки и плавная работа на мобильных устройствах

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mobile Views │  │  Components  │  │   Gestures   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ State Mgmt   │  │  Hooks       │  │   Context    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      PWA Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Service Worker│  │   Manifest   │  │ Push Notif.  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ IndexedDB    │  │  Cache API   │  │   Directus   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **PWA Framework**: Vite PWA Plugin (vite-plugin-pwa)
- **Service Worker**: Workbox для кэширования и офлайн-стратегий
- **Local Storage**: IndexedDB через Dexie.js для хранения данных
- **UI Framework**: React 19 с Tailwind CSS
- **Gesture Library**: React Use Gesture для обработки свайпов
- **Image Optimization**: Sharp для оптимизации изображений
- **Push Notifications**: Web Push API

## Components and Interfaces

### 1. PWA Configuration

#### Web App Manifest (`manifest.json`)

```json
{
  "name": "Панель управления собственниками",
  "short_name": "Собственники",
  "description": "Система управления документами и данными собственников",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

#### Service Worker Strategy

```typescript
// Caching Strategies:
// 1. App Shell: Cache-First (HTML, CSS, JS)
// 2. API Data: Network-First with Cache Fallback
// 3. Images: Cache-First with Network Fallback
// 4. Documents: Network-First

interface CacheStrategy {
  name: string;
  pattern: RegExp;
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate';
  options?: {
    cacheName: string;
    expiration?: {
      maxEntries: number;
      maxAgeSeconds: number;
    };
  };
}
```

### 2. Mobile UI Components

#### Bottom Navigation Component

```typescript
interface BottomNavProps {
  activeTab: 'owners' | 'projects';
  onTabChange: (tab: 'owners' | 'projects') => void;
  userRole: 'director' | 'manager';
}

// Features:
// - Fixed position at bottom
// - Touch-optimized tap targets (min 44x44px)
// - Active state indication
// - Smooth transitions
// - Safe area insets support for notched devices
```

#### Mobile Card Component

```typescript
interface MobileCardProps {
  data: Owner | Project;
  onTap: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
}

// Features:
// - Swipe gestures for actions
// - Long press for context menu
// - Compact information display
// - Status indicators
// - Touch feedback
```

#### Full-Screen Modal Component

```typescript
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Features:
// - Full-screen on mobile
// - Swipe-down to close
// - Smooth slide-up animation
// - Fixed header and footer
// - Scrollable content area
```

#### Pull-to-Refresh Component

```typescript
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

// Features:
// - Native-like pull gesture
// - Loading indicator
// - Haptic feedback (if supported)
// - Threshold-based trigger
```

### 3. Responsive Layout System

#### Breakpoint Strategy

```typescript
const breakpoints = {
  mobile: '0px',      // 0-639px
  tablet: '640px',    // 640-1023px
  desktop: '1024px',  // 1024px+
};

// Mobile-first approach:
// - Default styles for mobile
// - sm: prefix for tablet
// - lg: prefix for desktop
```

#### Layout Patterns

**Mobile (< 640px)**:
- Single column layout
- Bottom navigation
- Full-screen modals
- Card-based lists
- Stacked forms

**Tablet (640px - 1023px)**:
- Two column layout where appropriate
- Side navigation option
- Modal dialogs (not full-screen)
- Grid-based lists
- Side-by-side forms

**Desktop (1024px+)**:
- Multi-column layout
- Top navigation
- Modal dialogs
- Table-based lists
- Multi-column forms

### 4. Gesture System

#### Supported Gestures

```typescript
interface GestureHandlers {
  onTap: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onPinch: (scale: number) => void;
}

// Implementation using react-use-gesture
```

#### Gesture Mappings

- **Tap**: Open item details
- **Long Press**: Show context menu
- **Swipe Left**: Show delete action
- **Swipe Right**: Show edit action
- **Swipe Down (on modal)**: Close modal
- **Pull Down (on list)**: Refresh data
- **Pinch (on images)**: Zoom in/out

### 5. Offline Data Management

#### IndexedDB Schema

```typescript
interface OfflineDatabase {
  owners: {
    key: string;
    value: Owner;
    indexes: {
      name: string;
      apartment: string;
    };
  };
  projects: {
    key: string;
    value: Project;
    indexes: {
      status: ProjectStatus;
      deadline: string;
      responsible: string;
    };
  };
  syncQueue: {
    key: number;
    value: {
      type: 'create' | 'update' | 'delete';
      collection: 'owners' | 'projects';
      data: any;
      timestamp: number;
    };
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      version: number;
    };
  };
}
```

#### Sync Strategy

```typescript
interface SyncManager {
  // Queue operations when offline
  queueOperation(operation: SyncOperation): void;
  
  // Sync when online
  syncPendingOperations(): Promise<void>;
  
  // Conflict resolution
  resolveConflict(local: any, remote: any): any;
  
  // Background sync
  registerBackgroundSync(): void;
}

// Sync Flow:
// 1. User makes change → Save to IndexedDB
// 2. If online → Sync immediately
// 3. If offline → Add to sync queue
// 4. When online → Process sync queue
// 5. Handle conflicts with last-write-wins strategy
```

### 6. Performance Optimizations

#### Code Splitting Strategy

```typescript
// Route-based code splitting
const OwnersDashboard = lazy(() => import('./components/OwnersDashboard'));
const ProjectsDashboard = lazy(() => import('./components/manager/ManagerDashboard'));
const Login = lazy(() => import('./components/Login'));

// Component-based code splitting
const ProjectDetailModal = lazy(() => import('./components/manager/ProjectDetailModal'));
const DocumentModal = lazy(() => import('./components/DocumentModal'));
```

#### Image Optimization

```typescript
interface ImageOptimization {
  // Lazy loading
  loading: 'lazy';
  
  // Responsive images
  srcSet: string;
  sizes: string;
  
  // WebP with fallback
  sources: Array<{
    type: 'image/webp' | 'image/jpeg';
    srcSet: string;
  }>;
  
  // Blur placeholder
  placeholder: 'blur';
  blurDataURL: string;
}
```

#### Virtual Scrolling

```typescript
// For large lists (>100 items)
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  windowHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

// Only render visible items + buffer
// Dramatically improves performance for large datasets
```

### 7. Mobile-Specific Features

#### Camera Integration

```typescript
interface CameraCapture {
  // Capture photo
  capturePhoto(): Promise<File>;
  
  // Select from gallery
  selectFromGallery(): Promise<File>;
  
  // Compress image
  compressImage(file: File, maxSize: number): Promise<File>;
}

// Implementation using HTML5 File API
// <input type="file" accept="image/*" capture="environment">
```

#### Geolocation Integration

```typescript
interface GeolocationService {
  // Get current position
  getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
  }>;
  
  // Watch position
  watchPosition(callback: (position: Position) => void): number;
  
  // Clear watch
  clearWatch(watchId: number): void;
}
```

#### Share API Integration

```typescript
interface ShareService {
  // Share content
  share(data: {
    title: string;
    text: string;
    url?: string;
    files?: File[];
  }): Promise<void>;
  
  // Check if sharing is supported
  canShare(): boolean;
}
```

### 8. Push Notifications

#### Notification Service

```typescript
interface NotificationService {
  // Request permission
  requestPermission(): Promise<NotificationPermission>;
  
  // Subscribe to push
  subscribe(): Promise<PushSubscription>;
  
  // Unsubscribe
  unsubscribe(): Promise<void>;
  
  // Show notification
  showNotification(title: string, options: NotificationOptions): Promise<void>;
}

// Notification Types:
// - Project deadline approaching
// - Document status changed
// - New project assigned
// - System updates
```

## Data Models

### Mobile-Optimized Data Structures

```typescript
// Lightweight version for list views
interface OwnerListItem {
  id: string;
  name: string;
  apartment: string;
  documentStatus: 'complete' | 'partial' | 'none';
  lastUpdated: string;
}

// Full version for detail views
interface OwnerDetail extends Owner {
  // All existing fields
}

// Similar pattern for Projects
interface ProjectListItem {
  id: string;
  name: string;
  responsible: string;
  deadline: string;
  status: ProjectStatus;
  hasAttachments: boolean;
}
```

### Offline State Management

```typescript
interface OfflineState {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  syncError: string | null;
}

interface AppState {
  offline: OfflineState;
  ui: {
    activeTab: 'owners' | 'projects';
    selectedItem: string | null;
    isModalOpen: boolean;
    isSidebarOpen: boolean;
  };
  data: {
    owners: Owner[];
    projects: Project[];
  };
}
```

## Error Handling

### Offline Error Handling

```typescript
interface ErrorHandler {
  // Network errors
  handleNetworkError(error: Error): void;
  
  // Sync errors
  handleSyncError(error: SyncError): void;
  
  // Storage errors
  handleStorageError(error: DOMException): void;
  
  // User-friendly messages
  getErrorMessage(error: Error): string;
}

// Error Messages:
// - "Нет подключения к интернету. Изменения будут синхронизированы позже."
// - "Не удалось загрузить данные. Показаны сохраненные данные."
// - "Недостаточно места для хранения данных."
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Exponential backoff for failed requests
// 1st retry: 1s
// 2nd retry: 2s
// 3rd retry: 4s
// 4th retry: 8s
// 5th retry: 16s (max)
```

## Testing Strategy

### PWA Testing

1. **Lighthouse Audit**
   - Performance score > 90
   - PWA score = 100
   - Accessibility score > 90
   - Best Practices score > 90

2. **Offline Testing**
   - Test all features in offline mode
   - Verify sync queue functionality
   - Test conflict resolution

3. **Device Testing**
   - iOS Safari (iPhone 12, 13, 14, 15)
   - Android Chrome (various devices)
   - Different screen sizes
   - Different network conditions (3G, 4G, WiFi)

4. **Gesture Testing**
   - All swipe gestures
   - Long press actions
   - Pull-to-refresh
   - Pinch-to-zoom

### Performance Testing

```typescript
// Performance Metrics to Monitor
interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint < 2.5s
  FID: number; // First Input Delay < 100ms
  CLS: number; // Cumulative Layout Shift < 0.1
  
  // PWA Metrics
  TTI: number; // Time to Interactive < 3s
  FCP: number; // First Contentful Paint < 1.8s
  
  // Custom Metrics
  dataLoadTime: number;
  syncTime: number;
  cacheHitRate: number;
}
```

## Security Considerations

### Offline Data Security

```typescript
interface SecurityMeasures {
  // Encrypt sensitive data in IndexedDB
  encryptData(data: any): Promise<string>;
  decryptData(encrypted: string): Promise<any>;
  
  // Clear data on logout
  clearOfflineData(): Promise<void>;
  
  // Secure token storage
  storeToken(token: string): void;
  getToken(): string | null;
  clearToken(): void;
}

// Use Web Crypto API for encryption
// Store tokens in secure storage (not localStorage)
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://aistudiocdn.com; 
               style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
               img-src 'self' data: https:; 
               connect-src 'self' https://1.cycloscope.online;
               worker-src 'self';">
```

## Deployment Strategy

### Build Configuration

```typescript
// vite.config.ts PWA configuration
{
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
    manifest: {
      // manifest.json content
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/1\.cycloscope\.online\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }
}
```

### Update Strategy

```typescript
interface UpdateManager {
  // Check for updates
  checkForUpdates(): Promise<boolean>;
  
  // Prompt user to update
  promptUpdate(): void;
  
  // Apply update
  applyUpdate(): Promise<void>;
  
  // Skip this version
  skipVersion(version: string): void;
}

// Update Flow:
// 1. Service Worker detects new version
// 2. Show non-intrusive notification
// 3. User can update now or later
// 4. On update: reload app with new version
```

## Accessibility

### Mobile Accessibility Features

```typescript
interface AccessibilityFeatures {
  // Screen reader support
  ariaLabels: Map<string, string>;
  ariaDescriptions: Map<string, string>;
  
  // Keyboard navigation
  focusManagement: FocusManager;
  
  // High contrast mode
  highContrastMode: boolean;
  
  // Font scaling
  fontScale: number; // 1.0 - 2.0
  
  // Reduced motion
  reducedMotion: boolean;
}

// Respect system preferences:
// - prefers-reduced-motion
// - prefers-color-scheme
// - prefers-contrast
```

### Touch Target Sizes

```css
/* Minimum touch target size: 44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Spacing between touch targets: 8px minimum */
.touch-target + .touch-target {
  margin-top: 8px;
}
```

## Monitoring and Analytics

### PWA Analytics

```typescript
interface PWAAnalytics {
  // Installation metrics
  trackInstallPrompt(): void;
  trackInstallAccepted(): void;
  trackInstallDismissed(): void;
  
  // Usage metrics
  trackOfflineUsage(): void;
  trackSyncEvents(): void;
  trackCacheHitRate(): void;
  
  // Performance metrics
  trackLoadTime(): void;
  trackInteractionTime(): void;
  
  // Error tracking
  trackError(error: Error): void;
}
```

## Migration Plan

### Phase 1: PWA Infrastructure (Week 1)
- Install and configure vite-plugin-pwa
- Create manifest.json
- Implement basic service worker
- Add app icons

### Phase 2: Offline Support (Week 2)
- Implement IndexedDB storage
- Create sync queue
- Add offline indicators
- Test offline functionality

### Phase 3: Mobile UI (Week 3-4)
- Implement bottom navigation
- Create mobile card components
- Add gesture support
- Optimize forms for mobile

### Phase 4: Performance (Week 5)
- Implement code splitting
- Add image optimization
- Implement virtual scrolling
- Optimize bundle size

### Phase 5: Testing & Polish (Week 6)
- Comprehensive testing
- Performance optimization
- Bug fixes
- Documentation

## Conclusion

Этот дизайн обеспечивает полную трансформацию приложения в мобильную PWA с сохранением всей функциональности и добавлением новых возможностей, специфичных для мобильных устройств. Архитектура построена на принципах progressive enhancement и offline-first, что гарантирует отличный пользовательский опыт независимо от условий использования.
