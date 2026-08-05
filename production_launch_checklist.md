# Production Deployment & Launch Sync Checklist - MarkdownTableIO

This checklist outlines the exact step-by-step procedure to merge, push, and deploy **MarkdownTableIO** to Vercel, Supabase, and Stripe.

---

## 🔀 Step 1: Git Branch Consolidation & Clean Build Check

1. **Verify Current Working Branch**:
   ```bash
   git branch
   # Output should confirm: * feature/file-upload
   ```

2. **Run Local Build Validation**:
   ```bash
   npm run build
   ```
   *Ensure exit code is 0 and Turbopack completes with zero errors.*

3. **Merge `feature/file-upload` into `main`**:
   ```bash
   git checkout main || git checkout -b main
   git merge feature/file-upload
   ```

---

## 🐙 Step 2: Push Workspace to GitHub

1. **Create GitHub Repository**:
   - Go to [https://github.com/new](https://github.com/new).
   - Name repository: `markdowntableio`.
   - Keep visibility Public or Private.

2. **Add Remote & Push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/markdowntableio.git
   git branch -M main
   git push -u origin main
   ```

---

## 🗄️ Step 3: Execute Supabase Database Migration

1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Open your project -> **SQL Editor**.
3. Copy the contents of [`supabase/migration.sql`](file:///d:/SaaS%20Tool/supabase/migration.sql).
4. Click **Run** to execute the script:
   - Provisions `profiles` table.
   - Enables Row Level Security (RLS).
   - Creates the `on_auth_user_created` trigger.

---

## ⚡ Step 4: Deploy Next.js App to Vercel

1. Log in to [https://vercel.com/new](https://vercel.com/new).
2. Import the `markdowntableio` GitHub repository.
3. Under **Framework Preset**, select **Next.js**.
4. Under **Environment Variables**, add all values specified in [`production_env_guide.md`](file:///d:/SaaS%20Tool/production_env_guide.md):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://markdowntableio.vercel.app`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. Click **Deploy**.

---

## 💳 Step 5: Configure Stripe Production Webhook

1. Go to **Stripe Dashboard** -> **Developers** -> **Webhooks**.
2. Add Endpoint: `https://markdowntableio.vercel.app/api/webhooks/stripe`.
3. Event: `checkout.session.completed`.
4. Copy the webhook secret (`whsec_...`) into Vercel Environment Variables (`STRIPE_WEBHOOK_SECRET`).

---

## ✅ Step 6: Post-Deployment Verification Protocol

- [ ] **Homepage Load:** Verify `https://markdowntableio.vercel.app` renders cleanly in dark theme.
- [ ] **CSV / JSON / Excel Conversion:** Test copying CSV text, pasting JSON array, and uploading an `.xlsx` file.
- [ ] **Row Guard Check:** Input >10 rows on Free tier -> Verify upgrade banner & modal trigger.
- [ ] **Supabase Auth:** Test magic link sign-in.
- [ ] **Stripe Checkout:** Trigger checkout -> Verify redirection to Stripe Hosted Checkout page.
- [ ] **Webhook Update:** Complete test transaction -> Verify `profiles.is_premium` flips to `true` in Supabase.
