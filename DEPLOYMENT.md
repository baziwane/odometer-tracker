# Deployment Guide

This guide covers deploying the Odometer Tracker application to production.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Supabase project created and configured
2. ✅ Database migrations run successfully
3. ✅ Environment variables documented
4. ✅ Code pushed to Git repository (GitHub, GitLab, etc.)

## Recommended: Vercel Deployment

Vercel is the recommended platform for Next.js applications. It provides:
- Automatic deployments from Git
- Zero-configuration Next.js support
- Free HTTPS with automatic renewal
- Global CDN
- Serverless functions for API routes

### Step 1: Prepare Repository

1. **Create .gitignore** (already configured)
   ```
   .env.local
   .env*.local
   node_modules
   .next
   ```

2. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/odometer-tracker.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import Project**:
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `odometer.yourdomain.com`)
3. Follow DNS configuration instructions
4. SSL automatically provisioned

### Step 4: Set Up Continuous Deployment

Vercel automatically deploys on every push to `main`:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests get preview URLs
- **Branch Deploys**: Other branches get unique URLs

## Alternative: Other Platforms

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option C: Self-Hosted (Docker)

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

**Build and run**:
```bash
docker build -t odometer-tracker .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  odometer-tracker
```

### Option D: AWS Amplify

1. Go to AWS Amplify Console
2. Connect your Git repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```
4. Add environment variables
5. Deploy

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Optional Variables

```bash
# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Custom Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] Application loads successfully
- [ ] Authentication works (signup, login, logout)
- [ ] API routes accessible
- [ ] Database connection working

### 2. Test Critical Flows

- [ ] Create account
- [ ] Add a car
- [ ] Add odometer reading
- [ ] Update car information
- [ ] Delete reading
- [ ] Sign out and sign back in
- [ ] Test on mobile device

### 3. Performance Checks

```bash
# Test with Lighthouse
npx lighthouse https://your-domain.com --view

# Check bundle size
npm run build

# Monitor API response times
# Use Vercel Analytics or similar
```

### 4. Security Checks

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables not exposed
- [ ] Row Level Security policies active in Supabase
- [ ] API routes protected by authentication
- [ ] No secrets in client-side code

### 5. Monitoring Setup

#### Option A: Vercel Analytics

```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Option B: Sentry Error Tracking

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## Database Backup

Set up automated backups in Supabase:

1. Go to Database → Backups in Supabase dashboard
2. Enable automatic daily backups
3. Configure retention period (7-30 days)
4. Test restoration process

## Rollback Strategy

### Vercel Rollback

1. Go to Deployments in Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Deployment automatically rolled back

### Database Rollback

1. Go to Supabase dashboard → Database → Migrations
2. Create new migration to revert changes:
   ```sql
   -- Example: Revert column addition
   ALTER TABLE cars DROP COLUMN IF EXISTS new_field;
   ```
3. Run migration

## Performance Optimization

### 1. Enable Caching

Add caching headers to API routes:

```typescript
// src/app/api/cars/route.ts
export async function GET() {
  // ... existing code

  return NextResponse.json({ data }, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
    },
  });
}
```

### 2. Image Optimization

Already configured with Next.js Image component.

### 3. Database Query Optimization

- Add indexes for frequently queried columns
- Use connection pooling (Supabase includes this)
- Enable query caching in Supabase

### 4. CDN Configuration

Vercel automatically serves static assets via global CDN.

## Scaling Considerations

### Database Scaling

Supabase Free Tier:
- 500 MB database storage
- 2 GB bandwidth per month
- Unlimited API requests

To scale:
1. Upgrade Supabase plan
2. Consider read replicas for high traffic
3. Implement database connection pooling

### API Rate Limiting

Add rate limiting to API routes:

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

## Troubleshooting

### Build Failures

**Error**: `Module not found`
- Check import paths use `@/` prefix
- Verify all dependencies in package.json

**Error**: `Environment variable not found`
- Add to Vercel environment variables
- Redeploy after adding variables

### Runtime Errors

**401 Unauthorized**
- Verify Supabase URL and keys correct
- Check RLS policies in Supabase
- Verify user authenticated

**CORS Errors**
- Check Supabase CORS settings
- Verify API route configuration

**Database Connection Failed**
- Check Supabase project status
- Verify network connectivity
- Review Supabase logs

## Monitoring & Alerts

### Set Up Alerts

**Vercel**:
- Email notifications for failed deployments
- Function errors
- Performance degradation

**Supabase**:
- Database CPU usage
- Storage limits
- API errors

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Test database connection
    const { error } = await supabase.from('cars').select('count').limit(1);

    if (error) throw error;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}
```

Monitor with uptime service (UptimeRobot, Pingdom, etc.)

## Cost Estimates

### Free Tier

**Vercel**:
- Free for personal projects
- Includes: Deployments, Analytics, Bandwidth

**Supabase**:
- Free tier: 500 MB DB, 2 GB bandwidth
- Good for: Testing, small projects

### Production Scale

**Vercel Pro**: $20/month
- Custom domains
- Team collaboration
- Advanced analytics

**Supabase Pro**: $25/month
- 8 GB database
- 50 GB bandwidth
- Daily backups

## Next Steps After Deployment

1. **Monitor**: Set up error tracking and analytics
2. **Optimize**: Review performance and add caching
3. **Scale**: Upgrade plans as user base grows
4. **Iterate**: Gather user feedback and improve
5. **Test**: Add E2E tests for critical flows
6. **Document**: Keep README and docs updated

## Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/docs/support](https://supabase.com/docs/support)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
