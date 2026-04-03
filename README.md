# TIKNO Mascotas - Dog Daycare Management System

Web application for managing a dog daycare business. Track dogs, monitor their health status, manage check-ins/check-outs, and provide real-time dashboards for staff.

## Features

- **Dog Registry** - Complete dog profiles with photos, breed, owner info
- **Dashboard** - Real-time overview of all dogs currently in care
- **Status Tracking** - Monitor feeding, walks, health status per dog
- **Photo Management** - Upload and manage dog photos with Supabase Storage
- **Responsive Design** - Mobile-friendly interface for staff on the go

## Tech Stack

- **Frontend:** Vanilla JavaScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment:** Vercel

## Architecture

```
src/
├── index.html          # Main SPA entry point
├── js/
│   ├── app.js          # App initialization & routing
│   ├── config.js       # Supabase configuration
│   ├── supabase.js     # Database queries & storage
│   ├── dogs.js         # Dog CRUD operations
│   ├── dashboard.js    # Dashboard logic
│   └── ui.js           # UI rendering & interactions
└── css/
    └── styles.css      # Custom styles
```

## Quick Start

```bash
# Clone and open
git clone https://github.com/nicolas2601/gestion-de-perritos.git
cd gestion-de-perritos/src
# Open index.html in browser or use a local server
npx serve src
```

## License

MIT
