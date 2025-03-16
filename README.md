# Habito - Habit Tracking Application

Habito is a comprehensive habit tracking application built with Next.js and Supabase. It helps users build and maintain positive habits through an intuitive dashboard, detailed analytics, and streak tracking.

## Features

- **User Authentication**: Secure login and registration using Supabase Auth
- **Habit Dashboard**: Overview of all habits with completion status
- **Habit Creation**: Create new habits with customizable frequency, target count, and reminders
- **Habit Details**: View detailed information about each habit, including completion history and streaks
- **Streak Tracking**: Monitor your progress with current and longest streak tracking
- **Analytics**: Visualize your habit performance over time

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Form Handling**: React Hook Form, Zod
- **Date Handling**: date-fns

## Database Schema

The application uses the following database tables:

1. **profiles** - User profile information
2. **habits** - Habit definitions
3. **habit_logs** - Records of habit completions
4. **habit_streaks** - Tracking of habit streaks

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Supabase Setup

The application requires the following tables and policies to be set up in Supabase:

### Tables

- **profiles**: Stores user profile information
- **habits**: Stores habit definitions
- **habit_logs**: Tracks habit completion
- **habit_streaks**: Tracks habit streaks

### Row Level Security (RLS)

RLS policies are implemented on all tables to ensure users can only access their own data.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deployment

The application can be deployed on Vercel or any other Next.js compatible hosting platform.
