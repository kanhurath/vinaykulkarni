# Vinay Kulkarni — Personal Portfolio & CMS

A full-stack personal portfolio website for Vinay Kulkarni, built with React 19 on the frontend and Node.js + Express + MySQL on the backend. Includes a custom CMS with an admin dashboard for managing all site content.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite 8 |
| Backend | Node.js, Express 4 |
| Database | MySQL (via mysql2) |
| Rich Text | CKEditor 5 |
| Auth | JWT + bcryptjs |
| Image Processing | Sharp, Multer |
| SEO | react-helmet-async, server-side SEO injection |

---

## Project Structure

```
/
├── frontend/        # React app (Vite)
│   ├── src/
│   │   ├── components/   # Layout, Sections, UI, admin components
│   │   ├── pages/        # Route-level page shells + admin pages
│   │   ├── services/     # API client modules (one per resource)
│   │   ├── hooks/        # useReveal (scroll animations), useGlobalCustomizer
│   │   ├── context/      # BookingModal, AdminAuth, PageStatus contexts
│   │   ├── data/         # contentConfig.js, blockDefs.js
│   │   └── styles/       # globals.css (design tokens)
│   └── dist/             # Production build output
└── server/          # Node.js/Express API
    ├── routes/           # One file per resource (articles, events, gallery, …)
    ├── db.js             # MySQL connection pool
    ├── migrate.js        # DB migration runner
    ├── seoInjector.js    # Injects SEO meta into served HTML
    └── index.js          # App entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Backend

```bash
cd server
cp .env.example .env          # fill in DB credentials, JWT_SECRET, PORT
npm install
node migrate.js               # run database migrations
npm run dev                   # starts on port 3001 (nodemon)
```

**Environment variables (server/.env):**

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vinaykulkarni
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts Vite dev server (HMR)
```

Open `http://localhost:5173`.

---

## Frontend Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

## Backend Commands

```bash
npm run dev           # Start with nodemon (auto-restart)
npm start             # Start without nodemon
node migrate.js       # Run DB migrations
```

---

## Key Features

- **Public site** — Home, About, Biography, Articles, Themes, Teaching, Videos, Events, News, Gallery, Workshops, Testimonials, Connect pages
- **Admin dashboard** (`/admin`) — Full CMS for all content types, protected by JWT auth
- **Page Builder** — Custom pages with a block-based editor and design library
- **Global Customizer** — Site-wide design tokens editable from the admin
- **Draft/Publish gate** — Pages can be toggled between draft and published states
- **SEO** — Per-page meta tags managed via CMS, injected server-side for crawlers
- **Scroll-reveal animations** — `useReveal` hook with IntersectionObserver
- **Booking modal** — Site-wide booking form accessible from any page
- **Image uploads** — Multer + Sharp for processing and serving uploaded images

---

## Design System

All CSS custom properties are defined in `frontend/src/styles/globals.css`:

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#1a1208` | Near-black body text |
| `--cream` / `--parchment` | warm whites | Page/section backgrounds |
| `--saffron` | `#d4670a` | Accent labels |
| `--gold` / `--gold-light` | warm golds | Headings, decorative |
| `--deep-red` | `#8b1a1a` | Emphasis |

**Fonts:** Cormorant Garamond (body/headings), Josefin Sans (labels/nav), Noto Serif Devanagari (Sanskrit text).

---

## API Routes

The backend exposes REST endpoints under `/api/`:

`/api/articles`, `/api/biography`, `/api/home`, `/api/teaching`, `/api/videos`, `/api/events`, `/api/workshops`, `/api/testimonials`, `/api/connect`, `/api/gallery`, `/api/news`, `/api/navigation`, `/api/custom-pages`, `/api/site-blocks`, `/api/seo`, `/api/section-layout`, `/api/users`, `/api/page-status`, `/api/customizer`, `/api/auth`

---

## Production Deployment

1. Build the frontend: `cd frontend && npm run build`
2. The Express server serves the `frontend/dist` folder for all non-API routes, with SEO meta injected per page.
3. Set `NODE_ENV=production` and configure a reverse proxy (nginx/Caddy) to forward traffic to the Node process.
