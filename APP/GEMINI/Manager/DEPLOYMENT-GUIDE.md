# 🚀 Руководство по деплою мобильной PWA

## Подготовка к деплою

### 1. Проверка перед деплоем

```bash
# Установите зависимости
npm install

# Соберите проект
npm run build

# Проверьте локально
npm run preview
```

### 2. Проверьте что работает:
- ✅ Приложение собирается без ошибок
- ✅ PWA manifest.json генерируется
- ✅ Service Worker создаётся
- ✅ Все чанки загружаются

---

## Деплой на Vercel

### Быстрый деплой

```bash
# Установите Vercel CLI (если ещё не установлен)
npm i -g vercel

# Деплой
vercel
```

### Настройка Vercel

1. **Создайте `vercel.json` (уже есть):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

2. **Environment Variables:**
   - `GEMINI_API_KEY` - ваш API ключ

3. **Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### После деплоя

1. **Проверьте PWA:**
   - Откройте на мобильном
   - Проверьте установку
   - Проверьте офлайн-режим

2. **Проверьте HTTPS:**
   - PWA требует HTTPS
   - Vercel автоматически предоставляет HTTPS

---

## Деплой на Netlify

### Быстрый деплой

```bash
# Установите Netlify CLI
npm i -g netlify-cli

# Деплой
netlify deploy --prod
```

### Настройка Netlify

1. **Создайте `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Environment Variables:**
   - `GEMINI_API_KEY` - ваш API ключ

---

## Деплой на собственный сервер

### Nginx конфигурация

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/your-app/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
        access_log off;
    }

    # Manifest
    location /manifest.webmanifest {
        add_header Cache-Control "no-cache";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (если нужен)
    location /api/ {
        proxy_pass https://1.cycloscope.online/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Деплой на сервер

```bash
# Соберите проект
npm run build

# Скопируйте на сервер
scp -r dist/* user@your-server:/var/www/your-app/dist/

# Перезапустите Nginx
ssh user@your-server 'sudo systemctl reload nginx'
```

---

## Проверка после деплоя

### 1. PWA Checklist

```bash
# Откройте DevTools → Application
```

- ✅ Manifest загружается
- ✅ Service Worker регистрируется
- ✅ Cache Storage работает
- ✅ IndexedDB создаётся
- ✅ Кнопка "Install" появляется

### 2. Lighthouse Audit

```bash
# В Chrome DevTools → Lighthouse
```

Проверьте:
- **Performance:** > 90
- **PWA:** 100
- **Accessibility:** > 90
- **Best Practices:** > 90

### 3. Тестирование на устройствах

**iOS:**
1. Откройте в Safari
2. Нажмите "Поделиться"
3. Выберите "На экран Домой"
4. Проверьте установку

**Android:**
1. Откройте в Chrome
2. Нажмите меню (⋮)
3. Выберите "Установить приложение"
4. Проверьте установку

### 4. Офлайн тест

1. Откройте приложение
2. DevTools → Network → Offline
3. Обновите страницу
4. Проверьте что всё работает

---

## Мониторинг

### Логи Service Worker

```javascript
// В консоли браузера
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Проверка кэша

```javascript
// В консоли браузера
caches.keys().then(keys => {
  console.log('Cache keys:', keys);
  keys.forEach(key => {
    caches.open(key).then(cache => {
      cache.keys().then(requests => {
        console.log(`${key}:`, requests.length, 'items');
      });
    });
  });
});
```

### Проверка IndexedDB

```javascript
// В консоли браузера
indexedDB.databases().then(dbs => {
  console.log('Databases:', dbs);
});
```

---

## Обновление приложения

### Автоматическое обновление

Service Worker автоматически проверяет обновления.

### Принудительное обновление

```javascript
// В консоли браузера
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.update();
  });
});
```

### Очистка кэша

```javascript
// В консоли браузера
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

---

## Troubleshooting

### Проблема: PWA не устанавливается

**Решение:**
1. Проверьте HTTPS (обязательно!)
2. Проверьте manifest.json
3. Проверьте Service Worker
4. Проверьте иконки (все размеры)

### Проблема: Офлайн не работает

**Решение:**
1. Проверьте Service Worker в DevTools
2. Проверьте Cache Storage
3. Проверьте Network вкладку
4. Проверьте консоль на ошибки

### Проблема: Старая версия не обновляется

**Решение:**
1. Очистите кэш браузера
2. Удалите Service Worker
3. Переустановите PWA
4. Проверьте версию в manifest.json

### Проблема: Жесты не работают

**Решение:**
1. Проверьте touch-action CSS
2. Проверьте @use-gesture/react установлен
3. Проверьте консоль на ошибки
4. Проверьте на реальном устройстве

---

## Оптимизация для production

### 1. Минимизация бандла

```bash
# Анализ бандла
npm run build -- --mode production

# Проверьте размеры в dist/assets/
```

### 2. Оптимизация изображений

```bash
# Используйте WebP формат
# Сжимайте изображения перед загрузкой
# Используйте lazy loading
```

### 3. Кэширование

```javascript
// В vite.config.ts уже настроено:
// - App Shell: Cache-First
// - API: Network-First
// - Images: Cache-First
```

### 4. Мониторинг производительности

```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## Безопасность

### 1. Content Security Policy

Уже настроено в `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="...">
```

### 2. HTTPS

**Обязательно** для PWA!

### 3. Environment Variables

Не коммитьте `.env` файлы!

```bash
# .gitignore
.env
.env.local
.env.production
```

---

## Checklist перед production

- [ ] Все тесты проходят
- [ ] Lighthouse audit > 90
- [ ] PWA устанавливается
- [ ] Офлайн работает
- [ ] Жесты работают
- [ ] HTTPS настроен
- [ ] Environment variables настроены
- [ ] Мониторинг настроен
- [ ] Backup настроен
- [ ] Документация обновлена

---

## Полезные ссылки

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Web Vitals](https://web.dev/vitals/)

---

## Поддержка

При возникновении проблем:
1. Проверьте консоль браузера
2. Проверьте DevTools → Application
3. Проверьте Network вкладку
4. Проверьте документацию

---

**Готово к деплою!** 🚀

Следуйте этому руководству для успешного деплоя вашей мобильной PWA.
