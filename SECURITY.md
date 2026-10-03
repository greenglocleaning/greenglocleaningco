# Security Policy

## 🔐 API Key Management

### Critical Security Issues Found
- ⚠️ **config.json contains public API keys** - While these are technically "public" keys, sensitive configuration should be managed through environment variables

### How to Secure Your Keys

#### 1. **Stop Committing config.json**
Never commit sensitive credentials. Use this instead:

**Option A: Environment Variables (Recommended)**
```javascript
// Load from environment instead of JSON file
const config = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  }
};
```

**Option B: .env.local (Development Only)**
```bash
cp .env.example .env.local
# Edit .env.local with your actual keys
# .env.local is in .gitignore and won't be committed
```

#### 2. **Stripe Secret Key Protection**
- ✅ Already secure: Secret key (`sk_live_*`) is only in Cloudflare Worker
- ✅ Never expose it in browser code or config files
- ⚠️ If exposed, immediately rotate at: https://dashboard.stripe.com/apikeys

#### 3. **GitHub Secrets for CI/CD**
If you add automated deployments, use GitHub Secrets:

```yaml
# .github/workflows/deploy.yml
env:
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

### 4. **Cloudflare Worker Security**
- ✅ Secret key stored server-side (safe)
- ✅ CORS validation prevents unauthorized origin access
- ⚠️ Keep Cloudflare Worker URL private
- ⚠️ Don't share `.env` files via email/Slack

---

## 🛡️ Recommended Actions

### Immediate (Today)
- [ ] Rotate all API keys that have been exposed
- [ ] Store new keys in `.env.local` only
- [ ] Move config.json to `.env.example` template
- [ ] Delete old commits with exposed keys (see below)

### Short Term (This Week)
- [ ] Enable 2FA on GitHub, Stripe, Supabase
- [ ] Review GitHub repository access permissions
- [ ] Add branch protection rules to main branch
- [ ] Set up Dependabot for security updates

### Long Term (This Month)
- [ ] Implement GitHub Actions for automated testing
- [ ] Add security scanning tools
- [ ] Set up Stripe webhook signatures
- [ ] Enable Supabase Row Level Security (RLS)

---

## 🔄 How to Remove Exposed Keys from Git History

If you've accidentally committed keys, remove them from history:

```bash
# Install BFG Repo-Cleaner
# macOS
brew install bfg

# Then clean history
bfg --replace-text passwords.txt

# Force push to remote
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --mirror --force
```

**Then rotate all exposed keys immediately!**

---

## 📋 API Key Rotation Schedule

| Key | Rotation | Location | Emergency? |
|-----|----------|----------|-----------|
| Stripe Public Key | Every 90 days | config.json | Low |
| Stripe Secret Key | Every 60 days | Cloudflare Worker | High |
| Supabase Keys | Every 90 days | .env.local | Medium |
| Cloudflare Token | Every 6 months | Cloudflare Dashboard | Medium |

---

## 🚨 Security Checklist

- [ ] No `.env` files committed to repository
- [ ] No API keys in HTML or JavaScript files
- [ ] `.gitignore` properly configured
- [ ] Stripe secret key only in Cloudflare Worker (not browser)
- [ ] CORS properly configured on worker
- [ ] GitHub branch protection enabled
- [ ] 2FA enabled on all accounts
- [ ] Sensitive data never logged to console
- [ ] HTTPS enforced on all pages
- [ ] Content Security Policy (CSP) headers set

---

## 🔗 Important Links

- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/database/postgres/security)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Managing Keys and Credentials](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure)

---

## 📞 Report Security Issues

If you discover a security vulnerability, please email: **security@greenglocleaningco.com**

Do not open a public issue. We will investigate promptly and provide fixes.

---

**Last Updated**: October 2026
