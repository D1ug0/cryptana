<div align="center">

# 🐋 Cryptana

### Ethereum Wallet Analytics & Whale Discovery Bot

Telegram-бот для анализа торговой истории Ethereum-кошельков,  
поиска прибыльных трейдеров и формирования подробных PDF-отчётов.

<br>

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## О проекте

**Cryptana** — Telegram-бот для исследования активности криптовалютных кошельков в сети Ethereum.

Бот объединяет данные **Defined.fi** и **Zerion**, восстанавливает покупки и продажи токенов,
рассчитывает прибыльность кошелька и помогает находить трейдеров, соответствующих заданным
критериям «кита».

Проект умеет:

- находить торговые пары и события по Ethereum-токену;
- отбирать кошельки с доходностью от `2x`;
- проверять торговую историю найденных кандидатов за 30 дней;
- рассчитывать PnL, Win Rate, комиссии и средние показатели;
- учитывать стоимость оставшихся на кошельке токенов;
- хранить токены и найденные кошельки в PostgreSQL;
- формировать многостраничные PDF-отчёты;
- показывать прогресс длительных операций в Telegram.

> Проект предназначен для аналитики и обучения. Результаты не являются инвестиционной рекомендацией.

---

## Возможности

<table>
<tr>
<td width="50%">

### 🔎 Token Discovery

Работа с Ethereum-токенами:

- ручное добавление контрактов;
- получение трендовых токенов;
- фильтрация по ликвидности и капитализации;
- поиск всех торговых пар;
- хранение списка токенов в PostgreSQL.

</td>
<td width="50%">

### 🐋 Whale Discovery

Поиск потенциально успешных трейдеров:

- анализ событий Buy / Sell;
- учёт реального остатка токена;
- фильтр по доходности `2x+`;
- дополнительная проверка истории кошелька;
- сохранение прошедших проверку адресов.

</td>
</tr>

<tr>
<td width="50%">

### 📊 Wallet Analytics

Расчёт показателей кошелька:

- PnL и Profit;
- Win Rate;
- средний размер покупки;
- количество операций;
- комиссии;
- среднее время удержания;
- ликвидность и объём токенов.

</td>
<td width="50%">

### 📄 PDF Reports

Отчёт содержит:

- общую статистику кошелька;
- показатели по каждому токену;
- суммы покупок и продаж;
- текущую стоимость накоплений;
- цветовую маркировку результата;
- повторяемые заголовки и нумерацию страниц.

</td>
</tr>

<tr>
<td width="50%">

### ⏳ Background Processing

Длительные проверки выполняются в фоне:

- прогресс по торговым парам;
- количество загруженных событий;
- скорость обработки;
- прогресс страниц Zerion;
- остановка активного алгоритма;
- автоматическое восстановление статуса.

</td>
<td width="50%">

### 🔐 Access & Reliability

Для безопасной работы используются:

- allowlist Telegram ID;
- секреты только через `.env`;
- retry с backoff для API;
- обработка rate limit `429`;
- защита от повторяющихся cursor / URL;
- таймауты внешних запросов.

</td>
</tr>
</table>

---

## Архитектура

```text
                            ┌──────────────────────┐
                            │    Telegram User     │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   Telegraf Scenes    │
                            │  Commands / Status   │
                            └──────┬────────┬──────┘
                                   │        │
                       token scan  │        │ wallet history
                                   ▼        ▼
                          ┌────────────┐  ┌────────────┐
                          │ Defined.fi │  │   Zerion   │
                          │ GraphQL API│  │  REST API  │
                          └─────┬──────┘  └─────┬──────┘
                                │               │
                                └───────┬───────┘
                                        ▼
                            ┌──────────────────────┐
                            │ Analytics Pipeline   │
                            │ Buy/Sell · PnL · Fee │
                            └──────┬────────┬──────┘
                                   │        │
                                   ▼        ▼
                            ┌──────────┐  ┌───────────┐
                            │PostgreSQL│  │ PDF Report│
                            │Sequelize │  │  pdfmake  │
                            └──────────┘  └───────────┘
```

Defined.fi используется для получения токенов, торговых пар, swap-событий, цен,
ликвидности и объёма торгов.

Zerion используется для загрузки истории Ethereum-сделок конкретного кошелька
за выбранный период.

---

## Как работает поиск китов

