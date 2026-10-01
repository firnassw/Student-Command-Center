# 🎓 Student Command Center (SCC)

> Your all-in-one personal academic dashboard.

**Student Command Center** is a modern, responsive, and highly-aesthetic Web Application designed to help students effortlessly manage their academic lives. Built with a focus on seamless mobile experience (PWA-ready), it centralizes class schedules, assignments, and campus portal integrations.

## ✨ Features

- **📅 Smart Scheduling System**: Toggle between 'Today' and 'Weekly' views with an intuitive, swipe-friendly interface.
- **🛡️ Collision Detection (Validasi Bentrok)**: An intelligent overlap validator prevents scheduling conflicts. The system automatically halts and alerts you if a new or modified class clashes with an existing schedule.
- **🎨 Dynamic Course Theming**: A bespoke hashing algorithm guarantees that each course retains a consistent color palette and iconography across all views.
- **📱 Mobile-First Aesthetics**: Packed with smooth micro-animations, custom backdrop-blurs, and intuitive bottom navigation crafted for premium mobile usability.
- **🔗 External Integrations**: One-click quick actions (like "Absen") that seamlessly route to university e-learning portals (e.g., SPADA).
- **🔒 Secure Architecture**: Powered by Supabase for robust Row-Level Security (RLS) authentication and real-time database management.

## 🛠️ Tech Stack

- **Framework**: React 18 powered by Vite
- **Styling**: Tailwind CSS (with highly customized design tokens)
- **Backend & Auth**: Supabase (PostgreSQL)
- **Date Management**: `date-fns` & `date-fns-tz` (Strict Asia/Jakarta timezone handling)

## 🚀 Getting Started

Follow these steps to set up the project on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- A Supabase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/firnassw/Student-Command-Center.git
   cd Student-Command-Center
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and securely add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

## 🗄️ Database Schema Overview

The application relies on a strictly relational Supabase schema:
- **`courses`**: Stores core academic subjects (`id`, `name`, `room`, `user_id`).
- **`schedules`**: Handles temporal data and references courses (`id`, `course_id`, `day_of_week`, `start_time`, `end_time`).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/firnassw/Student-Command-Center/issues) if you want to contribute.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
