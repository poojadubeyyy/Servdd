# AI Recipe Platform

An AI-powered recipe and pantry management application built with a Strapi backend and a modern Next.js frontend.

## 🚀 Project Overview

This repository contains a full-stack platform for browsing recipes, managing pantry items, and saving favorite recipes. It combines:

- **Backend:** Strapi CMS for content types, API routes, and database management
- **Frontend:** Next.js 16 with React 19, Clerk authentication, and a polished user experience
- **AI-enhanced features:** recipe discovery, pantry-driven recommendations, and PDF export support

## 📁 Repository Structure

- `backend/` — Strapi app with API content types and controllers
- `frontend/` — Next.js application with UI components, page routes, hooks, and utilities

## 🔧 Technologies

- `Next.js 16.1.1`
- `React 19.2.3`
- `Strapi 5.33.1`
- `Clerk` for authentication
- `Google Generative AI` integration
- `Tailwind CSS v4` for styling
- `@radix-ui` components for UI primitives
- `@react-pdf/renderer` for PDF export

## ✅ Key Features

- Pantry item management
- Recipe browsing, categorization, and search
- Saved recipes collection
- Recipe PDF generation
- User authentication with Clerk
- Admin content management via Strapi

## ⚙️ Local Setup

### 1. Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start the backend

From `backend/`:

```bash
npm run develop
```

Strapi will start in development mode and expose its admin panel and APIs.

### 3. Start the frontend

From `frontend/`:

```bash
npm run dev
```

The app will start in development mode, usually on `http://localhost:3000`.

## 🧩 Backend Notes

The backend is configured as a Strapi application with:

- `@strapi/plugin-users-permissions`
- `@strapi/plugin-cloud`
- `better-sqlite3` for local development
- `pg` support for PostgreSQL if you switch to a hosted database

### Typical backend commands

```bash
npm run develop
npm run build
npm run start
npm run console
```

## 🧪 Frontend Notes

The frontend uses Next.js with custom components, page routing, and a theme provider. It includes:

- Clerk auth
- PDF generation support
- Recipe and pantry UI screens
- AI-powered search / content features

### Typical frontend commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 🔐 Environment Configuration

The frontend likely depends on environment variables for:

- Clerk API keys
- Google Generative AI credentials
- Any custom API base URLs or auth settings

Add these to a `.env` file in `frontend/` if needed.

## 🧭 Useful Links

- `backend/config/` — Strapi configuration files
- `frontend/app/` — Next.js app routes and layouts
- `frontend/components/` — reusable UI components
- `frontend/lib/` — helper utilities

## 📌 Contribution

1. Fork the repo
2. Install dependencies
3. Run backend and frontend locally
4. Open a PR with your feature or bugfix

## 💡 Tips

- Use Strapi admin to create recipe and pantry content types if not already seeded
- Keep the backend running while testing the frontend
- If you swap databases, update Strapi database config in `backend/config/database.js`

---

Built for a fast, AI-enabled recipe discovery experience with modern content management and user authentication.
