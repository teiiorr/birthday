# 🎂 Birthday Team Bot

A professional corporate Telegram bot focused **exclusively on employee birthdays**.
Its purpose is to make birthday celebrations more interactive, engaging, memorable
and emotionally meaningful for the whole team.

All user-facing text is in **Uzbek (Latin)**. The codebase, comments and docs are
in **English**. Built with clean, modular, production-ready architecture and
designed for **DigitalOcean + Docker Compose** deployment.

---

## ✨ What it does

**One day before** a birthday the bot posts a reminder in the corporate group and
invites everyone to write an **anonymous** wish, collected privately in DM.

**On the birthday** the bot:

1. Publishes a warm morning announcement (with the employee's photo if available).
2. Reveals the anonymous wishes **gradually** throughout the day — one by one.
3. Creates a community **poll** ("which wish felt the warmest?").
4. Posts an **evening summary** wrapping up the celebration.

If nobody wrote a wish, the employee is still celebrated with a warm message.

---

## 🧰 Tech stack

| Area        | Choice                                  |
| ----------- | --------------------------------------- |
| Runtime     | Node.js 22 (LTS)                        |
| Language    | TypeScript (strict)                     |
| Bot         | Telegraf.js 4 (long polling by default) |
| Database    | PostgreSQL 16                           |
| ORM         | Prisma 6                                |
| Scheduling  | node-cron + interval timer              |
| Dates / TZ  | Luxon (default `Asia/Tashkent`)         |
| Logging     | pino (structured JSON)                  |
| Validation  | zod (environment validation)            |
| Health      | Express (`GET /health`)                 |
| Tooling     | ESLint + Prettier                       |
| Deployment  | Docker + Docker Compose                 |

---

## 🏗️ Project structure

```
birthday-team-bot/
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Baseline migration (applied on deploy)
│   └── seed.ts                  # Idempotent seed (settings + admins)
├── src/
│   ├── config/                  # env validation (zod), typed config, constants
│   ├── infrastructure/
│   │   ├── database/            # Prisma client + connect/disconnect
│   │   ├── logger/              # pino structured logger
│   │   └── health/              # Express health-check server
│   ├── localization/            # Uzbek (Latin) strings — single source of truth
│   ├── templates/               # Reusable message builders (HTML)
│   ├── modules/                 # Domain layer (repository + service per module)
│   │   ├── employee/
│   │   ├── wish/
│   │   ├── admin/
│   │   ├── settings/
│   │   └── birthday/            # Event bookkeeping + dashboard stats
│   ├── bot/
│   │   ├── bot.ts               # Telegraf factory + command menus
│   │   ├── context.ts           # Custom context + scene state types
│   │   ├── callbacks.ts         # Callback-data builders/matchers
│   │   ├── runtime.ts           # Runtime registry (username, orchestrator, …)
│   │   ├── middlewares/         # error / logging / admin / rate-limit
│   │   ├── keyboards/           # Inline keyboards
│   │   ├── scenes/              # wish / addEmployee / editField / settings / search
│   │   ├── commands/            # public + admin commands
│   │   ├── actions/             # admin inline-button handlers
│   │   └── views/               # Admin view builders (reused by cmd + actions)
│   ├── jobs/
│   │   ├── orchestrator.ts      # All group publishing (reminders → summary)
│   │   └── scheduler.ts         # Cron + interval scheduling
│   └── main.ts                  # Bootstrap + graceful shutdown
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh         # migrate deploy → start
├── .env.example
└── README.md
```

**Architecture:** repository pattern → service layer → bot/presentation layer.
The **orchestrator** is the single owner of every group-facing message, so cron
jobs and admin "manual trigger" buttons share identical behaviour. A
`birthday_events` table makes every scheduled step idempotent — a restart never
double-posts a reminder, announcement, poll or summary.

---

## 🗄️ Database schema

| Table              | Purpose                                                        |
| ------------------ | ------------------------------------------------------------- |
| `employees`        | Employee records + denormalised `birth_month`/`birth_day`     |
| `birthday_wishes`  | Anonymous wishes (status, published flag, reveal sequence)    |
| `admins`           | Runtime-managed admins (in addition to env admins)            |
| `settings`         | Singleton (id = 1) — group id, schedule times, timezone, …    |
| `birthday_events`  | Per-employee/per-year idempotency record for scheduled steps  |

Enums: `WishStatus = PENDING | APPROVED | REJECTED`.

---

## 🔐 Environment variables

Copy `.env.example` to `.env` and fill it in. **Never commit `.env`** (it is
git-ignored).

| Variable              | Required | Default          | Description                                              |
| --------------------- | :------: | ---------------- | -------------------------------------------------------- |
| `BOT_TOKEN`           |   ✅     | —                | Token from [@BotFather](https://t.me/BotFather)          |
| `ADMIN_TELEGRAM_IDS`  |   ✅     | —                | Comma-separated numeric admin IDs                        |
| `DATABASE_URL`        |   ✅     | —                | PostgreSQL connection string                             |
| `GROUP_CHAT_ID`       |   ➖     | —                | Corporate group id (can also be set from the admin panel)|
| `NODE_ENV`            |   ➖     | `production`     | `production` \| `development`                            |
| `PORT`                |   ➖     | `3000`           | Health-check HTTP port                                   |
| `TIMEZONE`            |   ➖     | `Asia/Tashkent`  | IANA timezone                                            |
| `LOG_LEVEL`           |   ➖     | `info`           | `trace`…`fatal`                                          |
| `BOT_MODE`            |   ➖     | `polling`        | `polling` (recommended) \| `webhook`                     |
| `POSTGRES_USER`       |   ➖     | `postgres`       | Used by the bundled Postgres container                   |
| `POSTGRES_PASSWORD`   |   ➖     | `postgres`       | Used by the bundled Postgres container                   |
| `POSTGRES_DB`         |   ➖     | `birthday_bot`   | Used by the bundled Postgres container                   |

> When running with Docker Compose, `DATABASE_URL` must use the host **`postgres`**
> (the service name), e.g.
> `postgresql://postgres:postgres@postgres:5432/birthday_bot?schema=public`.
> For local development against a DB on your machine, use `localhost` instead.

The app **validates the environment on startup** and exits with a clear message
if anything required is missing or malformed.

---

## 🚀 Quick start (local development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - set BOT_TOKEN and ADMIN_TELEGRAM_IDS
#   - set DATABASE_URL to your local Postgres (host: localhost)

# 3. Apply the schema and generate the client
npm run prisma:deploy        # or: npm run prisma:migrate (dev)
npm run prisma:generate

# 4. (optional) Seed settings + admins from .env
npm run db:seed

# 5. Run in watch mode
npm run dev
```

### Useful scripts

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Start with hot reload (tsx watch)            |
| `npm run build`         | Compile TypeScript to `dist/`                |
| `npm start`             | Run the compiled app (`node dist/main.js`)   |
| `npm run typecheck`     | Type-check without emitting                  |
| `npm run lint`          | ESLint                                       |
| `npm run format`        | Prettier write                               |
| `npm run prisma:deploy` | Apply migrations (production)                |
| `npm run prisma:migrate`| Create/apply a dev migration                 |
| `npm run db:seed`       | Seed settings + admins                       |
| `npm run prisma:studio` | Open Prisma Studio                           |

---

## 🤖 Telegram setup

1. **Create the bot** with [@BotFather](https://t.me/BotFather) → copy the token
   into `BOT_TOKEN`.
2. **Disable privacy mode** so the bot can read group messages (BotFather →
   `/setprivacy` → *Disable*). Needed for group-membership checks and
   forward-based group-id detection.
3. **Add the bot to your corporate group** (as a member; admin rights are not
   required, but recommended for posting).
4. **Find your admin ID:** message [@userinfobot](https://t.me/userinfobot) → put
   the number into `ADMIN_TELEGRAM_IDS`.
5. **Find the group id:** open the in-bot admin panel → `⚙️ Sozlamalar` →
   `🏢 Guruh ID` → **forward any message from the group to the bot** and the id is
   detected automatically. (Or set `GROUP_CHAT_ID` in `.env`.)

---

## 👤 Admin onboarding

Once the bot is running and your ID is in `ADMIN_TELEGRAM_IDS`:

1. Send `/admin` to the bot in a private chat → the dashboard opens:

   ```
   👥 Xodimlar        ➕ Xodim qo'shish
   🎂 Yaqin tug'ilgan kunlar   💌 Tabriklar
   📊 Statistika      ⚙️ Sozlamalar
   ```

2. **Set the group** in `⚙️ Sozlamalar → 🏢 Guruh ID` (forward a group message).
3. **Add employees** via `➕ Xodim qo'shish` and follow the guided steps
   (name, username, birth date `DD.MM.YYYY`, department, position, optional photo).
4. **Review the schedule** in Settings (reminder / morning / publish interval /
   evening / timezone) and adjust if needed.
5. Use `🎂 Yaqin tug'ilgan kunlar` to **manually trigger** a reminder, announcement,
   wish reveal or evening summary at any time (useful for a first test).

### Commands

**Public:** `/start` · `/help` · `/birthdays` · `/next`
**Admin:** `/admin` · `/employees` · `/add_employee` · `/edit_employee` ·
`/delete_employee` · `/upcoming_birthdays` · `/settings` · `/preview_messages`

---

## 📥 Bulk-importing employees from CSV

Instead of adding people one by one, you can import a whole roster.

**Expected CSV columns** (header row required):

```
id, full_name, birth_date, birth_month, birth_day, birth_year, month_name_uz, department_position
```

`full_name` is parsed as Uzbek `Surname Given Patronymic` → stored as
**lastName = surname**, **firstName = given name**; `department_position` →
**position**. `birth_date` is `YYYY-MM-DD`. The import is **idempotent** (a
person with the same name + birthday is skipped, not duplicated).

> CSV files are git-ignored (`*.csv`) so employee PII never enters version
> control. Keep the file outside the repo or delete it after importing.

**Local development** (no build needed):

```bash
npx tsx src/scripts/import-employees.ts /absolute/path/to/birthdays.csv
```

**Inside Docker (production)** — the image already contains the compiled script:

```bash
docker compose cp birthdays.csv app:/app/employees.csv
docker compose exec app npm run import:employees -- employees.csv
```

---

## 🌊 Deployment on DigitalOcean

This is the recommended way to run the bot 24/7.

### 1. Create an Ubuntu Droplet

Create a Droplet running **Ubuntu 22.04 or 24.04** (the smallest size is enough).
Note its public IP.

### 2. Connect via SSH

```bash
ssh root@YOUR_SERVER_IP
```

### 3. Update the system

```bash
apt update && apt upgrade -y
```

### 4. Install Docker, Docker Compose plugin and git

```bash
apt install -y docker.io docker-compose-plugin git
systemctl enable docker
systemctl start docker
```

Verify:

```bash
docker --version
docker compose version
```

### 5. Clone the project

```bash
git clone YOUR_REPOSITORY_URL
cd birthday-team-bot
```

### 6. Create and fill the `.env` file

```bash
cp .env.example .env
nano .env
```

Fill in at least:

```env
BOT_TOKEN=123456789:AA...
ADMIN_TELEGRAM_IDS=11111111,22222222
GROUP_CHAT_ID=-1001234567890
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/birthday_bot?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_strong_password
POSTGRES_DB=birthday_bot
```

> Keep `POSTGRES_*` in sync with `DATABASE_URL`. Use the host **`postgres`**.

### 7. Start the containers

```bash
docker compose up -d --build
```

This builds the image, starts PostgreSQL (waits until healthy), runs
`prisma migrate deploy`, then launches the bot.

### 8. Check the logs

```bash
docker compose logs -f app
```

You should see: `Database connected`, `Cron jobs started`, `Bot started`.

### 9. Common operations

```bash
# Follow logs
docker compose logs -f app

# Restart the bot
docker compose restart app

# Stop everything
docker compose down

# Update after code changes
git pull
docker compose up -d --build

# Run the seed (optional — settings/admins are also auto-ensured at startup)
docker compose exec app npm run db:seed
```

The bot runs 24/7 thanks to `restart: unless-stopped` in `docker-compose.yml`.
Long polling is used by default, so **no domain or HTTPS is required**.

---

## 💾 Backup & restore (PostgreSQL)

**Backup:**

```bash
docker exec -t birthday_postgres pg_dump -U postgres birthday_bot > backup.sql
```

**Restore:**

```bash
cat backup.sql | docker exec -i birthday_postgres psql -U postgres birthday_bot
```

The database persists across restarts in the named volume `postgres_data`.
Schedule the backup with `cron` for safety.

---

## 🩺 Health check

The app exposes a tiny HTTP endpoint:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":123,"timestamp":"..."}
```

Both the Dockerfile and Compose file include a container health check that calls
it. Long polling itself does not need any inbound port.

---

## 📜 Logs

Structured JSON logs are written to stdout (perfect for `docker compose logs`).
Notable events: `Bot started`, `Database connected`, `Cron jobs started`,
`Birthday reminder sent`, `Birthday announcement sent`, `Anonymous wish saved`,
`Anonymous wish published`, and all errors.

```bash
docker compose logs -f app
```

---

## 🔒 Security

- Secrets are never hardcoded — everything sensitive comes from the environment.
- `.env` is git-ignored; only `.env.example` is committed.
- Required variables are validated on startup; the app fails fast with a clear
  message if any are missing.
- The container runs as a **non-root** user.
- Per-user rate limiting protects against accidental floods.
- Only corporate-group members can submit wishes (validated via `getChatMember`).

---

## ⏱️ Scheduling

All times are interpreted in the configured timezone (default `Asia/Tashkent`)
and are editable live from the admin panel (no restart needed):

| Step                | Default | Mechanism                |
| ------------------- | ------- | ------------------------ |
| Reminder            | `10:00` | daily cron               |
| Morning announcement| `09:00` | daily cron               |
| Wish reveal         | every `90` min | interval timer    |
| Evening summary     | `20:00` | daily cron (also flushes any remaining wishes + creates the poll) |

---

## 🧯 Troubleshooting

| Symptom                              | Fix                                                                 |
| ------------------------------------ | ------------------------------------------------------------------- |
| App exits: "Invalid environment…"    | Fill the missing variable in `.env`.                                |
| "no group chat id configured" logs   | Set the group in admin Settings, or `GROUP_CHAT_ID` in `.env`.      |
| Wishes rejected as "not a member"    | Add the bot to the group; disable BotFather privacy mode.           |
| Migrations fail on first boot        | Ensure `DATABASE_URL` host is `postgres` and Postgres is healthy.   |
| Times fire at the wrong hour         | Check `TIMEZONE` / Settings timezone.                               |

---

## 📄 License

MIT — see [LICENSE](LICENSE).
