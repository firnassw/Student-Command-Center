<div align="center">

# 🎓 Student Command Center

### Your academic life, organized in one place.

A modern **student command center** for managing schedules, courses, tasks, and campus access — designed with a mobile-first experience.

<br>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br>

**[🚀 View Project](#) · [📖 Documentation](#) · [🐛 Report Issue](https://github.com/firnassw/Student-Command-Center/issues)**

</div>

---

## ✦ Why SCC?

Students often have to jump between different platforms just to answer simple questions:

> *"What class do I have today?"*  
> *"Where is my next class?"*  
> *"When is my assignment due?"*  
> *"Where do I click to attend?"*

**Student Command Center** brings these everyday academic actions into one place.

```text
                 ┌──────────────────────────┐
                 │   🎓 STUDENT COMMAND     │
                 │         CENTER            │
                 └────────────┬─────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
     📅 Schedule          ✓ Tasks             📚 Courses
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    🔗 Campus Services
                              │
                              ▼
                       ⚡ Take Action
```

### The idea is simple:

**Open the app → know what matters → take action.**

---

# ✦ Experience

<div align="center">

| 📅 Schedule | ✓ Tasks | 📚 Courses | 🔗 Campus |
|:---:|:---:|:---:|:---:|
| Manage your classes | Track deadlines | Organize subjects | Quick access |
| Today & Weekly | Prioritize work | Course identity | SPADA & more |

</div>

---

## 📅 Smart Scheduling

Switch between **Today** and **Weekly** views to quickly understand your academic schedule.

```text
┌─────────────────────────────────────────────┐
│  Schedule                         This Week │
├─────────────────────────────────────────────┤
│                                             │
│  TODAY                                      │
│                                             │
│  08:00 ──── Sistem Basis Data              │
│             Lab. 3                          │
│                                             │
│  10:00 ──── Metode Survei                  │
│             R. 204                          │
│                                             │
│  13:00 ──── Rekayasa Perangkat Lunak       │
│             Lab. 2                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 🛡️ Collision Detection

Adding a new schedule shouldn't create another problem.

SCC automatically checks whether the new schedule overlaps with an existing class.

```text
Existing Schedule
       │
       ▼
┌──────────────┐
│ 08:00–10:00  │
└──────┬───────┘
       │
       │  New Schedule
       │  09:00–11:00
       ▼
┌──────────────┐
│ ⚠️ CONFLICT  │
│ Schedule     │
│ overlaps     │
└──────────────┘
       │
       ▼
   ❌ BLOCKED
```

No accidental double booking.

---

# ✦ Designed for Students

### 🎨 Dynamic Course Identity

Every course receives a deterministic visual identity.

The hashing system ensures that:

```text
Database Systems
      ↓
   Hashing
      ↓
┌─────────────────┐
│  🎨 Course ID   │
│  Color + Icon   │
└─────────────────┘
      ↓
Always consistent
```

The same course keeps the same visual identity across the entire application.

---

### 📱 Mobile First

SCC is designed around the way students actually use their devices.

```text
┌─────────────────────┐
│  Good morning 👋    │
│                     │
│  TODAY               │
│  ┌─────────────────┐│
│  │ 08:00           ││
│  │ Database System ││
│  │ Lab 3           ││
│  └─────────────────┘│
│                     │
│  NEXT                │
│  Assignment • 2d    │
│                     │
├─────────────────────┤
│  Home Schedule Tasks│
│  Courses Projects   │
└─────────────────────┘
```

Built with:

- Smooth micro-interactions
- Backdrop blur
- Touch-friendly controls
- Responsive layouts
- Bottom navigation
- PWA-ready architecture

---

# ✦ Quick Actions

Academic platforms shouldn't feel like a maze.

SCC provides direct access to external campus services.

```text
             STUDENT COMMAND CENTER
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Schedule      Tasks       Courses
          │
          ▼
     ┌───────────┐
     │   Absen   │
     └─────┬─────┘
           │
           ▼
       SPADA / LMS
```

**One action. One destination. Less friction.**

---

# ✦ Architecture

```text
                    ┌─────────────────┐
                    │     Student     │
                    └────────┬────────┘
                             │
                             ▼
                 ┌──────────────────────┐
                 │   React Application  │
                 │      + Vite          │
                 └──────────┬───────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
            Components    Hooks       Services
                │           │           │
                └───────────┼───────────┘
                            ▼
                    ┌──────────────┐
                    │   Supabase   │
                    ├──────────────┤
                    │ Auth         │
                    │ PostgreSQL   │
                    │ RLS          │
                    └──────┬───────┘
                           │
                           ▼
                     Academic Data
```

---

# ✦ Tech Stack

<div align="center">

### Frontend

`React 18` · `Vite` · `Tailwind CSS`

### Backend

`Supabase` · `PostgreSQL` · `Supabase Auth`

### Utilities

`date-fns` · `date-fns-tz`

### Architecture

`Responsive` · `PWA-ready` · `Row-Level Security`

</div>

---

# ✦ Database

SCC uses a relational PostgreSQL structure.

```text
┌───────────────────┐
│      courses      │
├───────────────────┤
│ id                │
│ name              │
│ room              │
│ user_id           │
└─────────┬─────────┘
          │
          │ 1 : N
          ▼
┌───────────────────┐
│     schedules     │
├───────────────────┤
│ id                │
│ course_id         │
│ day_of_week       │
│ start_time        │
│ end_time          │
└───────────────────┘
```

### Security

Supabase **Row-Level Security (RLS)** ensures users can only access data belonging to their account.

---

# ✦ Project Structure

```text
Student-Command-Center/
│
├── 📁 public/
│
├── 📁 src/
│   ├── 📁 components/
│   ├── 📁 pages/
│   ├── 📁 services/
│   ├── 📁 hooks/
│   ├── 📁 lib/
│   └── ...
│
├── 📄 .env
├── 📄 package.json
├── 📄 vite.config.js
└── 📄 README.md
```

---

# ✦ Getting Started

### 01 — Clone

```bash
git clone https://github.com/firnassw/Student-Command-Center.git
cd Student-Command-Center
```

### 02 — Install

```bash
npm install
```

### 03 — Environment

Create `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 🔒 Keep your environment variables private.

### 04 — Run

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# ✦ Roadmap

```text
                CURRENT
                   │
                   ▼
        ┌───────────────────┐
        │ 📅 Smart Schedule │
        │ 🛡️ Collision Check│
        │ 🎨 Course Identity │
        │ 🔗 Quick Actions   │
        │ 🔒 Supabase Auth   │
        └─────────┬─────────┘
                  │
                  ▼
             NEXT PHASE
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   📋 Task System       🔔 Notifications
        │                   │
        └─────────┬─────────┘
                  ▼
             FUTURE
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   📱 PWA Support      📚 Materials
        │                   │
        └─────────┬─────────┘
                  ▼
             🚀 MORE
```

- [x] Smart schedule
- [x] Today / Weekly view
- [x] Schedule collision detection
- [x] Dynamic course theming
- [x] Supabase authentication
- [x] RLS database security
- [x] External campus quick actions
- [ ] Assignment management
- [ ] Task prioritization
- [ ] Push notifications
- [ ] PWA installation
- [ ] Offline support
- [ ] Course materials
- [ ] Project management

---

# ✦ Design Philosophy

> **Academic tools should reduce friction, not add to it.**

SCC follows five principles:

| Principle | Meaning |
|---|---|
| **Clarity** | Know what matters immediately |
| **Speed** | Common actions take fewer steps |
| **Consistency** | Information looks predictable |
| **Mobile First** | Designed for everyday phone usage |
| **Less Friction** | Reduce unnecessary platform switching |

---

# ✦ Contributing

Ideas, improvements, issues, and feature requests are welcome.

If you think SCC could be better, feel free to open an issue or submit a pull request.

<div align="center">

**[Open an Issue →](https://github.com/firnassw/Student-Command-Center/issues)**

</div>

---

# 📄 License

This project is licensed under the **MIT License**.

<br>

<div align="center">

## 🎓 Student Command Center

**Plan less. Know more. Get things done.**

<br>

Made with ☕ and code by **Wahid Firnas**

[GitHub](https://github.com/firnassw)

</div>
