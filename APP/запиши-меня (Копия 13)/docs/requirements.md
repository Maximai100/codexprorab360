# Requirements Document

## Introduction

Данная спецификация описывает унификацию поведения скроллинга, свайпов и навигации в Telegram Mini App "Запиши меня". Текущая реализация имеет проблемы с несогласованным поведением скролла в разных окнах, конфликтами жестов, проблемами с клавиатурой и нестабильной работой на iOS. Цель — создать единообразное, предсказуемое и плавное поведение всех интерактивных элементов согласно лучшим практикам Telegram WebApp API.

## Glossary

- **Application**: Telegram Mini App "Запиши меня"
- **WebApp API**: Telegram WebApp JavaScript API для интеграции с Telegram клиентом
- **Viewport**: Видимая область приложения в Telegram клиенте
- **Bottom Sheet**: Модальное окно, выезжающее снизу экрана
- **Swipe-to-close**: Жест закрытия модального окна свайпом вниз
- **Overscroll**: Эффект "резинки" при прокрутке за пределы контента
- **Safe Area**: Безопасная область экрана, учитывающая системные элементы (notch, home indicator)
- **BackButton**: Кнопка "Назад" в интерфейсе Telegram
- **MainButton**: Главная кнопка действия в нижней части Telegram интерфейса
- **Touch Action**: CSS свойство, определяющее поведение touch-событий
- **Passive Listener**: Event listener, который не может вызвать preventDefault()

## Requirements

### Requirement 1

**User Story:** Как пользователь приложения, я хочу, чтобы скролл работал одинаково во всех окнах приложения, чтобы получить предсказуемый и комфортный опыт использования.

#### Acceptance Criteria

1. WHEN пользователь открывает любой экран приложения, THE Application SHALL использовать единую архитектуру высоты с CSS-переменной --vh, основанной на viewportStableHeight из WebApp API
2. THE Application SHALL устанавливать overflow: hidden для элементов html и body для предотвращения глобального скролла
3. THE Application SHALL использовать контейнер #app с фиксированной высотой var(--vh) и display: flex для управления layout
4. WHEN контент экрана превышает видимую область, THE Application SHALL предоставлять скролл через контейнер с классом .view и свойством overflow: auto
5. THE Application SHALL применять -webkit-overflow-scrolling: touch для плавного скролла на iOS устройствах

### Requirement 2

**User Story:** Как пользователь на iOS устройстве, я хочу, чтобы приложение корректно работало без "резинки" и залипаний, чтобы интерфейс был отзывчивым и стабильным.

#### Acceptance Criteria

1. THE Application SHALL применять overscroll-behavior: none к элементам html и body для предотвращения эффекта "резинки"
2. THE Application SHALL применять overscroll-behavior: contain к скроллируемым контейнерам для изоляции скролла
3. THE Application SHALL применять touch-action: manipulation к элементам html и body для предотвращения двойного тапа и зума
4. THE Application SHALL избегать использования position: fixed для больших панелей, используя вместо этого flex layout
5. THE Application SHALL использовать только var(--vh) вместо 100vh или 100dvh для всех вертикальных размеров

### Requirement 3

**User Story:** Как пользователь, я хочу, чтобы при открытии клавиатуры контент не прыгал и поля ввода оставались видимыми, чтобы комфортно вводить данные.

#### Acceptance Criteria

1. WHEN Telegram изменяет viewportStableHeight, THE Application SHALL обновлять CSS-переменную --vh через обработчик события viewportChanged
2. THE Application SHALL НЕ использовать window.innerHeight для расчета высоты viewport, если доступен viewportStableHeight из WebApp API; допускается fallback на window.innerHeight при отсутствии WebApp API
3. WHEN поле ввода получает фокус, THE Application SHALL вызывать scrollIntoView с параметрами { block: 'center', behavior: 'smooth' }
4. THE Application SHALL применять padding-bottom: env(safe-area-inset-bottom) к контейнеру #app для учета safe area
5. THE Application SHALL сохранять стабильную высоту контейнеров при появлении клавиатуры

### Requirement 4

