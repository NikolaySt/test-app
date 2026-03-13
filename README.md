# Supabase Auth — React + TypeScript + Node.js

A full-stack authentication app using Supabase, React 18, TypeScript, Vite, and Express.

## Project Structure

```
├── client/                  # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.tsx
│   │   │   ├── AuthForm.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ConfigNotice.tsx
│   │   ├── lib/
│   │   │   └── supabaseClient.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.local           # Supabase anon key (gitignored)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── server/                  # Node.js + Express + TypeScript backend
    ├── src/
    │   ├── routes/
    │   │   └── auth.ts
    │   ├── middleware/
    │   │   └── requireAuth.ts
    │   └── index.ts
    ├── .env                  # Supabase service role key (gitignored)
    ├── tsconfig.json
    └── package.json
```

## Setup

### 1. Frontend

```bash
cd client
npm install
```

Edit `client/.env.local`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Backend

```bash
cd server
npm install
```

Edit `server/.env`:
```
PORT=3001
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ The server uses the **service role key** — never expose it to the browser.

## Running Locally

```bash
# Terminal 1 — Frontend (http://localhost:5173)
cd client && npm run dev

# Terminal 2 — Backend (http://localhost:3001)
cd server && npm run dev
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | Bearer token | Returns authenticated user |

## Credentials

Get your credentials from the [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.