```text
Контракт токена
       ↓
Получение всех торговых пар
       ↓
Загрузка swap-событий за 90 дней
       ↓
Нормализация Buy / Sell относительно целевого токена
       ↓
Сопоставление продаж с купленным количеством
       ↓
Отбор кошельков с результатом 2x+
       ↓
Загрузка истории каждого кошелька из Zerion
       ↓
Расчёт PnL, Win Rate, комиссий и накоплений
       ↓
Проверка критериев кита
       ↓
Сохранение результата в PostgreSQL
```

Продажа токенов, приобретённых до анализируемого периода, не считается прибылью от покупки
внутри этого периода. Если объём продажи превышает отслеживаемый остаток, сумма продажи
учитывается пропорционально.

---

## Критерии кита

Кошелёк сохраняется как потенциальный кит, если выполняются текущие эвристики:

| Показатель | Условие |
| --- | --- |
| Win Rate | не менее `80%` |
| Profit Total | больше `30%` |
| Критические убытки | менее `26%` токенных позиций |
| Средняя покупка | менее `$5 000` |
| Среднее удержание | больше `720` минут |
| Активность | хотя бы одна операция за последние 14 дней |
| История | от 4 токенных позиций со средней доходностью выше `150%` или от 6 позиций выше `25%` |

Это исследовательская модель, а не универсальная оценка качества трейдера.

---

## Возможности Telegram-бота

Главное меню содержит:

```text
Обработать все токены базы
Обработать трендовые токены
Актуализировать список токенов
Ручная обработка токенов
Проверить кошелёк
Киты
Тикеры
Статус алгоритма
```

### Ручная обработка

Можно передать один или несколько Ethereum-контрактов и выбрать действие:

- только добавить токены в базу;
- добавить токены и сразу запустить поиск кошельков.

### Проверка кошелька

Для Ethereum-адреса доступны периоды:

```text
30 дней
60 дней
90 дней
```

Во время загрузки бот показывает число обработанных страниц и операций.
После расчёта отправляется PDF-отчёт.

---

## PDF-отчёт

Отчёт является агрегированной аналитикой по токенам, а не выгрузкой сырых транзакций.

В сводке отображаются:

```text
Win Rate
PnL
Average Return
Deposit Return
Profit
Количество сделок
Комиссии
```

Для каждого токена отображаются покупки, продажи, комиссии, остаток, PnL,
время торговли, ликвидность и суточный объём.

Зелёным отмечаются положительные результаты, красным — отрицательные.

---

## Стек

| Layer | Technologies |
| --- | --- |
| Runtime | Node.js, JavaScript, ES Modules |
| Telegram | Telegraf, Scenes, Inline Keyboards |
| Database | PostgreSQL 16 |
| ORM | Sequelize |
| Market Data | Defined.fi GraphQL API |
| Wallet Data | Zerion REST API |
| Calculations | Big.js |
| PDF | pdfmake, pdfkit-table |
| HTTP | Axios |
| Infrastructure | Docker Compose |
| Tests | Node.js Test Runner |

---

## Структура проекта

```text
crypto/
│
├── src/
│   ├── algorithms/
│   │   ├── definedTest/       # пары, события, цены и токены Defined
│   │   ├── prepTransactions.js
│   │   ├── prepTokens.js
│   │   ├── feesProcess.js
│   │   ├── remapAlgorithm.js
│   │   └── summaryAlgorithm.js
│   │
│   ├── api/                   # HTTP-клиенты Defined и Zerion
│   ├── commands/              # команды и действия Telegram
│   ├── helpers/               # PDF, расчёты, статусы и клавиатуры
│   ├── models/                # Sequelize-модели
│   ├── scenes/                # Telegram-сценарии
│   ├── scripts/               # инициализация базы данных
│   ├── bot.js                 # точка запуска бота
│   ├── config.js              # environment-конфигурация
│   ├── db.js                  # подключение PostgreSQL
│   └── main.js                # pipeline анализа кошелька
│
├── test/
├── .env.example
├── compose.yaml
├── package.json
└── README.md
```

---

## Быстрый запуск

### Требования

```text
Node.js 20+
npm
Docker Desktop
Telegram bot token
Defined API key
Zerion API key
```

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Linux / macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Заполните `.env` своими значениями.

### 3. Запуск PostgreSQL

```bash
docker compose up -d
```

Проверить состояние контейнера:

```bash
docker compose ps
```

### 4. Инициализация базы

```bash
npm run db:init
```

### 5. Запуск бота

```bash
npm start
```

Режим разработки с автоматическим перезапуском:

