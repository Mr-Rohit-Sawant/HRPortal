# HR & Recruitment Management System

Full-stack MVVM application — React 18 + Vite frontend, Node.js + Express + Prisma backend, MySQL via XAMPP.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 + | https://nodejs.org |
| XAMPP | 8.x | https://apachefriends.org |
| Git | any | https://git-scm.com |

---

## 1 — Database Setup (XAMPP)

1. Start **XAMPP Control Panel** → start **Apache** and **MySQL**.
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Click **Import** → choose `phpMyAdmin/hr_recruitment_db.sql` → click **Go**.
   - This creates the `hr_recruitment_db` database with all tables and seed data.

> **Alternative via CLI:**
> ```bash
> mysql -u root -p < phpMyAdmin/hr_recruitment_db.sql
> ```

---

## 2 — Backend Setup (API/)

```bash
cd API
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="mysql://root:@localhost:3306/hr_recruitment_db"
JWT_ACCESS_SECRET="change-this-access-secret"
JWT_REFRESH_SECRET="change-this-refresh-secret"

# OpenAI — required for AI CV parsing
OPENAI_API_KEY="sk-..."

# SMTP — required for emails (use Mailtrap for dev)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-pass"
SMTP_FROM="noreply@hrapp.com"

# Elasticsearch — optional, falls back to MySQL FULLTEXT if unavailable
ELASTICSEARCH_URL="http://localhost:9200"
```

### Run Prisma migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

> If you imported the SQL file above, skip `migrate dev` and run only:
> ```bash
> npx prisma generate
> ```

### Start the API server

```bash
# Development (ts-node-dev, hot reload)
npm run dev

# Production
npm run build
npm start
```

API runs on **http://localhost:5000**

---

## 3 — Frontend Setup (Main/)

```bash
cd Main
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000` automatically.

---

## 4 — Default Login

| Field | Value |
|-------|-------|
| Email | `superadmin@hrapp.com` |
| Password | `SuperAdmin@123` |

> Change this password immediately after first login via **Settings → My Profile → Change Password**.

---

## 5 — Project Structure

```
DSRP New Project/
├── API/                         Node.js + Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma        Full database schema
│   │   └── seed.ts              Seed roles, permissions, super admin
│   ├── src/
│   │   ├── controllers/         Route handlers (auth, cv, jobs, ...)
│   │   ├── middleware/          Auth, error, upload middleware
│   │   ├── routes/              Express routers
│   │   ├── services/            PDF, email, AI parsing, search
│   │   └── utils/               JWT, helpers, logger
│   ├── uploads/                 File storage (CVs, photos, invoices)
│   └── .env.example
│
├── Main/                        React 18 + Vite + TypeScript frontend
│   └── src/
│       ├── components/          Layout, common UI components
│       ├── hooks/               Custom React hooks
│       ├── routes/              React Router setup
│       ├── services/            Axios API clients
│       ├── stores/              Zustand state (auth, theme)
│       ├── types/               TypeScript interfaces
│       ├── utils/               Helpers, formatters
│       └── views/               All page views (MVVM)
│
└── phpMyAdmin/
    └── hr_recruitment_db.sql    Full DB schema + seed data
```

---

## 6 — Key Features

- **CV Database** — Add/edit candidates, AI bulk import (PDF/DOCX via GPT-4o), Elasticsearch fuzzy search
- **Job Openings** — Multi-round interview pipeline, candidate tracking, CSV import/export
- **Invoice Generator** — Indian GST (CGST+SGST or IGST), PDF download, email delivery
- **Role-Based Access** — Dynamic permission matrix, custom roles
- **Theme Management** — Color picker, font selector, logo upload (Super Admin only)
- **Audit Logs** — Full system activity trail

---

## 7 — Production Build

```bash
# Build frontend
cd Main && npm run build        # outputs to Main/dist/

# Build backend
cd API && npm run build         # outputs to API/dist/
```

Serve `Main/dist/` via nginx or any static host. Point API requests to `https://your-domain/api`.

---

## 8 — Environment Notes

- **Elasticsearch** is optional. The CV search falls back to MySQL `FULLTEXT` if Elasticsearch is unavailable.
- **OpenAI** is required for the AI Bulk CV Import feature. Without a key, bulk import will fail gracefully.
- All uploaded files are stored under `API/uploads/`. Back up this folder along with the database.
- JWT tokens are stored in **HttpOnly cookies** — no localStorage exposure.