**User Story:** Как пользователь, я хочу, чтобы жесты работали корректно без конфликтов с системными жестами, чтобы навигация была интуитивной.

#### Acceptance Criteria

1. THE Application SHALL удалить все глобальные touchmove слушатели с preventDefault
2. THE Application SHALL использовать пассивные слушатели ({ passive: true }) по умолчанию для всех touch-событий
3. WHERE требуется блокировка вертикального скролла (например, в карусели), THE Application SHALL использовать { passive: false } с явным preventDefault() только локально
4. THE Application SHALL применять touch-action: pan-y к горизонтальным спискам для предотвращения конфликта с iOS свайп-назад
5. THE Application SHALL НЕ перехватывать touch-события на краях экрана, где работают системные жесты

### Requirement 5

**User Story:** Как пользователь, я хочу использовать кнопку "Назад" для навигации и закрытия модальных окон, чтобы управление было естественным для Telegram.

#### Acceptance Criteria

1. THE Application SHALL управлять навигацией только через WebApp.BackButton API
2. WHEN пользователь открывает экран с возможностью возврата, THE Application SHALL вызывать WebApp.BackButton.show()
3. WHEN пользователь нажимает BackButton, THE Application SHALL выполнять соответствующее действие (закрыть модалку или вернуться назад)
4. THE Application SHALL вызывать WebApp.enableClosingConfirmation() для предотвращения случайного закрытия приложения
5. WHEN пользователь покидает экран, THE Application SHALL удалять обработчики BackButton через offEvent

### Requirement 6

**User Story:** Как пользователь, я хочу, чтобы модальные окна (Bottom Sheets) открывались плавно, закрывались свайпом вниз и не прокручивали фон, чтобы взаимодействие было комфортным.

#### Acceptance Criteria

1. WHEN модальное окно открывается, THE Application SHALL добавлять класс .body-no-scroll к элементу body для блокировки фонового скролла
2. WHEN модальное окно закрывается, THE Application SHALL удалять класс .body-no-scroll из элемента body
3. THE Application SHALL реализовать swipe-to-close через transform: translateY() и применять will-change: transform ТОЛЬКО во время активного драга через JavaScript, удаляя его сразу после завершения анимации
4. THE Application SHALL предоставлять отдельный скроллируемый контейнер .scroll-area внутри модального окна
5. WHEN пользователь свайпает модальное окно вниз более чем на min(120px, 0.25 * sheetHeight) ИЛИ с velocity более 0.5px/ms, THE Application SHALL закрывать модальное окно

### Requirement 7

**User Story:** Как пользователь, я хочу, чтобы горизонтальные списки прокручивались без конфликта с системным жестом "назад", чтобы использовать все функции приложения.

#### Acceptance Criteria

1. THE Application SHALL применять touch-action: pan-y к горизонтально прокручиваемым элементам
2. THE Application SHALL использовать overflow-x: auto для горизонтального скролла
3. THE Application SHALL применять -webkit-overflow-scrolling: touch к горизонтальным спискам для плавности на iOS
4. THE Application SHALL НЕ блокировать вертикальный скролл в горизонтальных списках
5. THE Application SHALL изолировать горизонтальный скролл через overscroll-behavior-x: contain

### Requirement 8

**User Story:** Как разработчик, я хочу иметь тестовый компонент для проверки скролла, чтобы убедиться в корректности реализации на разных устройствах.

#### Acceptance Criteria

1. THE Application SHALL предоставлять ScrollTester компонент с длинным списком элементов (минимум 100 элементов)
2. THE ScrollTester SHALL использовать ту же архитектуру скролла, что и основное приложение
3. THE ScrollTester SHALL отображать текущую позицию скролла для отладки
4. THE ScrollTester SHALL быть доступен через специальный режим или настройку разработчика
5. THE ScrollTester SHALL тестировать поведение на границах скролла (начало, конец, overscroll)

### Requirement 9

**User Story:** Как пользователь, я хочу, чтобы приложение корректно инициализировало высоту viewport при загрузке, чтобы избежать мерцания и скачков интерфейса.

#### Acceptance Criteria

