# Odometer Tracker

A modern, mobile-first Progressive Web App for tracking vehicle odometer readings with cloud sync.

## Features

- 📱 **Mobile-First Design**: Optimized for smartphones with responsive desktop support
- 🚗 **Multi-Vehicle Tracking**: Manage multiple cars with detailed information
- 📊 **Analytics Dashboard**: View mileage trends, monthly averages, and YTD totals
- ☁️ **Cloud Sync**: Access your data from any device
- 🔐 **Secure Authentication**: Email/password and Google OAuth support
- 📈 **Chronological Validation**: Automatic validation ensures data integrity
- 💾 **Data Migration**: Easy import from localStorage to cloud database
- 🎨 **Dark Mode**: Automatic theme switching based on system preference

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Mantine 7
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Validation**: Zod
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/odometer-tracker.git
   cd odometer-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a project at [supabase.com](https://supabase.com)
   - Run database migrations (see `supabase/README.md`)
   - Get your credentials from Settings → API

4. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Documentation

- **[Implementation Guide](IMPLEMENTATION.md)**: Technical architecture and API documentation
- **[Deployment Guide](DEPLOYMENT.md)**: How to deploy to production
- **[Testing Guide](TESTING.md)**: How to write and run tests
- **[Database Setup](supabase/README.md)**: Database schema and migration instructions
- **[Security Policy](SECURITY.md)**: Security best practices and incident response
- **[Security Setup](SECURITY_SETUP.md)**: Security tools installation and configuration

## Project Structure

```
├── src/
│   ├── app/              # Next.js pages and API routes
│   │   ├── api/          # REST API endpoints
│   │   └── ...           # Pages (dashboard, cars, readings, settings)
│   ├── components/       # React components
│   │   ├── auth/         # Authentication UI
│   │   ├── cars/         # Car management
│   │   ├── readings/     # Odometer reading components
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React contexts (Auth)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and API clients
│   └── types/            # TypeScript type definitions
├── supabase/             # Database migrations
└── public/               # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/session` - Get current session

### Cars
- `GET /api/cars` - List all cars
- `POST /api/cars` - Create car
- `GET /api/cars/:id` - Get single car
- `PATCH /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Soft delete car

### Readings
- `GET /api/readings` - List readings (optional `?carId` filter)
- `POST /api/readings` - Create reading
- `GET /api/readings/:id` - Get single reading
- `PATCH /api/readings/:id` - Update reading
- `DELETE /api/readings/:id` - Delete reading

### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings

## Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Key Features Explained

### Chronological Validation

The app enforces that odometer readings must be non-decreasing by date:
- Readings are validated both client-side and server-side
- PostgreSQL trigger ensures data integrity
- Clear error messages guide users when validation fails
- Supports adding historical readings (backfilling)

### Data Migration

Users with existing localStorage data can migrate to the cloud:
1. Sign in to your account
2. Click your avatar → "Migrate Data"
3. Export localStorage data as JSON
4. Import JSON file to sync with database

### Multi-Device Sync

All data is stored in Supabase PostgreSQL:
- Changes sync instantly across devices
- Row Level Security ensures privacy
- No offline mode (requires internet connection)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Deployment

The easiest way to deploy is with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/odometer-tracker)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Security

This project implements multiple layers of security:

- 🔐 **Secrets Management**: Environment variables for sensitive data
- 🛡️ **GitGuardian Integration**: Automated secrets scanning
- 🔍 **Pre-commit Hooks**: Prevent accidental secret commits
- 🚨 **CI/CD Security Scanning**: Continuous security monitoring
- 📋 **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- 🔑 **Supabase RLS**: Row-level security for data protection
- 🚦 **Rate Limiting**: Protection against abuse
- 🛑 **CSRF Protection**: Cross-site request forgery prevention

**Important**: Never commit API keys or secrets to Git. See [SECURITY.md](SECURITY.md) for security policy and [SECURITY_SETUP.md](SECURITY_SETUP.md) for setup instructions.

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase and Next.js docs

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Mantine](https://mantine.dev/)
- Database and auth by [Supabase](https://supabase.com/)
- Icons from [Tabler Icons](https://tabler-icons.io/)
