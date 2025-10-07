# 🔧 Настройка CORS в Directus 11.10.0 (русский интерфейс)

## Вариант 1: Через файл .env на сервере (рекомендуется)

Если у вас есть доступ к серверу Directus, это самый надежный способ.

### Шаги:

1. **Подключитесь к серверу** где установлен Directus (SSH)

2. **Найдите файл .env** в корне проекта Directus:
   ```bash
   cd /path/to/directus
   nano .env
   ```

3. **Добавьте или обновите настройки CORS:**
   ```env
   # CORS настройки
   CORS_ENABLED=true
   CORS_ORIGIN=http://localhost:3000,https://dashboardmorent.vercel.app
   CORS_METHODS=GET,POST,PATCH,DELETE,OPTIONS
   CORS_ALLOWED_HEADERS=Content-Type,Authorization
   CORS_EXPOSED_HEADERS=Content-Range
   CORS_CREDENTIALS=true
   CORS_MAX_AGE=86400
   ```

4. **Сохраните файл** (Ctrl+O, Enter, Ctrl+X в nano)

5. **Перезапустите Directus:**
   ```bash
   # Если используете Docker
   docker-compose restart
   
   # Если используете PM2
   pm2 restart directus
   
   # Если используете systemd
   sudo systemctl restart directus
   
   # Если запускаете вручную
   # Остановите процесс и запустите снова
   npm run start
   ```

---

## Вариант 2: Через интерфейс Directus

В Directus 11.10.0 настройки CORS могут быть в разных местах:

### Попробуйте найти в:

1. **Настройки** (иконка шестеренки внизу слева)
   - Ищите раздел "Project Settings" или "Настройки проекта"
   - Ищите вкладку "Security" или "Безопасность"
   - Ищите поле "CORS" или "Разрешенные источники"

2. **Политики доступа** (в меню слева)
   - Может быть настройка CORS для публичного доступа

3. **Роли пользователей** (в меню слева)
   - Проверьте права доступа для публичной роли (Public)

---

## Вариант 3: Через API Directus

Если у вас есть admin токен, можно настроить через API:

```bash
curl -X PATCH https://1.cycloscope.online/settings \
  -H "Authorization: Bearer ВАШ_ADMIN_ТОКЕН" \
  -H "Content-Type: application/json" \
  -d '{
    "project_cors_enabled": true,
    "project_cors_origin": "http://localhost:3000,https://dashboardmorent.vercel.app"
  }'
```

---

## Вариант 4: Через nginx/Apache (если используется)

Если Directus стоит за nginx или Apache, можно настроить CORS на уровне веб-сервера.

### Для nginx:

Добавьте в конфигурацию сайта:

```nginx
location / {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://dashboardmorent.vercel.app' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://dashboardmorent.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Max-Age' 86400;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    proxy_pass http://localhost:8055;  # Порт Directus
}
```

Перезапустите nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Для Apache:

Добавьте в .htaccess или конфигурацию:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://dashboardmorent.vercel.app"
    Header set Access-Control-Allow-Methods "GET, POST, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

---

## Проверка настроек CORS

После настройки проверьте, что CORS работает:

```bash
curl -I -X OPTIONS https://1.cycloscope.online/items/projects \
  -H "Origin: https://dashboardmorent.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

В ответе должны быть заголовки:
```
Access-Control-Allow-Origin: https://dashboardmorent.vercel.app
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
```

---

## Если ничего не помогает

### Временное решение (только для тестирования!):

Разрешите все источники (НЕ используйте в продакшене!):

```env
CORS_ENABLED=true
CORS_ORIGIN=*
```

Если это заработает, значит проблема именно в CORS, и нужно правильно настроить конкретные домены.

---

## Рекомендация

**Самый надежный способ** - настроить через файл `.env` на сервере Directus (Вариант 1).

Если у вас нет доступа к серверу, свяжитесь с администратором сервера и попросите добавить эти настройки.
