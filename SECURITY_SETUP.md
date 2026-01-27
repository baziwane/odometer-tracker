# Security Setup and Incident Response

## 🚨 CRITICAL: Firecrawl API Key Incident

A Firecrawl API key was detected in this repository's Git history by GitGuardian.

### Immediate Action Required

**Repository Owner Must:**

1. **Rotate the exposed Firecrawl API key IMMEDIATELY**
   - Login to https://firecrawl.dev/
   - Navigate to API Keys settings
   - Delete/revoke the exposed key
   - Generate a new API key
   - Update any services using the old key with the new one

2. **Check for unauthorized usage**
   - Review Firecrawl API usage logs
   - Look for unusual activity or API calls
   - Check billing for unexpected charges

3. **Secure the new key**
   - Store in environment variable (`.env.local`)
   - Add to Vercel environment variables (if deployed)
   - NEVER commit to Git

### How This Happened

The key was likely committed in an early version of the repository and later removed. However:
- Git history is permanent - deleted files remain in history
- GitGuardian scans entire Git history, not just current code
- Even after deleting the file, the secret is still accessible

### Preventive Measures Implemented

This repository now includes:

✅ Comprehensive `.gitignore` for secrets  
✅ GitGuardian configuration (`.gitguardian.yaml`)  
✅ Pre-commit hooks to catch secrets before commit  
✅ GitHub Actions workflow for continuous security scanning  
✅ Security policy and incident response documentation

## Setup Instructions

### 1. Install Security Tools

```bash
# Install pre-commit framework (requires Python)
pip install pre-commit

# Install pre-commit hooks
pre-commit install

# Test the hooks
pre-commit run --all-files
```

### 2. Configure GitGuardian (Optional but Recommended)

For local scanning:
```bash
# Install GitGuardian CLI
pip install ggshield

# Scan repository
ggshield secret scan repo .

# Scan before commit (if not using pre-commit hooks)
ggshield secret scan pre-commit
```

For GitHub Actions (automated):
1. Go to https://dashboard.gitguardian.com/
2. Create a free account
3. Get your API key from Settings
4. Add to GitHub: Settings → Secrets → Actions → New secret
   - Name: `GITGUARDIAN_API_KEY`
   - Value: Your GitGuardian API key

### 3. Environment Variables Setup

**Development:**
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your real credentials
# NEVER commit .env.local to Git
```

**Production (Vercel):**
1. Go to Vercel Project Settings
2. Navigate to Environment Variables
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Add any other API keys here)

### 4. Verify Security Configuration

```bash
# Check .gitignore is working
git check-ignore .env.local
# Should output: .env.local

# Verify no secrets in repo
grep -r "fc-" --exclude-dir=node_modules --exclude-dir=.git .
# Should return nothing

# Check for committed .env files
find . -name ".env" -not -path "./node_modules/*" -not -path "./.git/*"
# Should return nothing
```

## What's Protected

### Files Automatically Ignored by Git

- `.env`, `.env.local`, `.env.*.local` - Environment files
- `*.key`, `*.pem` - Private keys and certificates
- `secrets/`, `credentials/` - Secret directories
- `.claude/`, `.playwright-mcp/` - Local tool directories

### Secrets Detected by GitGuardian

- API keys (AWS, Google, Stripe, etc.)
- Database credentials
- OAuth secrets
- Private keys
- JWT secrets
- And 350+ other secret types

## Development Workflow

### Before Committing Code

1. **Pre-commit hooks run automatically:**
   - Secrets scanning (GitGuardian)
   - Large file check (max 1MB)
   - JSON/YAML syntax validation
   - Private key detection
   - Trailing whitespace removal

2. **If secrets are detected:**
   ```
   ❌ GitGuardian detected secrets!
   
   [CRITICAL] Detected: Firecrawl API Key
   File: src/lib/api.ts
   Line: 42
   ```
   
   **Fix:** Remove the secret, use environment variable instead

3. **Manual scan (if needed):**
   ```bash
   ggshield secret scan pre-commit
   ```

### Adding New Environment Variables

1. **Add to `.env.example`** with placeholder:
   ```env
   NEW_API_KEY=your-api-key-here
   ```

2. **Add to `.env.local`** with real value:
   ```env
   NEW_API_KEY=fc-real-key-value-123456
   ```

3. **Use in code:**
   ```typescript
   const apiKey = process.env.NEW_API_KEY;
   if (!apiKey) {
     throw new Error('NEW_API_KEY is not configured');
   }
   ```

4. **Update production:** Add to Vercel environment variables

## CI/CD Security Checks

The GitHub Actions workflow (`.github/workflows/security.yml`) runs on:
- Every push to main/develop
- Every pull request
- Daily at 2 AM UTC

**Jobs:**
1. **GitGuardian Scan** - Detects secrets in code
2. **NPM Audit** - Checks for vulnerable dependencies
3. **CodeQL Analysis** - Static analysis for security issues
4. **Env File Check** - Ensures no .env files committed

## Emergency Response

If you accidentally commit a secret:

### Immediate Actions (< 1 hour)

```bash
# 1. Rotate the secret IMMEDIATELY
# Login to the service and revoke/regenerate the key

# 2. Remove from latest commit (if just committed)
git reset HEAD~1
# Edit files to remove secret
git add .
git commit -m "Remove sensitive data"

# 3. If already pushed, remove from history
# WARNING: This rewrites history and affects collaborators
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (coordinate with team first!)
git push origin --force --all
```

### Using BFG Repo-Cleaner (Easier)

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Create file with secrets to replace
echo "fc-exposed-key-123456" > secrets.txt

# Clean repository
java -jar bfg.jar --replace-text secrets.txt

# Review changes
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

## Testing

Run security tests:

```bash
# NPM audit
npm audit

# Pre-commit hooks
pre-commit run --all-files

# GitGuardian scan
ggshield secret scan repo .

# Check ignored files
git status --ignored
```

## Resources

- **GitGuardian Documentation**: https://docs.gitguardian.com/
- **Pre-commit Framework**: https://pre-commit.com/
- **GitHub Secrets Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **OWASP Security Guide**: https://owasp.org/www-project-top-ten/

## Support

For security questions or to report vulnerabilities:
- Email: raymond.baziwane@gmail.com
- DO NOT create public issues for security vulnerabilities

---

**Last Updated**: January 27, 2026  
**Status**: Active Incident - Awaiting API Key Rotation
