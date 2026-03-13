# Supabase Auth — React Login/Signup

A self-contained React app (single `index.html`) that provides email/password authentication via [Supabase](https://supabase.com).

---

## Features

- ✅ Sign Up with email + password
- ✅ Login with email + password
- ✅ Persistent session (survives page refresh)
- ✅ Logout
- ✅ Real-time auth state updates
- ✅ Inline error/success messages
- ✅ Responsive, dark-themed UI

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project** and fill in the details.
3. Wait for the project to finish provisioning (~1–2 minutes).

### 2. Get Your API Credentials

1. In your project dashboard, go to **Project Settings → API**.
2. Copy the **Project URL** (looks like `https://xxxx.supabase.co`).
3. Copy the **anon / public** key.

### 3. Configure `index.html`

Open `index.html` and find the configuration block near the top of the `<script>` tag:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace both placeholder values with your actual credentials:

```js
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 4. Enable Email Auth in Supabase

1. In your Supabase dashboard, go to **Authentication → Providers**.
2. Ensure **Email** is enabled (it is by default).
3. *(Optional)* To skip email confirmation during development, go to **Authentication → Email Templates** → disable "Confirm email" under **Authentication → Settings → Email Auth**.

### 5. Open the App

Simply open `index.html` in your browser — no build step required.

> **Tip:** For the best experience, serve it via a local server (e.g. `npx serve .` or VS Code Live Server) rather than opening as a `file://` URL, to avoid potential CORS issues with Supabase.

---

## Project Structure

```
/
├── index.html    ← Single-file React app (all HTML, CSS, JS inline)
└── readme.md     ← This file
```

## Component Tree

```
App
├── AuthForm          (shown when no session)
│   ├── Email input
│   ├── Password input
│   ├── Submit button
│   ├── Toggle link (Login ↔ Sign Up)
│   └── Error / Success alert
└── Dashboard         (shown when authenticated)
    ├── User avatar + email
    ├── Session info card (status, user ID, provider, sign-in time)
    └── Sign Out button
```

---

## Key Supabase API Calls

| Action | Call |
|---|---|
| Sign Up | `supabase.auth.signUp({ email, password })` |
| Login | `supabase.auth.signInWithPassword({ email, password })` |
| Logout | `supabase.auth.signOut()` |
| Get Session | `supabase.auth.getSession()` |
| Auth Listener | `supabase.auth.onAuthStateChange(callback)` |

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI Framework | React 18 (CDN via unpkg) |
| JSX Transpilation | Babel Standalone (CDN) |
| Auth Backend | Supabase Auth |
| Supabase Client | `@supabase/supabase-js` v2 (CDN via jsDelivr) |
| Styling | Inline `<style>` block (no external CSS) |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Invalid login credentials" | Check email/password are correct. Ensure email is confirmed if confirmation is enabled. |
| "Email already registered" | Use Login mode instead, or reset your password. |
| App shows config warning | Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in `index.html`. |
| CORS errors | Serve via a local HTTP server instead of opening as `file://`. |
| Email not arriving | Check spam folder; or disable email confirmation in Supabase Auth settings for development. |