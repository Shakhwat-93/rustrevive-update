# AUTH_SETUP_REQUIRED.md
## Rust & Revive — Phase 12: External Auth Configuration

This document lists all external configuration required to fully activate the
Phase 12 customer authentication system. These steps must be completed in your
**Self-Hosted Supabase Dashboard** and with third-party OAuth providers.

> [!IMPORTANT]
> The application code is production-ready. These are **external configuration steps only**.
> No code changes are required after completing the steps below.

---

## 1. SUPABASE AUTH — SITE URL & REDIRECT URLS

In your **Self-Hosted Supabase Dashboard** → Authentication → URL Configuration:

| Setting | Value |
|---|---|
| **Site URL** | `https://rustrevive.store` |
| **Redirect URLs (allowed list)** | `https://rustrevive.store/auth/callback` |
| | `https://rustrevive.store/forgot-password?mode=reset` |

> [!WARNING]
> Without these, email verification links and OAuth redirects will fail.
> Your Supabase instance is at: `http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io`

---

## 2. EMAIL VERIFICATION — SMTP CONFIGURATION

In Supabase Dashboard → Authentication → Email:

| Setting | Value |
|---|---|
| Enable Email Signup | ✅ ON |
| Confirm email | ✅ ON (requires email verification before login) |
| Secure email change | ✅ ON |
| Mailer OTP Expiry | `3600` (1 hour) |

### SMTP Provider Options (choose one):

**Option A — Resend (Recommended)**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_xxxxxxxxxxxxxxxx  (your Resend API key)
Sender Email: noreply@rustrevive.store
Sender Name: Rust & Revive
```
Set up at: https://resend.com — add `rustrevive.store` domain (requires DNS TXT record)

**Option B — Brevo (formerly Sendinblue)**
```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP User: your@email.com
SMTP Pass: your-brevo-smtp-key
Sender Email: noreply@rustrevive.store
Sender Name: Rust & Revive
```

**Option C — SendGrid**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: SG.xxxxxxxxxxxxxxxxxx
Sender Email: noreply@rustrevive.store
Sender Name: Rust & Revive
```

---

## 3. GOOGLE OAUTH SETUP

### Step 1 — Google Cloud Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Application type: **Web application**
5. Name: `Rust & Revive Production`

### Step 2 — Authorized Redirect URIs
Add exactly:
```
http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io/auth/v1/callback
```

### Step 3 — OAuth Consent Screen
- App name: `Rust & Revive`
- User support email: your admin email
- Authorized domain: `rustrevive.store`
- Privacy Policy URL: `https://rustrevive.store/privacy`
- Publish the app (set to Production, not Testing)

### Step 4 — Configure in Supabase
Supabase Dashboard → Authentication → Providers → Google:
```
Client ID:     paste from Google Cloud Console
Client Secret: paste from Google Cloud Console
```

### Environment Variables (already set in .env.local — no changes needed)
The app uses the Supabase anon key to trigger Google OAuth via Supabase's OAuth flow. No additional env vars needed.

---

## 4. FACEBOOK OAUTH SETUP

### Step 1 — Facebook Developers
1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"** → **"Consumer"**
3. App name: `Rust & Revive`
4. Contact email: your admin email

### Step 2 — Facebook Login Product
1. Click **"Add Product"** → **"Facebook Login"** → Set Up (Web)
2. Site URL: `https://rustrevive.store`

### Step 3 — Valid OAuth Redirect URIs
In Facebook Login → Settings → Valid OAuth Redirect URIs, add:
```
http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io/auth/v1/callback
```

### Step 4 — App Review
- Go to **App Review** → Make the app **Public** (Live mode)
- Request permission: `email` and `public_profile`

### Step 5 — Configure in Supabase
Supabase Dashboard → Authentication → Providers → Facebook:
```
App ID:     paste from Facebook App Dashboard
App Secret: paste from Facebook App Dashboard
```

---

## 5. EMAIL TEMPLATES (Supabase Dashboard)

Go to Authentication → Email Templates and update the following templates to match the Rust & Revive brand:

### Confirm signup
```html
<h2>Welcome to Rust & Revive</h2>
<p>Please verify your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>This link expires in 1 hour.</p>
```

### Reset Password
```html
<h2>Reset Your Password</h2>
<p>Click below to reset your Rust & Revive password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
```

---

## 6. VERIFICATION CHECKLIST

After completing all setup, test each flow:

| Flow | Test Steps | Expected |
|---|---|---|
| Email Registration | Register → check inbox → click verify link | Redirected to `/account` |
| Email Login | Login with verified credentials | Redirected to `/account` |
| Forgot Password | Enter email → click link in email → set new password | Password updated |
| Google Login | Click "Google" on `/login` → authorize | Redirected to `/account` |
| Facebook Login | Click "Facebook" on `/login` → authorize | Redirected to `/account` |
| Guest Checkout | Browse → Add to cart → Checkout without login | Order placed (customer_id = NULL) |
| Account Protected | Visit `/account` when logged out | Redirected to `/login?redirect=/account` |
| Auth Route Redirect | Visit `/login` when logged in | Redirected to `/account` |

---

## 7. CURRENT STATUS

| Feature | Code Status | Config Required |
|---|---|---|
| Email Signup | ✅ Complete | SMTP setup |
| Email Verification | ✅ Complete | SMTP setup + Site URL |
| Email Login | ✅ Complete | — |
| Forgot Password | ✅ Complete | SMTP setup |
| Reset Password | ✅ Complete | SMTP + Redirect URL |
| Google Login | ✅ Complete | Google OAuth credentials |
| Facebook Login | ✅ Complete | Facebook App credentials |
| Guest Checkout | ✅ Preserved — unaffected | — |
| Account Dashboard | ✅ Complete | — |
| Order History | ✅ Complete | — |
| Saved Addresses | ✅ Complete | — |
| Profile Edit | ✅ Complete | — |
| Security (Change PW) | ✅ Complete | — |
| Wishlist | ✅ Complete | — |
| profiles table | ✅ Migrated to production DB | — |
| Auth trigger | ✅ Active in production DB | — |
| Customer RLS | ✅ Active in production DB | — |
| Session Protection | ✅ Active in middleware | — |
