# Stripe Webhook Tunneling & Testing Runbook

This manual details how to test real-time Stripe payment webhooks locally and in production for **MarkdownTableIO**.

---

## 🛠️ Local Webhook Tunneling Setup (Stripe CLI)

### 1. Install the Stripe CLI
- **macOS (Homebrew):** `brew install stripe/stripe-cli/stripe`
- **Windows (Scoop):** `scoop install stripe`
- **Windows (Chocolatey):** `choco install stripe-cli`
- **Linux:** Download binary from [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases).

### 2. Authenticate the CLI
In your terminal, run:
```bash
stripe login
```
Follow the browser link to grant test-mode permissions to your CLI instance.

---

## 📡 3. Start Local Webhook Tunnel

Run the following command to tunnel Stripe webhooks directly to your local Next.js server:

```bash
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/webhooks/stripe
```

Upon launching, the CLI will output your local webhook signing secret:
```text
Ready! Your webhook signing secret is whsec_1234567890abcdef1234567890abcdef (^C to quit)
```

Copy the printed `whsec_...` key and set it inside your `.env.local` file:
```ini
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef
```

---

## ⚡ 4. Trigger Synthetic Test Events

In a **separate terminal window**, fire a synthetic `checkout.session.completed` event to test backend database updates:

```bash
stripe trigger checkout.session.completed
```

### Verification Steps:
1. **Terminal Log**: Check the `stripe listen` terminal window. You should see a `200 OK` response from `/api/webhooks/stripe`.
2. **Supabase Database**: Check the `profiles` table in Supabase Dashboard. The user profile should show:
   - `is_premium = true`
   - `updated_at` set to current timestamp.

---

## 🌐 5. Production Webhook Setup (Stripe Dashboard)

When deploying live to Vercel:

1. Go to **Stripe Dashboard** -> **Developers** -> **Webhooks**.
2. Click **Add Endpoint**.
3. Set **Endpoint URL** to:
   `https://markdowntableio.vercel.app/api/webhooks/stripe`
4. Under **Select events to listen to**, select:
   - `checkout.session.completed`
5. Click **Add Endpoint**.
6. Reveal the **Signing Secret** (`whsec_...`) and copy it into your Vercel Environment Variables as `STRIPE_WEBHOOK_SECRET`.
