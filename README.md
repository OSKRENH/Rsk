# РСК · Бренд-центр

Современный лендинг и бренд-портал на основе визуального языка https://rsk-development.ru.

Разделы: логотип, цифровая палитра, интерактивный образец Golos Text, шесть проектов с фильтрами и просмотром рендеров, комплекты файлов.

## Проверка и публикация

- `npm run check`: проверка JavaScript, файлов и ссылок внутри страницы.
- Каталог публикации: `dist`. Сборка без зависимостей.
- Cloudflare Workers: `npm run deploy` после подключения аккаунта. Конфигурация `wrangler.jsonc`, имя Worker `rsk-brand`.
- Cloudflare Workers Builds: подключите `OSKRENH/Rsk`, ветка `main`, build command `npm run build`, deploy command `npx wrangler@4 deploy`. Корень проекта `/`.
- Cloudflare Pages: build command `npm run build`, output directory `dist`.

## Источники

- Логотип, веб-шрифты, цвета и превью проектов: официальный сайт РСК, 10.10.2026. Точные источники в `dist/sources.json`.
- Дополнительные рендеры: https://disk.yandex.ru/d/Vznzzq6ocT7DKA, доступность шести папок проверена.
- TTF Golos Text и лицензия OFL: https://github.com/google/fonts/tree/main/ofl/golostext.

Белая версия получена заменой цветов в исходном SVG. Компактная версия использует ту же геометрию без дескриптора. Утверждённые печатные правила, CMYK/Pantone и закрытые шаблоны не предоставлены; цифровая палитра не выдаётся за печатный брендбук.