```bash
npm run dev
```

---

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `TELEGRAM_TOKEN` | yes | токен Telegram-бота от BotFather |
| `DEFINED_API_KEY` | yes | API-ключ Defined.fi |
| `ZERION_API_KEY` | yes | API-ключ Zerion |
| `ALLOWED_TELEGRAM_IDS` | yes | разрешённые Telegram ID через запятую |
| `DB_NAME` | yes | имя базы PostgreSQL |
| `DB_USER` | yes | пользователь PostgreSQL |
| `DB_PASSWORD` | yes | пароль PostgreSQL |
| `DB_HOST` | yes | адрес PostgreSQL |
| `DB_PORT` | no | порт PostgreSQL, по умолчанию `5432` |

Пример:

```dotenv
TELEGRAM_TOKEN=
DEFINED_API_KEY=
ZERION_API_KEY=
ALLOWED_TELEGRAM_IDS=123456789

DB_NAME=cryptana
DB_USER=cryptana
DB_PASSWORD=cryptana_local
DB_HOST=127.0.0.1
DB_PORT=5432
```

Несколько Telegram ID:

```dotenv
ALLOWED_TELEGRAM_IDS=123456789,987654321
```

> Никогда не добавляйте `.env`, API-ключи и Telegram-токен в Git.

---

## База данных

Используются три основные таблицы:

| Table | Purpose |
| --- | --- |
| `tickers` | контракты токенов, дата создания и число найденных китов |
| `whales` | адреса прошедших проверку кошельков и Win Rate |
| `algorithms` | состояние, прогресс и результат фонового алгоритма |

Схема создаётся автоматически через Sequelize:

```bash
npm run db:init
```

Данные PostgreSQL сохраняются в Docker volume:

```text
cryptana-postgres-data
```

---

## Команды разработки

| Command | Description |
| --- | --- |
| `npm start` | запуск Telegram-бота |
| `npm run dev` | запуск через nodemon |
| `npm run db:init` | проверка соединения и создание таблиц |
| `npm test` | запуск автоматических тестов |

Проверки перед публикацией:

```bash
npm test
docker compose config
```

---

## Надёжность API

Для Defined и Zerion реализованы:

```text
request timeout
retry для 429 и 5xx
Retry-After support
exponential backoff
cursor validation
pagination URL validation
GraphQL error handling
```

История Zerion загружается полностью. Для очень активных кошельков это может занять
несколько минут и потребовать сотни страниц API.

---

## Ограничения

- Поддерживается только сеть **Ethereum**.
- Адреса BSC, Base, Arbitrum и других сетей не анализируются.
- Результат зависит от полноты данных Defined.fi и Zerion.
- Для активных кошельков обработка может занимать продолжительное время.
- PDF содержит агрегаты по токенам, а не каждую blockchain-транзакцию.
- Эвристики поиска китов не гарантируют будущую прибыль.
- Одновременно выполняется только один фоновый алгоритм поиска.

---

## Безопасность

- `.env` добавлен в `.gitignore`;
- реальные ключи отсутствуют в `.env.example`;
- доступ к боту ограничивается через `ALLOWED_TELEGRAM_IDS`;
- ошибки API не должны содержать секреты в Telegram-сообщениях;
- локальный PostgreSQL использует отдельный Docker volume.

Перед публикацией рекомендуется убедиться, что секреты не присутствуют в истории Git.

---

## Что хотелось изучить в проекте

Cryptana создавался как практический проект для изучения:

```text
Telegram Bot API
Telegraf Scenes
GraphQL
REST API
Blockchain analytics
Ethereum swap events
Wallet PnL
Cursor pagination
Rate limiting
PostgreSQL
Sequelize
PDF generation
Docker Compose
```

---

## Дальнейшее развитие

Планируется:

- поддержка BSC и других EVM-сетей;
- выбор сети перед запуском анализа;
- кэширование загруженных страниц;
- возобновление прерванных проверок;
- расширенная настройка критериев кита;
- экспорт CSV;
- миграции Sequelize;
- CI-проверки через GitHub Actions;
- покрытие интеграционными тестами внешних API;
- Docker-образ самого Telegram-бота.

---

## License

Проект распространяется под лицензией **ISC**.

---

<div align="center">

### 🐋 Cryptana

**Telegram · Ethereum · Defined.fi · Zerion · PostgreSQL**

Wallet analytics, whale discovery and PDF reporting.

</div>
