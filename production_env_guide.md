# Production Environment Variables Guide - MarkdownTableIO

This guide provides the complete environment variable specification for deploying **MarkdownTableIO** to Vercel with Supabase Free Tier and Stripe Checkout Hosted Pages.

---

## 🔐 Environment Variable Reference Matrix

### 🌐 Public Environment Variables (Browser-Exposed)
These variables carry the `NEXT_PUBLIC_` prefix and are bundled into the client-side JavaScript output. They **MUST NOT** contain secret API tokens.

| Variable Name | Description | Example / Mock Value | Production Source |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API endpoint for your Supabase PostgreSQL project. | `https://xyzprojectid.supabase.co` | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side database queries and Auth. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SITE_URL` | Public production URL of your application (used for OAuth & Stripe redirects). | `https://markdowntableio.vercel.app` | Vercel Dashboard / Custom Domain |

---

### 🛡️ Secret Environment Variables (Server-Only)
These variables are processed strictly in serverless API routes (`/api/checkout` and `/api/webhooks/stripe`). They **MUST NEVER** be prefixed with `NEXT_PUBLIC_`.

| Variable Name | Description | Example / Mock Value | Production Source |
| :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key that bypasses RLS policies to update user profiles on payment. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role...` | Supabase Dashboard -> Project Settings -> API (service_role secret) |
| `STRIPE_SECRET_KEY` | Secret API key for creating Checkout sessions. | `sk_live_51...` (or `sk_test_...`) | Stripe Dashboard -> Developers -> API Keys |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to verify incoming Stripe webhook signatures. | `whsec_1234567890abcdef...` | Stripe Dashboard -> Developers -> Webhooks (or Stripe CLI for dev) |

---

## 🛠️ Step-by-Step Vercel Configuration Instructions

1. **Log in to Vercel**: Navigate to [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. **Select Project**: Select **MarkdownTableIO**.
3. **Navigate to Settings**: Click **Settings** in the top navigation bar, then select **Environment Variables**.
4. **Add Variables**: Enter each key-value pair from the matrix above. Select **Production**, **Preview**, and **Development** environments as appropriate.
5. **Redeploy**: If variables are updated after initial build, trigger a new deployment in Vercel (**Deployments** -> **Redeploy**) to inject updated environment variables into the static bundle.

---

## 🧪 Local `.env.local` Validation Template

Copy the template below into your local `.env.local` file for testing:

```ini
# Client-Side Public Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-Side Secrets
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_service_role_key
STRIPE_SECRET_KEY=sk_test_51SampleStripeSecretKey
STRIPE_WEBHOOK_SECRET=whsec_SampleWebhookSecret
```
