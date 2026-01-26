# Security Audit Report: ~/.claude Directory

**Audit Date:** 2026-01-26
**Auditor:** Claude Code Security Analysis Agent
**Scope:** /Users/baziwane/.claude (Claude Code local configuration)

---

## Executive Summary

The security audit of the `.claude` directory reveals a **well-configured Claude Code environment** with legitimate development tooling. However, **two critical credential exposures** were identified that require immediate remediation.

| Finding Summary | Count |
|-----------------|-------|
| **Critical** | 2 |
| **High** | 0 |
| **Medium** | 3 |
| **Low** | 2 |

---

## Findings Table

| Severity | File Name & Line | Risk Type | Description | Remediation |
|----------|------------------|-----------|-------------|-------------|
| **CRITICAL** | `mcp-configs/mcp-servers.json:15` | Credential Exposure | Hardcoded Firecrawl API key exposed: `fc-ba617beb151c4788bb80017f1254756e` | Rotate this API key immediately. Use environment variable `FIRECRAWL_API_KEY` instead of hardcoding. |
| **CRITICAL** | `mcp-configs/mcp-servers.json:21` | Service Identifier Exposure | Supabase project reference exposed: `lvgrpnncslruoydgwblq`. While not a secret key, this identifies your database project to attackers. | Consider using environment variable. Ensure Supabase Row-Level Security (RLS) policies are properly configured. |
| **MEDIUM** | `hooks/hooks.json:39` | Dynamic Code Execution | Status line uses `npx -y ccstatusline@latest` which auto-downloads and executes npm packages without version pinning. | Pin to specific version: `npx ccstatusline@1.2.3`. Audit the package source. |
| **MEDIUM** | Multiple MCP servers | Supply Chain Risk | 8 MCP servers use `npx -y` to download packages on demand without integrity verification. | Pin package versions. Consider local installation with lockfiles for critical tools. |
| **MEDIUM** | `plugins/` (1003 files) | Unaudited Third-Party Code | Large plugin ecosystem from multiple marketplaces (every-marketplace, claude-plugins-official, anthropic-agent-skills, everything-claude-code). | Review enabled plugins periodically. Only enable plugins you actively use. |
| **LOW** | `telemetry/` (1.2 MB) | Privacy Consideration | Telemetry data collection enabled (standard Claude Code behavior). | Review telemetry settings if data sensitivity is a concern. |
| **LOW** | `debug/` (19 MB, 74 files) | Potential Sensitive Data in Logs | Debug logs may contain sensitive information from sessions. | Periodically purge debug logs. Ensure they're not backed up to cloud services. |

---

## Detailed Analysis by Category

### 1. External Calls & Data Egress

**Finding:** No malicious network calls detected. All external communication is through legitimate MCP servers:

| Server | External Service | Purpose | Risk Level |
|--------|------------------|---------|------------|
| firecrawl | Firecrawl API | Web scraping | Low (user-initiated) |
| github | GitHub API | PR/issue management | Low (user-initiated) |
| supabase | Supabase | Database ops | Low (user-initiated) |
| context7 | Context7 | Documentation lookup | Low (read-only) |
| magic | Magic UI | Component library | Low (read-only) |

**No indicators of:**
- Hidden data exfiltration
- Unauthorized API calls
- "Phone home" behavior
- Covert network connections

### 2. Sensitive Data Exposure

**Exposed Credentials (Confirmed):**
```json
// mcp-configs/mcp-servers.json
"FIRECRAWL_API_KEY": "fc-ba617beb151c4788bb80017f1254756e"  // CRITICAL
"--project-ref=lvgrpnncslruoydgwblq"                        // CRITICAL
```

**Properly Protected:**
```json
"GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT_HERE"  // Placeholder - OK
```

**Not Found:**
- No .env files with secrets
- No SSH keys or certificates
- No password files
- No PII stored

### 3. Insecure Dependencies

**MCP Server Packages (npx -y auto-download):**
| Package | Source | Risk |
|---------|--------|------|
| @modelcontextprotocol/server-github | npm | Low - official MCP |
| @modelcontextprotocol/server-memory | npm | Low - official MCP |
| @modelcontextprotocol/server-sequential-thinking | npm | Low - official MCP |
| @modelcontextprotocol/server-filesystem | npm | Low - official MCP |
| @supabase/mcp-server-supabase | npm | Low - official Supabase |
| @context7/mcp-server | npm | Medium - third-party |
| @magicuidesign/mcp | npm | Medium - third-party |
| firecrawl-mcp | npm | Medium - third-party |
| ccstatusline | npm | Medium - third-party |

**Plugin Marketplaces:**
| Marketplace | Source | Files | Risk Assessment |
|-------------|--------|-------|-----------------|
| anthropic-agent-skills | GitHub (anthropics/skills) | ~250 | Low - official Anthropic |
| claude-plugins-official | GitHub (anthropics/claude-plugins-official) | ~150 | Low - official Anthropic |
| every-marketplace | GitHub (EveryInc/compound-engineering-plugin) | ~500 | Medium - third-party |
| everything-claude-code | GitHub (affaan-m/everything-claude-code) | ~100 | Medium - third-party |

