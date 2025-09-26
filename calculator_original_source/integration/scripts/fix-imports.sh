#!/bin/bash
# Скрипт исправления импортов для интеграции

echo "🔧 Исправление импортов для интеграции..."

# Создать резервную копию
echo "📦 Создание резервной копии..."
cp -r src src_backup_$(date +%Y%m%d_%H%M%S)

# Исправить импорты типов
echo "🔍 Исправление импортов типов..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./types'|from '../../types/calculator'|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./types'|from '../../../types/calculator'|g"

# Исправить импорты хуков
echo "🔍 Исправление импортов хуков..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./hooks/|from '../../hooks/calculator/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./hooks/|from '../../../hooks/calculator/|g"

# Исправить импорты утилит
echo "🔍 Исправление импортов утилит..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./utils/|from '../../utils/calculator/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./utils/|from '../../../utils/calculator/|g"

# Исправить импорты в common компонентах
echo "🔍 Исправление импортов в common компонентах..."
find src/components/common -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./hooks/calculator/|from '../../../hooks/calculator/|g"
find src/components/common -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./utils/calculator/|from '../../../utils/calculator/|g"
find src/components/common -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./types/calculator/|from '../../../types/calculator/|g"

# Исправить импорты в modals
echo "🔍 Исправление импортов в modals..."
find src/components/modals -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./utils/calculator/|from '../../../utils/calculator/|g"
find src/components/modals -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./hooks/calculator/|from '../../../hooks/calculator/|g"
find src/components/modals -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./types/calculator/|from '../../../types/calculator/|g"

# Исправить импорты в calculators
echo "🔍 Исправление импортов в calculators..."
find src/components/calculators -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./hooks/calculator/|from '../../../hooks/calculator/|g"
find src/components/calculators -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./utils/calculator/|from '../../../utils/calculator/|g"
find src/components/calculators -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./types/calculator/|from '../../../types/calculator/|g"

# Исправить импорты стилей
echo "🔍 Исправление импортов стилей..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./styles/|from '../../styles/calculator/|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '\.\./\.\./styles/|from '../../../styles/calculator/|g"

# Проверить результат
echo "✅ Проверка исправленных импортов..."
echo "Найдено импортов с '../':"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "from '\.\./" | wc -l

echo "Найдено импортов с '../../':"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "from '\.\./\.\./" | wc -l

echo "🎉 Исправление импортов завершено!"
echo "📝 Резервная копия создана в src_backup_*"
echo "🔍 Проверьте результат и при необходимости откатите изменения"
