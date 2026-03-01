# Wellness Tax App

Монорепозиторій із двома частинами:
- `backend` (Node.js + Express + TypeScript) для створення, імпорту та отримання замовлень.
- `frontend` (React + TypeScript + Vite) для UI керування замовленнями.

## Що вміє застосунок
- Створення одного замовлення з `latitude`, `longitude`, `subtotal`.
- Автоматичний розрахунок:
  - `composite_tax_rate`
  - `tax_amount`
  - `total_amount`
- Імпорт замовлень із CSV (`/orders/import`).
- Список замовлень із фільтрами та пагінацією.

## Технології
- Backend: Express, TypeScript, SQLite, Multer, csv-parser
- Frontend: React, TypeScript, Vite, Axios, React Router
- Root: concurrently для одночасного запуску frontend/backend

## Структура
```text
WellnessTaxApp/
  backend/
    src/
      controllers/
      repositories/
      routes/
      services/
  frontend/
    src/
      api/
      components/
      pages/
  package.json
```

## Вимоги
- Node.js 18+ (рекомендовано LTS)
- npm 9+

## Встановлення
```bash
npm run install:all
```

Альтернатива:
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Запуск у dev режимі
З кореня проєкту:
```bash
npm run dev
```

Окремо:
```bash
npm run dev:backend
npm run dev:frontend
```

Порти за замовчуванням:
- Backend: `http://localhost:3000`
- Frontend (Vite): зазвичай `http://localhost:5173`

## Build
```bash
npm run build
```

Окремо:
```bash
npm run build:backend
npm run build:frontend
```

## API
Базовий URL: `http://localhost:3000`

### `GET /orders`
Повертає список замовлень з пагінацією.

Query params:
- `page` (number, default `1`)
- `limit` (number, default `10`)
- `id` (positive int)
- `minSubtotal`, `maxSubtotal`
- `minTotal`, `maxTotal`

Приклад:
```bash
curl "http://localhost:3000/orders?page=1&limit=5&minTotal=10&maxTotal=200"
```

### `POST /orders`
Створює одне замовлення.

Body (JSON):
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "subtotal": 100
}
```

### `POST /orders/import`
Імпорт CSV файлу.

`multipart/form-data`:
- field name: `file`

Приклад:
```bash
curl -X POST http://localhost:3000/orders/import \
  -F "file=@orders.csv"
```

## Формат CSV
Обов'язкові колонки:
- `latitude`
- `longitude`
- `subtotal`

Опційна колонка:
- `timestamp` (якщо немає, використовується поточний час)

Приклад:
```csv
latitude,longitude,subtotal,timestamp
40.7128,-74.0060,100,2026-02-28T12:00:00.000Z
34.0522,-118.2437,55.5,
```

## Важливо про зберігання даних
Зараз використовується SQLite база:
- файл БД: `backend/data/wellness-tax.sqlite`
- таблиця `orders` створюється автоматично при старті backend
- `id` генерується як `AUTOINCREMENT`

## Податкові ставки (поточна реалізація)
`tax.service.ts` повертає фіксовані значення:
- `state_rate: 0.04`
- `county_rate: 0.03`
- `city_rate: 0.015`
- `special_rate: 0.00375`

Сумарна ставка:
`composite_tax_rate = state + county + city + special`

## Frontend
Основні сторінки:
- `/` — таблиця замовлень, фільтри, пагінація, імпорт CSV
- `/create` — створення одного замовлення + імпорт CSV

## Можливі покращення
- Міграції схеми БД
- За потреби перехід на PostgreSQL/MySQL
- Валідацію схем (`zod`/`joi`)
- Тести (unit + integration)
- Docker для локального запуску
