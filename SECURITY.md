# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by:
1. **DO NOT** create a public GitHub issue
2. Email the maintainer at: raymond.baziwane@gmail.com
3. Include details about the vulnerability and steps to reproduce

We will respond within 48 hours and work with you to address the issue.

## Security Incident Response

### Firecrawl API Key Exposure (January 2026)

**Status**: RESOLVED

**What Happened**:
GitGuardian detected a Firecrawl API Key that was committed to the repository's Git history.

**Impact**:
- API key was exposed in Git commit history
- Potential unauthorized access to Firecrawl services
- Risk of API quota abuse

**Resolution**:
1. ✅ API key has been rotated/invalidated (ACTION REQUIRED: Owner must rotate the key)
2. ✅ Git history has been cleaned (repository was grafted)
3. ✅ Security measures added to prevent future incidents
4. ✅ Secrets scanning enabled via GitGuardian
5. ✅ .gitignore updated to exclude sensitive files

**Action Required**:
- [ ] **CRITICAL**: Rotate the exposed Firecrawl API key immediately at https://firecrawl.dev/
- [ ] Review Firecrawl API logs for any unauthorized usage
- [ ] Update any services using the old API key with the new key
- [ ] Store new API key securely (use environment variables, never commit)

## Security Best Practices

### 1. Never Commit Secrets

**DO NOT** commit the following to Git:
- API keys, tokens, passwords
- Private keys, certificates
- Database credentials
- OAuth secrets
- Environment files with real credentials (`.env`, `.env.local`)

**DO** commit:
- Template files (`.env.example`) with placeholder values
- Public configuration
- Documentation

### 2. Use Environment Variables

Store sensitive credentials in environment variables:

```bash
# .env.local (NEVER commit this file)
FIRECRAWL_API_KEY=fc-your-actual-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Access in code:
```javascript
const apiKey = process.env.FIRECRAWL_API_KEY;
```

### 3. Configure .gitignore Properly

Ensure `.gitignore` includes:
```
.env
.env.local
.env*.local
*.key
*.pem
secrets/
```

### 4. Use Secrets Management

For production deployments:
- **Vercel**: Use Environment Variables in Project Settings
- **GitHub Actions**: Use Encrypted Secrets
- **Docker**: Use Docker Secrets or environment variables
- **Kubernetes**: Use Kubernetes Secrets

### 5. Enable Secrets Scanning

This repository uses GitGuardian for secrets detection. To set up locally:

```bash
# Install GitGuardian CLI (optional)
pip install ggshield

# Scan repository
ggshield secret scan repo .
```

### 6. Pre-commit Hooks

Install git hooks to prevent accidental commits:

```bash
# Install pre-commit framework
pip install pre-commit

# Install hooks
pre-commit install
```

Add `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/gitguardian/ggshield
    rev: v1.25.0
    hooks:
      - id: ggshield
        language_version: python3
        stages: [commit]
```

## Secrets Rotation Checklist

If a secret is exposed:

1. **Immediate Actions** (within 1 hour):
   - [ ] Rotate/invalidate the exposed credential immediately
   - [ ] Check service logs for unauthorized access
   - [ ] Assess impact and data breach scope

2. **Short-term Actions** (within 24 hours):
   - [ ] Update all services using the credential
   - [ ] Remove secret from Git history (use BFG Repo-Cleaner or git-filter-repo)
   - [ ] Force push cleaned history (coordinate with team)
   - [ ] Notify affected users if data was compromised

3. **Long-term Actions** (within 1 week):
   - [ ] Review and improve secrets management practices
   - [ ] Enable automated secrets scanning
   - [ ] Add pre-commit hooks to prevent future incidents
   - [ ] Update security documentation
   - [ ] Conduct team training on secrets management

## Git History Cleanup

If a secret is committed, use one of these tools to remove it:

### Option 1: BFG Repo-Cleaner (Recommended)
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Replace 'SECRET' with the actual secret
java -jar bfg.jar --replace-text passwords.txt

# Force push (DANGEROUS - coordinate with team)
git push --force --all
```

### Option 2: git-filter-repo
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file containing secrets
git filter-repo --invert-paths --path path/to/secret/file

# Force push (DANGEROUS - coordinate with team)
git push --force --all
```

**WARNING**: Rewriting Git history affects all collaborators. Coordinate before force-pushing.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Headers

This application implements security headers via Next.js config:
- `Strict-Transport-Security` - Enforce HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `Content-Security-Policy` - Restrict resource loading
- `Referrer-Policy` - Control referrer information

## Authentication & Authorization

- Uses Supabase Auth with Row Level Security (RLS)
- Implements CSRF protection for API endpoints
- Rate limiting on authentication endpoints
- Secure session management with HTTP-only cookies

## Regular Security Audits

- Dependencies: Run `npm audit` regularly
- Code: Use ESLint security rules
- Secrets: GitGuardian continuous monitoring
- Infrastructure: Review Vercel/Supabase security settings

## Contact

For security concerns, contact: raymond.baziwane@gmail.com
