#!/bin/bash
# Скрипт проверки сборки калькулятора

echo "🔍 Проверка сборки калькулятора..."

# Проверить наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules не найден. Устанавливаем зависимости..."
    npm install
fi

# Проверить TypeScript
echo "🔍 Проверка TypeScript..."
if npx tsc --noEmit; then
    echo "✅ TypeScript проверка пройдена"
else
    echo "❌ Ошибки TypeScript найдены"
    exit 1
fi

# Проверить сборку
echo "🔍 Проверка сборки..."
if npm run build; then
    echo "✅ Сборка успешна"
else
    echo "❌ Ошибки сборки"
    exit 1
fi

# Проверить размер bundle
echo "📊 Размер bundle:"
if [ -d "dist" ]; then
    echo "Размер dist/:"
    du -sh dist/
    echo ""
    echo "Размеры файлов:"
    du -h dist/*
else
    echo "❌ Папка dist не найдена"
    exit 1
fi

# Проверить зависимости
echo "📦 Проверка зависимостей..."
echo "xlsx:"
npm list xlsx 2>/dev/null || echo "❌ xlsx не установлен"
echo "jspdf:"
npm list jspdf 2>/dev/null || echo "❌ jspdf не установлен"
echo "jspdf-autotable:"
npm list jspdf-autotable 2>/dev/null || echo "❌ jspdf-autotable не установлен"

# Проверить типы
echo "📝 Проверка типов..."
if npm list @types/xlsx 2>/dev/null; then
    echo "✅ @types/xlsx установлен"
else
    echo "❌ @types/xlsx не установлен"
fi

echo "🎉 Проверка сборки завершена!"