1. THE Application SHALL вызывать функцию setVH() синхронно при загрузке скрипта, до рендеринга React компонентов
2. THE Application SHALL подписываться на событие viewportChanged через WebApp.onEvent для обновления --vh
3. THE Application SHALL подписываться на событие resize окна как fallback для обновления --vh
4. WHEN WebApp.viewportStableHeight недоступен, THE Application SHALL использовать window.innerHeight как fallback
5. THE Application SHALL устанавливать CSS-переменную --vh через document.documentElement.style.setProperty

### Requirement 10

**User Story:** Как пользователь, я хочу, чтобы все интерактивные элементы (кнопки, поля ввода) реагировали на касания без задержек, чтобы интерфейс был отзывчивым.

#### Acceptance Criteria

1. THE Application SHALL применять touch-action: manipulation к интерактивным элементам для устранения 300ms задержки
2. THE Application SHALL использовать pointer events вместо touch events где возможно для унификации обработки
3. THE Application SHALL применять cursor: pointer к кликабельным элементам для визуальной обратной связи
4. THE Application SHALL НЕ использовать hover эффекты, которые могут вызвать залипание на touch устройствах
5. THE Application SHALL применять active состояния через :active псевдокласс для визуальной обратной связи при касании

### Requirement 11

**User Story:** Как разработчик, я хочу иметь автоматические проверки качества кода, чтобы предотвратить регрессии в поведении скролла и жестов.

#### Acceptance Criteria

1. THE Application SHALL использовать stylelint правило для запрета использования 100vh и 100dvh в CSS
2. THE Application SHALL использовать eslint правило для запрета addEventListener с passive: false вне whitelisted компонентов
3. THE Application SHALL документировать все исключения для passive: false с обоснованием
4. THE Application SHALL проверять отсутствие глобальных preventDefault на touchmove события
5. THE Application SHALL автоматически проверять наличие overflow: hidden на body при сборке

### Requirement 12

**User Story:** Как пользователь с устройством с notch, я хочу, чтобы контент не перекрывался системными элементами, чтобы весь интерфейс был доступен.

#### Acceptance Criteria

1. THE Application SHALL применять padding-top: env(safe-area-inset-top) к экранам с фиксированными заголовками
2. THE Application SHALL применять padding-bottom: env(safe-area-inset-bottom) к контейнеру #app
3. THE Application SHALL применять padding-left: env(safe-area-inset-left) где необходимо
4. THE Application SHALL применять padding-right: env(safe-area-inset-right) где необходимо
5. THE Application SHALL тестировать отображение на устройствах с различными safe areas

### Requirement 13

**User Story:** Как пользователь, я хочу, чтобы позиция скролла сохранялась при навигации назад, чтобы не терять контекст просмотра.

#### Acceptance Criteria

1. WHEN пользователь переходит на другой экран, THE Application SHALL сохранять scrollTop текущего .view контейнера
2. WHEN пользователь возвращается назад, THE Application SHALL восстанавливать сохраненный scrollTop
3. THE Application SHALL использовать sessionStorage для хранения позиций скролла
4. THE Application SHALL очищать сохраненные позиции при закрытии приложения
5. THE Application SHALL восстанавливать скролл после полного рендеринга контента

### Requirement 14

**User Story:** Как пользователь с ограниченными возможностями, я хочу, чтобы модальные окна были доступны с клавиатуры и screen readers, чтобы комфортно использовать приложение.

#### Acceptance Criteria

1. WHEN модальное окно открывается, THE Application SHALL устанавливать фокус на первый интерактивный элемент внутри модалки
2. THE Application SHALL реализовать focus trap внутри модального окна
3. THE Application SHALL применять aria-modal="true" к модальным окнам
4. WHEN модальное окно закрывается, THE Application SHALL возвращать фокус на элемент-инициатор
5. THE Application SHALL поддерживать закрытие модалки клавишей Escape

### Requirement 15

**User Story:** Как разработчик, я хочу иметь централизованное управление скроллом, чтобы легко контролировать поведение всех скроллируемых областей.

#### Acceptance Criteria

