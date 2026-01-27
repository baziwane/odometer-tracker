# Supabase Database Setup

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in the Supabase dashboard

## Setup Instructions

### 1. Get Your Supabase Credentials

1. Go to your project in the Supabase dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then update the values with your Supabase credentials.

### 3. Run Database Migrations

You have two options:

#### Option A: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each migration file in order:
   - Copy the contents of `001_create_tables.sql`
   - Paste into the SQL Editor and click "Run"
   - Repeat for `002_create_rls_policies.sql`
   - Repeat for `003_create_validation_trigger.sql`

#### Option B: Using Supabase CLI (Recommended for development)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

3. Push migrations:
   ```bash
   supabase db push
   ```

## Database Schema Overview

### Tables

**cars**
- Stores vehicle information
- Soft-delete via `is_active` flag
- Optional baseline tracking via `initial_odometer` and `tracking_start_date`

**odometer_readings**
- Stores monthly odometer readings
- Unique constraint: one reading per car per date
- Chronological validation enforced by trigger

**user_settings**
- Stores user preferences (theme, units, default car)
- One row per user

### Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- Policies enforce user_id filtering automatically

### Validation

- **Chronological validation trigger** ensures readings are non-decreasing by date
- Supports historical entries (adding past readings with existing future data)
- Validates against car's initial odometer (if set)

## Verification

After running migrations, verify the setup:

1. Check tables exist:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. Check RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. Check triggers exist:
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'public';
   ```

## Authentication Setup

### Enable Email/Password Auth

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Ensure **Email** provider is enabled
3. Configure email templates if needed

### Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Follow the instructions to configure OAuth credentials
4. Add your redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://your-domain.com/api/auth/callback`

## Troubleshooting

### Migration Errors

If you get errors running migrations:
- Ensure you're running them in order (001, 002, 003)
- Check that the `uuid-ossp` extension is enabled
- Verify RLS policies don't conflict with existing data

### RLS Policy Issues

If queries return empty results:
- Verify the user is authenticated
- Check that `auth.uid()` returns the correct user ID
- Review RLS policies in the Supabase dashboard

### Validation Trigger Issues

If readings fail to insert:
- Check that readings are in chronological order
- Verify dates are in the correct format (YYYY-MM-DD)
- Ensure reading values are >= previous reading for the same car