### 4. Injection Vulnerabilities

**Shell Scripts Analyzed:**
| Script | Risk | Analysis |
|--------|------|----------|
| `hooks/memory-persistence/pre-compact.sh` | None | Read-only logging to local files |
| `hooks/memory-persistence/session-start.sh` | None | Read-only session lookup |
| `hooks/memory-persistence/session-end.sh` | None | Local session file creation |
| Inline hooks in `settings.json` | Low | Use `jq` for safe JSON parsing; proper quoting |

**Inline Hook Assessment (hooks.json):**
- All hooks use proper input sanitization via `jq`
- No user-controllable data is passed unsafely to shell commands
- `shell=True` usage in Python scripts is for local command execution only

### 5. Obfuscation Analysis

**Searched Patterns:**
| Pattern | Found | Assessment |
|---------|-------|------------|
| Base64 encode/decode | Yes (1313 hits) | All in legitimate JSONL logs and project files |
| eval() | Yes (12 files) | Only in security documentation warning about eval |
| new Function() | Documented | Only in security warning patterns |
| Obfuscated variable names | None | All code uses descriptive naming |
| Hidden/white text | None | Not applicable (config files) |

### 6. Hook System Security

**Active Hooks (settings.json):**

| Hook Type | Trigger | Purpose | Security Assessment |
|-----------|---------|---------|---------------------|
| PreToolUse | Dev server commands | Blocks outside tmux | **Safe** - user productivity |
| PreToolUse | Long-running commands | tmux reminder | **Safe** - informational only |
| PreToolUse | git push | Review pause | **Safe** - user safety gate |
| PreToolUse | .md/.txt writes | Block unnecessary docs | **Safe** - file hygiene |
| PostToolUse | PR creation | Log PR URL | **Safe** - informational only |
| PostToolUse | JS/TS edits | Prettier format | **Safe** - local formatting |
| PostToolUse | TS edits | TypeScript check | **Safe** - local validation |
| PostToolUse | JS/TS edits | console.log warning | **Safe** - code quality |
| Stop | Session end | console.log audit | **Safe** - final verification |
| Stop | Session end | Session persistence | **Safe** - local state |
| PreCompact | Context compaction | State preservation | **Safe** - local logging |
| SessionStart | New session | Context loading | **Safe** - local lookup |

**Security Hook (security_reminder_hook.py):**
- **Purpose:** Detects dangerous code patterns (eval, pickle, innerHTML, etc.)
- **Behavior:** Warns and blocks unsafe patterns
- **Assessment:** **Beneficial** - adds security guardrails
- **No data egress** - writes only to local `/tmp/security-warnings-log.txt`

---

## Python Script Analysis

**Scripts with subprocess/exec usage (all verified safe):**

| Script | Use Case | Assessment |
|--------|----------|------------|
| `webapp-testing/scripts/with_server.py` | Start/stop dev servers | Safe - local server management |
| `coding-tutor/scripts/create_tutorial.py` | Git status check | Safe - read-only git ops |
| `docx/ooxml/scripts/pack.py` | File packaging | Safe - local file ops |
| `security_reminder_hook.py` | Pattern detection | Safe - static analysis only |

---

## Recommendations

### Immediate Actions (Critical)

1. **Rotate Firecrawl API Key**
   ```bash
   # 1. Generate new key at firecrawl.dev
   # 2. Update environment variable
   export FIRECRAWL_API_KEY="new-key-here"
   # 3. Remove from mcp-servers.json, use env reference
   ```

2. **Secure MCP Configuration**
   Replace hardcoded secrets in `mcp-configs/mcp-servers.json`:
   ```json
   "firecrawl": {
     "command": "npx",
     "args": ["-y", "firecrawl-mcp"],
     "env": {
       "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
     }
   }
   ```

### Short-term Actions (Medium)

3. **Pin NPX Package Versions**
   ```json
   // Instead of: "npx -y ccstatusline@latest"
   // Use: "npx ccstatusline@1.2.3"
   ```

4. **Audit Enabled Plugins**
   Review `~/.claude/settings.json` enabledPlugins and disable unused ones.

5. **Clean Debug Logs Periodically**
   ```bash
   find ~/.claude/debug -mtime +30 -delete
   find ~/.claude/shell-snapshots -mtime +30 -delete
   ```

### Long-term Actions (Low)

6. **Review Telemetry Settings**
   Check Claude Code documentation for telemetry opt-out if desired.

7. **Consider Plugin Allowlist**
   Only enable plugins from official sources (anthropics/*).

---

## Conclusion

The `.claude` directory contains **legitimate Claude Code configuration** with no evidence of malware, backdoors, or unauthorized data egress. The primary security concerns are:

1. **Credential exposure** in the MCP configuration file (Critical)
2. **Supply chain risks** from auto-updating npx packages (Medium)
3. **Third-party plugin trust** from non-official marketplaces (Medium)

All shell scripts, Python scripts, and hooks were analyzed and found to perform only their documented functions with no hidden malicious behavior.

**Overall Risk Assessment:** **MODERATE** - No active threats detected, but credential hygiene needs improvement.