1. THE Application SHALL предоставлять ScrollManager для отслеживания активного скролл-контейнера
2. THE ScrollManager SHALL предоставлять методы scrollToTop() и scrollToBottom()
3. THE ScrollManager SHALL предоставлять свойства isAtTop и isAtBottom
4. THE ScrollManager SHALL блокировать фоновый скролл при открытых оверлеях с подсчетом стека
5. THE ScrollManager SHALL уведомлять об изменениях состояния скролла через события

### Requirement 16

**User Story:** Как разработчик, я хочу иметь моки Telegram WebApp API для тестирования, чтобы писать надежные unit и integration тесты.

#### Acceptance Criteria

1. THE Application SHALL предоставлять mock объект для window.Telegram.WebApp
2. THE mock SHALL эмулировать viewportChanged события
3. THE mock SHALL эмулировать BackButton.show(), hide(), onClick()
4. THE mock SHALL эмулировать expand() и другие методы WebApp API
5. THE mock SHALL использоваться во всех unit и integration тестах

### Requirement 17

**User Story:** Как пользователь на Android, я хочу, чтобы системный pull-to-refresh не конфликтовал с прокруткой приложения, чтобы избежать случайных обновлений.

#### Acceptance Criteria

1. THE Application SHALL применять overscroll-behavior: none к корневому элементу
2. THE Application SHALL определять политику history navigation (push vs replace)
3. THE Application SHALL предотвращать случайный выход из WebView при системной навигации назад
4. THE Application SHALL документировать правила использования history API
5. THE Application SHALL тестировать поведение на Android WebView различных версий

### Requirement 18

**User Story:** Как пользователь с RTL языком, я хочу, чтобы интерфейс корректно работал в режиме RTL, чтобы комфортно использовать приложение.

#### Acceptance Criteria

1. THE Application SHALL корректно отображать .view контейнеры при dir="rtl"
2. THE Application SHALL корректно работать с горизонтальными каруселями в RTL режиме
3. THE Application SHALL применять touch-action для горизонтального скролла в RTL
4. THE Application SHALL тестировать все интерактивные элементы в RTL режиме
5. THE Application SHALL использовать логические CSS свойства (margin-inline, padding-block) где возможно

### Requirement 19

**User Story:** Как пользователь, я хочу, чтобы приложение корректно реагировало на смену темы Telegram, чтобы интерфейс оставался читаемым.

#### Acceptance Criteria

1. THE Application SHALL подписываться на событие themeChanged из WebApp API
2. THE Application SHALL использовать CSS переменные --tg-theme-* для всех цветов
3. THE Application SHALL НЕ использовать жестко заданные светлые цвета или тени
4. THE Application SHALL тестировать контрастность в светлой и темной темах
5. THE Application SHALL обновлять UI без перезагрузки при смене темы

### Requirement 20

**User Story:** Как разработчик, я хочу собирать телеметрию UX проблем, чтобы выявлять и исправлять проблемы с прокруткой и жестами.

#### Acceptance Criteria

1. THE Application SHALL логировать события "двойной скролл" с контекстом контейнера
2. THE Application SHALL логировать события "фон прокрутился при модалке"
3. THE Application SHALL логировать события "свайп-закрытие отменено" с причиной
4. THE Application SHALL включать информацию о платформе (iOS/Android) в логи
5. THE Application SHALL отправлять телеметрию в систему мониторинга

### Requirement 21

**User Story:** Как разработчик, я хочу использовать современные pointer events вместо legacy touch events, чтобы получить лучшую поддержку pointer capture и унифицированную обработку событий.

#### Acceptance Criteria

1. THE Application SHALL использовать pointer events (pointerdown, pointermove, pointerup, pointercancel) вместо touch events для всех свайп-обработчиков
2. THE Application SHALL использовать setPointerCapture() для надежного отслеживания жестов
3. THE Application SHALL использовать releasePointerCapture() после завершения жеста
4. THE Application SHALL обрабатывать pointercancel событие для корректной очистки состояния
5. THE Application SHALL НЕ использовать legacy touch events (touchstart, touchmove, touchend) в новом коде без явного обоснования
