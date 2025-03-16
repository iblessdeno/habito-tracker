# Habito - Habit Tracking Application

Habito is a comprehensive habit tracking application built with Next.js and Supabase. It helps users build and maintain positive habits through an intuitive dashboard, detailed analytics, and streak tracking.

![Habito App Demo](https://raw.githubusercontent.com/habitoai/habito-tracker/main/public/habito-demo.gif)

## Features

- **User Authentication**: Secure login and registration using Supabase Auth
- **Habit Dashboard**: Overview of all habits with completion status
- **Habit Creation**: Create new habits with customizable frequency, target count, and reminders
- **Habit Details**: View detailed information about each habit, including completion history and streaks
- **Streak Tracking**: Monitor your progress with current and longest streak tracking
- **Analytics**: Visualize your habit performance over time
- **Reminders System**: Set time-based reminders for your habits with customizable days of the week
- **Achievements System**: Earn achievements as you build consistent habits and reach milestones
- **Social Features**: Share your progress with friends and build a supportive community

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Form Handling**: React Hook Form, Zod
- **Date Handling**: date-fns
- **Charting**: Recharts

## Database Schema

The application uses the following database tables:

1. **profiles** - User profile information
2. **habits** - Habit definitions
3. **habit_logs** - Records of habit completions
4. **habit_streaks** - Tracking of habit streaks
5. **reminders** - Time-based reminders for habits
6. **achievements** - User achievements and progress
7. **social_shares** - Shared habit content
8. **friends** - User connections
9. **social_comments** - Comments on shared content
10. **social_likes** - Likes on shared content

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

### Step 1: Create a Supabase Project

1. Sign up for a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project and note your project URL and anon key
3. Add these credentials to your `.env.local` file

### Step 2: Set Up Database Schema

The SQL scripts for setting up the database schema are located in the `supabase/schema` directory:

1. **01_base_tables.sql** - Creates the core tables (profiles, habits, habit_logs, habit_streaks)
2. **02_base_policies.sql** - Sets up RLS policies for the core tables
3. **03_achievements.sql** - Creates the achievements table and policies
4. **04_reminders.sql** - Creates the reminders table and policies
5. **05_social.sql** - Creates tables and policies for social features

You can execute these scripts in the Supabase SQL Editor in the following order:

```bash
# Option 1: Using the Supabase SQL Editor
1. Navigate to your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste each script in order (01 through 05)
4. Execute each script

# Option 2: Using the Supabase CLI
1. Install the Supabase CLI
2. Run the following commands:
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
```

### Step 3: Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure the Site URL to match your application URL (e.g., http://localhost:3000 for development)
3. Enable the Email provider for authentication
4. Optionally, configure additional providers (Google, GitHub, etc.)

### Step 4: Set Up Storage (Optional)

If you want to enable image uploads for profile pictures or habit sharing:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `avatars` for profile pictures
3. Create a new bucket called `habit-images` for habit-related images
4. Set up appropriate bucket policies:

```sql
-- Example policy for avatars bucket
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Example policy for viewing avatars
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
```

### Step 5: Verify Setup

To verify your Supabase setup is working correctly:

1. Run your application locally
2. Navigate to the signup page and create a new account
3. Check your Supabase dashboard to confirm a new user was created
4. Verify that a corresponding profile was automatically created in the `profiles` table

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/en-US/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## Deployment

The application can be deployed on Vercel or any other Next.js compatible hosting platform.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
