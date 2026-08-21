# Project Polaris — Authentication Access

## Production access

The live platform does **not** publish a shared default password. Create a personal account from `/auth`, sign in with the configured Google button, or request a password reset using the **Forgot password?** link.

Password-reset links are single-use, expire after one hour, and are delivered through the configured reset-email provider. The system returns the same acknowledgement whether or not an email address exists, preventing account-discovery attacks.

## Development-only demo account

For local development and automated browser validation only, the server provisions this Explorer account when `NODE_ENV` is not `production`:

| Field | Value |
|---|---|
| Email | `demo@projectpolaris.local` |
| Password | `PolarisDemo!2026` |
| Access | Explorer |

The demo credentials endpoint returns `null` in production, and the account is never seeded by the production server. Do not reuse this password for a real account.

## Required production configuration

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Server-side password-reset email delivery |
| `RESET_EMAIL_FROM` | Verified sender identity for reset messages |
| `POLARIS_ALLOWED_ORIGINS` | Comma-separated exact HTTPS origins allowed to receive reset links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Configured Google OAuth integration |

After every production deployment, confirm the live domain remains registered as an authorized Google OAuth callback origin and perform one real Google consent login.
