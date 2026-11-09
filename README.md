<div align="center">

# Student Command Center

**A modern, mobile-first academic command center designed to eliminate student friction.**

Unify class schedules, assignment deadlines, course materials, project tracking, and LMS attendance into one clean, responsive dashboard.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

[Quick Start](#getting-started) • [Core Features](#core-features) • [Tech Stack](#tech-stack) • [Database & Security](#database--security) • [Available Scripts](#available-scripts) • [Contributing](#contributing)

</div>

---

## Overview

Students regularly jump between disjointed portals just to find out where their next class is, when an assignment is due, or where to log attendance.

**Student Command Center (SCC)** acts as a single operational hub for university life. Built with a mobile-first philosophy, it focuses on real-time situational awareness: open the app, immediately know what needs attention next, and take action with minimum taps.

---

## Core Features

### Smart Schedule & Conflict Prevention
- **Today & Weekly Views**: View upcoming lectures organized chronologically with Jakarta timezone (`Asia/Jakarta`) normalization.
- **Collision Detection**: Built-in validation algorithm blocks overlapping schedule submissions, preventing double-booked time slots before they reach the database.
- **One-Tap Attendance**: Integrated links directly open campus LMS / SPADA attendance forms without navigating multi-level menus.

### Dynamic Urgency Task Tracker
- **Priority Engine**: Automatically categorizes assignment urgency based on remaining time:
  - `URGENT`: Due in less than 24 hours
  - `ATTENTION`: Due in 1 to 3 days
  - `UPCOMING`: Due within a week
  - `SAFE`: More than 7 days left
  - `OVERDUE`: Flagged immediately if deadline passed
- **Course-Linked Deadlines**: Tasks directly associate with your registered courses for contextual clarity.

### Deterministic Course Theming
- Every enrolled course is assigned a unique, reproducible pastel palette and icon based on string hashing (`courseTheme.ts`).
- Guarantees visual consistency across dashboard widgets, task cards, project boards, and schedule timetables.

### Academic Projects & Milestones
- Break major course deliverables into manageable sub-tasks.
- Track overall completion percentage with interactive progress bars.
- Filter projects by completion status and subject.

### Lecture Notes & Course Materials
- Meeting-based note taking (`QuickNote`) linked to specific courses and class dates.
- Keep relevant lecture handouts, syllabus links, and attachments grouped under each meeting.

### Automated Web Push Notifications
- Browser push notification integration via Web Push API and service worker (`sw.js`).
- Background attendance reminders powered by Supabase Edge Functions.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Tooling** | [Vite 8](https://vitejs.dev/) + [Oxlint](https://oxc.rs/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Edge Functions) |
| **Date & Time Utilities** | [date-fns](https://date-fns.org/) + `date-fns-tz` (`Asia/Jakarta`) |
| **Background Alerts** | Web Push API + Service Worker (`sw.js`) |

---

## Database & Security

SCC uses PostgreSQL backed by Supabase with **Row-Level Security (RLS)** applied across all user tables:

- `courses`: Stores subject names, lecturers, room locations, and attendance URLs.
- `schedules`: Weekly recurring class schedules with day-of-week and time slots.
- `tasks`: Assignment details, status, and deadline timestamps.
- `projects` & `project_tasks`: Academic group and individual project tracking.
- `meetings`, `notes`, `materials`: Lecture session notes and related files.
- `push_subscriptions`: Registered browser endpoints for VAPID push notifications.

Every query is strictly authenticated. RLS policies enforce that users can only read, insert, update, or delete records matching their authenticated `user_id`.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free [Supabase](https://supabase.com/) project

### 1. Clone the Repository

```bash
git clone https://github.com/firnassw/Student-Command-Center.git
cd Student-Command-Center
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (you can copy `.env.example`):

```bash
cp .env.example .env
```

Fill in your Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally

Start the Vite development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server with hot-reload |
| `npm run build` | Compiles TypeScript and creates optimized production assets |
| `npm run preview` | Locally previews the production build |
| `npm run lint` | Runs [oxlint](https://oxc.rs/) for high-speed JavaScript/TypeScript linting |

---

## Project Structure

```text
Student-Command-Center/
├── public/
│   ├── assets/              # Static branding and icons
│   └── sw.js                # Service Worker for push notifications
├── src/
│   ├── assets/              # App images and illustrations
│   ├── components/          # Page views, modals, and reusable UI components
│   │   ├── Dashboard.tsx    # Main command center dashboard
│   │   ├── Schedules.tsx    # Class schedule calendar & collision check
│   │   ├── Tasks.tsx        # Assignment priority tracker
│   │   ├── Projects.tsx     # Academic milestone & task manager
│   │   ├── QuickNote.tsx    # Lecture notes & meeting materials
│   │   └── ...
│   ├── hooks/               # Custom data hooks (useSupabaseData, usePushSubscription)
│   ├── lib/                 # Supabase client, time, and push utilities
│   ├── utils/               # Urgency calculator and course theme hashing
│   ├── App.tsx              # Root application router and auth guard
│   └── main.jsx             # React entrypoint
├── supabase/
│   └── functions/           # Supabase Edge Functions (e.g. check-attendance)
├── tailwind.config.js       # Tailwind CSS theme configuration
├── vite.config.js           # Vite configuration
└── package.json
```

---

## Contributing

Contributions, feedback, and issue reports are always welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Crafted with care by **[Wahid Firnas](https://github.com/firnassw)**

</div>
