#!/bin/bash

echo "🔧 Исправление лимита file watchers..."
echo ""
echo "Текущее значение:"
cat /proc/sys/fs/inotify/max_user_watches
echo ""

echo "Увеличиваем лимит до 524288..."
echo ""

# Временное решение (до перезагрузки)
sudo sysctl fs.inotify.max_user_watches=524288

# Постоянное решение (сохраняется после перезагрузки)
echo "Сохраняем настройку в /etc/sysctl.conf..."
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Применяем изменения
sudo sysctl -p

echo ""
echo "✅ Готово! Новое значение:"
cat /proc/sys/fs/inotify/max_user_watches
echo ""
echo "Теперь можете запустить: npm run dev"
