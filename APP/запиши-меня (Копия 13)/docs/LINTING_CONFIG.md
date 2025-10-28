# Linting Configuration

Конфигурационные файлы для автоматической проверки качества кода.

## Stylelint - Ban 100vh/100dvh and Enforce Input Font Size

Создайте или обновите `.stylelintrc.json`:

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/^(height|min-height|max-height)$/": ["/\\b100d?vh\\b/"]
    },
    "selector-max-specificity": null,
    "plugin/no-low-performance-animation-properties": true
  },
  "plugins": [
    "stylelint-declaration-block-no-ignored-properties",
    "./stylelint-custom-rules.js"
  ],
  "messages": {
    "declaration-property-value-disallowed-list": "Use var(--vh) instead of 100vh/100dvh for viewport height. See scroll-swipe-unification spec."
  }
}
```

### Custom Rule: Minimum Font Size for Form Elements

Добавьте custom stylelint plugin или используйте postcss-plugin:

```javascript
// stylelint-custom-rules.js
module.exports = {
  ruleName: 'custom/input-min-font-size',
  rule: function(enabled) {
    return function(root, result) {
      root.walkRules(/input|textarea|select/, rule => {
        rule.walkDecls('font-size', decl => {
          const value = parseFloat(decl.value);
          if (value < 16) {
            // NOTE: result.warn() не падает сборку
            // Для BLOCKING проверки используйте grep-чек в CI (см. ниже)
            result.warn(
              'Form elements must have font-size >= 16px to prevent iOS auto-zoom',
              { node: decl }
            );
          }
        });
      });
    };
  }
};
```

**Важно**: `result.warn()` не падает сборку. Для BLOCKING проверки используется grep-чек в CI (см. раздел "CI/CD Checks" ниже), который явно падает с `exit 1`.

## ESLint - Touch Event Policy

Добавьте в `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^touch/]",
        message: 'Touch listeners must use { passive: true } by default. Use { passive: false } only in whitelisted components (BottomSheet, Carousel) with eslint-disable-next-line and justification comment.'
      }
    ]
  }
};
```

### Правильное использование исключений

```typescript
// ❌ WRONG - будет ошибка eslint
element.addEventListener('touchmove', handler, { passive: false });

// ✅ CORRECT - с обоснованием
// eslint-disable-next-line no-restricted-syntax
// Passive: false required for swipe-to-close gesture to prevent scroll during drag
element.addEventListener('touchmove', handler, { passive: false });
```

## CI/CD Checks

Создайте `scripts/check-scroll-hygiene.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Checking scroll hygiene..."

# Check for 100vh/100dvh
echo "Checking for 100vh/100dvh usage..."
if grep -r "100vh\|100dvh" src/ --include="*.css" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"; then
  echo "❌ FAIL: Found 100vh/100dvh usage. Use var(--vh) instead."
  echo "See: SCROLL_ARCHITECTURE.md and requirements.md (Req 2, AC5)"
  exit 1
fi
echo "✅ No 100vh/100dvh found"

# Check body overflow
echo "Checking body overflow..."
if grep -r "body.*overflow.*\(auto\|scroll\)" src/ --include="*.css"; then
  echo "❌ FAIL: body should only have overflow: hidden"
  echo "See: SCROLL_ARCHITECTURE.md and design.md (Global CSS Rules)"
  exit 1
fi
echo "✅ body overflow correct"

# Check for will-change in static CSS
echo "Checking for will-change in static CSS..."
if grep -r "will-change" src/ --include="*.css"; then
  echo "❌ FAIL: will-change should only be applied via JS during animations"
  echo "See: GPU_ACCELERATION_GUIDE.md and design.md (Performance Considerations)"
  exit 1
fi
echo "✅ No will-change in static CSS"

# Check for input font-size < 16px (iOS auto-zoom prevention)
echo "Checking input font-size..."
if grep -rE "input.*font-size.*:(.*[0-9]|1[0-5])px" src/ --include="*.css"; then
  echo "❌ FAIL: Form elements must have font-size >= 16px to prevent iOS auto-zoom"
  echo "See: design.md (Global CSS Rules) and tasks.md (Task 2.1a)"
  exit 1
fi
echo "✅ Input font-size >= 16px"

# Check for .view containers
echo "Checking .view container usage..."
VIEW_COUNT=$(grep -r "className.*view" src/ --include="*.tsx" --include="*.jsx" | wc -l)
SCREEN_COUNT=$(grep -r "const.*Screen\|function.*Screen" src/ --include="*.tsx" --include="*.jsx" | wc -l)
if [ "$VIEW_COUNT" -lt "$SCREEN_COUNT" ]; then
  echo "⚠️  WARNING: Found $SCREEN_COUNT screens but only $VIEW_COUNT .view containers"
  echo "Each screen should have exactly one .view container"
fi

echo ""
echo "✅ All scroll hygiene checks passed!"
```

Сделайте скрипт исполняемым:
```bash
chmod +x scripts/check-scroll-hygiene.sh
```

## Package.json Scripts

Добавьте в `package.json`:

```json
{
  "scripts": {
    "lint": "eslint src/ && stylelint 'src/**/*.css'",
    "lint:fix": "eslint src/ --fix && stylelint 'src/**/*.css' --fix",
    "check:scroll": "bash scripts/check-scroll-hygiene.sh",
    "precommit": "npm run lint && npm run check:scroll",
    "ci": "npm run lint && npm run check:scroll && npm test"
  }
}
```

## GitHub Actions / CI Configuration

Пример для GitHub Actions (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run check:scroll
      - run: npm test
```

## Pre-commit Hook

Установите husky для автоматической проверки перед коммитом:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run precommit"
```

## Whitelist для исключений

Создайте `.eslintrc-whitelist.js` для компонентов, которым разрешено использовать `passive: false`:

```javascript
// Компоненты, которым разрешено использовать { passive: false }
// Каждое использование должно быть документировано
const WHITELISTED_COMPONENTS = [
  'src/components/BottomSheet.tsx',
  'src/components/Carousel.tsx',
  // Добавляйте сюда только при необходимости с обоснованием
];

module.exports = {
  overrides: [
    {
      files: WHITELISTED_COMPONENTS,
      rules: {
        'no-restricted-syntax': 'off'
      }
    }
  ]
};
```

## Проверка в IDE

### VSCode Settings

Добавьте в `.vscode/settings.json`:

```json
{
  "css.lint.unknownProperties": "warning",
  "stylelint.enable": true,
  "eslint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  }
}
```

### VSCode Extensions

Рекомендуемые расширения (`.vscode/extensions.json`):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "stylelint.vscode-stylelint"
  ]
}
```

## Troubleshooting

### Ложные срабатывания

Если grep находит 100vh в комментариях или строках:

```bash
# Более точная проверка (только в коде)
grep -r ":\s*100[dv]h" src/ --include="*.css" --include="*.tsx"
```

### Игнорирование файлов

Создайте `.stylelintignore` и `.eslintignore`:

```
node_modules/
dist/
build/
*.min.css
*.min.js
```

## Мониторинг

После внедрения отслеживайте метрики:
- Количество нарушений в неделю
- Время на исправление нарушений
- Количество false positives

Цель: **0 нарушений** в production коде.
