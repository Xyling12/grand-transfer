---
name: UI/UX Pro Max
description: Элитный набор инструментов для проектирования UI/UX с базой данных стилей, палитр, шрифтов и принципов дизайна.
---

# UI/UX Pro Max

Этот навык предоставляет доступ к базе знаний по дизайну и адаптации UI под различные стеки.

## Как использовать

Используйте скрипт поиска для получения рекомендаций по дизайну, цветовых палитр, шрифтов и UX-принципов.

### 1. Генерация Дизайн-Системы (РЕКОМЕНДУЕТСЯ)

Всегда начинайте с этого шага, чтобы получить комплексные рекомендации по проекту:

```bash
python C:/Users/ivshinms/.gemini/antigravity/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "тип_продукта индустрия ключевые_слова" --design-system
```

**Пример для Grand Transfer:**
```bash
python C:/Users/ivshinms/.gemini/antigravity/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "taxi transfer premium service dark mode" --design-system
```

### 2. Поиск по конкретным областям

Если нужны дополнительные детали, используйте поиск по доменам:

```bash
python C:/Users/ivshinms/.gemini/antigravity/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "<запрос>" --domain <domain>
```

**Доступные домены:**
- `product` - Рекомендации по типу продукта (SaaS, e-commerce, и т.д.)
- `style` - Стили UI (glassmorphism, minimalism) + CSS ключевые слова.
- `typography` - Пары шрифтов с импортами Google Fonts.
- `color` - Цветовые палитры.
- `landing` - Структура посадочных страниц и CTA.
- `chart` - Типы графиков и библиотек.
- `ux` - Лучшие практики и анти-паттерны (анимации, доступность).

### 3. Рекомендации по Стеку

```bash
python C:/Users/ivshinms/.gemini/antigravity/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "<запрос>" --stack nextjs
```

Доступные стеки: `html-tailwind`, `react`, `nextjs`, `vue`, `shadcn`, и др.

---

## Чек-лист перед сдачей UI

- [ ] Никаких эмодзи в качестве иконок (только SVG: Lucide/Heroicons).
- [ ] Визуальный отклик (hover) на всех интерактивных элементах.
- [ ] `cursor-pointer` на всех карточках и кнопках.
- [ ] Плавные переходы (transitions) 150-300ms.
- [ ] Проверка контрастности текста в светлой и темной темах.
- [ ] Отсутствие горизонтального скролла на мобильных устройствах.
