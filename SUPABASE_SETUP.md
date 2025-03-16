# Supabase Setup Guide

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Setting up Supabase

1. Go to [Supabase](https://supabase.com/) and create an account if you don't have one.
2. Create a new project and note down your project URL and anon key.
3. In the Supabase dashboard, navigate to Authentication > Settings.
4. Under "Site URL", add your website URL (e.g., `http://localhost:3000` for local development).
5. Under "Redirect URLs", add:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-production-domain.com/auth/callback` (for production)
6. Save the changes.

## Email Authentication

By default, the authentication system uses email/password authentication. Supabase will send verification emails when users sign up.

For local development, you can use the Supabase local development email service which shows emails in the Supabase dashboard.

## Testing the Authentication

1. Start your Next.js development server:
   ```
   npm run dev
   ```
2. Navigate to `/auth/signup` to create a new account.
3. Check your email (or the Supabase dashboard) for the verification link.
4. After verification, you'll be redirected to the dashboard.
