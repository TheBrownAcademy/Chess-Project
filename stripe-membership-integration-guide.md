# Adding Stripe Subscriptions to React + Railway + Supabase

## Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React     │─────▶│  Railway Backend  │─────▶│   Stripe    │
│  (Frontend) │◀─────│   (Node/Express)  │◀─────│             │
└─────────────┘      └──────────────────┘      └──────┬──────┘
                              │                         │
                              ▼                         │
                      ┌──────────────┐                  │
                      │   Supabase   │◀─── webhook ─────┘
                      │  (Postgres)  │      events
                      └──────────────┘
```

**Golden rule:** The frontend never talks to Stripe's secret API directly, and never decides whether a user is Premium. It only:
1. Asks the backend for a Checkout Session URL, and redirects to it.
2. Asks the backend for a Customer Portal URL, and redirects to it.
3. Reads `is_premium` (or similar) from Supabase, which is *only* written by your backend's webhook handler.

This is what makes the system secure — a user editing frontend state or calling your API directly cannot grant themselves Premium.

---

## Step 1 — Stripe Dashboard Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register), stay in **Test mode** while building.
2. Go to **Product catalog → Add product**. Create your "Premium Membership" product with a recurring **Price** (e.g. $9.99/month). Note the `price_id` (starts with `price_...`).
3. Go to **Developers → API keys**. Note:
   - `Publishable key` (`pk_test_...`) — safe for frontend
   - `Secret key` (`sk_test_...`) — backend only, never expose
4. Go to **Settings → Billing → Customer portal** and enable it. Configure what customers can do (cancel, switch plans, update payment method).
5. Go to **Developers → Webhooks → Add endpoint**. You'll fill in the URL once your Railway backend is deployed (e.g. `https://your-app.up.railway.app/webhook/stripe`). Select these events at minimum:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   
   Note the **Signing secret** (`whsec_...`) — you'll need it to verify webhook authenticity.

---

## Step 2 — Supabase Schema

Add subscription fields to your users table (or a linked `subscriptions` table — either works; a linked table is cleaner for future multi-product support).

```sql
-- Option A: extend an existing profiles table
alter table profiles
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text,
  add column subscription_status text default 'inactive', -- active, past_due, canceled, etc.
  add column is_premium boolean default false,
  add column current_period_end timestamptz;

-- Recommended: enable Row Level Security
alter table profiles enable row level security;

-- Users can read their own row
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- IMPORTANT: do NOT create an update policy that lets users write to
-- is_premium / subscription_status themselves. Only your backend
-- (using the Supabase service_role key, which bypasses RLS) should
-- write these fields.
```

This is the most important security detail: **no client-writable policy should ever touch `is_premium` or `subscription_status`.** Only the backend's webhook handler, authenticated with the Supabase `service_role` key, writes to these columns.

---

## Step 3 — Backend (Railway / Node + Express)

Install dependencies:

```bash
npm install stripe @supabase/supabase-js express cors dotenv
```

### 3a. Environment variables (set these in Railway's dashboard, never commit them)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service role, NOT anon key
FRONTEND_URL=https://your-app.com
```

### 3b. Supabase admin client (backend only)

```js
// supabaseAdmin.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

module.exports = supabaseAdmin;
```

### 3c. Create Checkout Session endpoint

The frontend calls this (with the logged-in user's auth token) to start a subscription purchase.

```js
// routes/createCheckoutSession.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = require('../supabaseAdmin');

app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  const user = req.user; // set by your auth middleware after verifying Supabase JWT

  try {
    // Reuse existing Stripe customer if we already have one
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }, // critical link for webhooks
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/membership/cancel`,
      metadata: { supabase_user_id: user.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create checkout session' });
  }
});
```

### 3d. Create Customer Portal Session endpoint

Lets users manage/cancel their subscription without you building any UI for it.

```js
app.post('/api/create-portal-session', requireAuth, async (req, res) => {
  const user = req.user;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return res.status(400).json({ error: 'No Stripe customer found' });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/account`,
  });

  res.json({ url: portalSession.url });
});
```

### 3e. Webhook handler — the most important part

This is the **single source of truth** for granting/revoking Premium access. Never grant access directly from the `success_url` redirect — a user could hit that URL manually without paying. Always wait for the webhook.

⚠️ **Critical implementation detail:** Stripe webhooks require the *raw* request body to verify the signature. If you use `express.json()` globally, it will break signature verification. Mount the raw parser only on this route, before any JSON body parser.

```js
// This must come BEFORE app.use(express.json()) in your server setup,
// or be excluded from it — Stripe needs the raw, unparsed body.
app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              is_premium: subscription.status === 'active',
              current_period_end: new Date(subscription.current_period_end * 1000),
            })
            .eq('stripe_customer_id', session.customer);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          // Handles renewals, plan changes, and "cancel at period end"
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              is_premium: subscription.status === 'active',
              current_period_end: new Date(subscription.current_period_end * 1000),
            })
            .eq('stripe_customer_id', subscription.customer);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          // Fires when subscription is actually terminated
          // (immediately on hard cancel, or at period end for scheduled cancels)
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              is_premium: false,
            })
            .eq('stripe_customer_id', subscription.customer);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer);
          // Optionally: don't revoke immediately — Stripe will retry payment
          // per your Dashboard's retry schedule (dunning) before final cancellation.
          break;
        }

        default:
          // Unhandled event types are fine to ignore
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Error handling webhook event:', err);
      res.status(500).send('Webhook handler failed');
    }
  }
);
```

**Why webhooks and not just the `success_url` redirect or polling?**
- Subscriptions renew monthly with no user visiting your site — only the webhook tells you it succeeded or failed.
- Cancellations happen via the Stripe Customer Portal, outside your app entirely — only the webhook tells you.
- Failed payments, disputes, and downgrades all happen asynchronously — webhooks are Stripe's only reliable notification mechanism.

### 3f. requireAuth middleware (verifying Supabase JWT on the backend)

```js
const { createClient } = require('@supabase/supabase-js');
const supabaseAuthClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });

  req.user = data.user;
  next();
}
```

---

## Step 4 — React Frontend

Install:

```bash
npm install @stripe/stripe-js
```

### 4a. Upgrade button → Checkout

```jsx
async function handleUpgrade() {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const { url } = await res.json();
  window.location.href = url; // Stripe-hosted Checkout page
}
```

### 4b. "Manage subscription" button → Customer Portal

```jsx
async function handleManageSubscription() {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${BACKEND_URL}/api/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const { url } = await res.json();
  window.location.href = url; // Stripe-hosted portal
}
```

### 4c. Reading Premium status

```jsx
function usePremiumStatus(userId) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()
      .then(({ data }) => setIsPremium(data?.is_premium ?? false));

    // Optional: subscribe to realtime changes so the UI updates
    // the moment the webhook flips is_premium (e.g. right after checkout)
    const channel = supabase
      .channel('profile-premium')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => setIsPremium(payload.new.is_premium)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return isPremium;
}
```

Because Checkout redirects the user back to your `success_url` *before* the webhook necessarily finishes processing, using Supabase Realtime (as above) — or briefly polling — avoids a flash of "not Premium" on the success page. Never grant access based on the redirect itself, only display a "processing your payment..." state until the DB flips.

---

## Step 5 — Enforce Premium Server-Side Too

Don't just hide UI elements — actually gate premium API routes/data on the backend, since a user could bypass frontend checks:

```js
async function requirePremium(req, res, next) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_premium) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  next();
}
```

You can also enforce this at the database layer with an RLS policy that checks `is_premium` on premium-only tables, which is even more robust since it holds even if you add new backend routes later.

---

## Step 6 — Testing Before Going Live

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward webhooks to your local dev server:
   ```bash
   stripe listen --forward-to localhost:4000/webhook/stripe
   ```
   This gives you a temporary `whsec_...` for local testing.
2. Use [Stripe's test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) to simulate successful payments, and `4000 0000 0000 0341` for failed payments.
3. Trigger events manually to test your handler logic:
   ```bash
   stripe trigger customer.subscription.deleted
   ```
4. Once confident, switch Stripe keys to **live mode**, redeploy your Railway webhook URL in the live-mode Dashboard webhook settings, and re-test end-to-end with a real (small) charge.

---

## Security Checklist

- [ ] `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` exist only in Railway's env vars — never in frontend code or git.
- [ ] Webhook route verifies `stripe-signature` using the raw body — reject anything that fails verification.
- [ ] No Supabase RLS policy allows the client to write `is_premium` / `subscription_status`.
- [ ] Premium-only backend routes/data check `is_premium` server-side, not just in the UI.
- [ ] Checkout/portal session creation requires a valid authenticated user (`requireAuth`).
- [ ] You handle `invoice.payment_failed` and `customer.subscription.deleted` — not just the "happy path" of successful checkout.
- [ ] Idempotency: webhook handlers are safe to run twice (Stripe can redeliver events) — using `.eq('stripe_customer_id', ...)` updates rather than inserts naturally handles this.

This flow (Checkout Session → webhook-driven DB update → Customer Portal for self-service management) is exactly what Stripe recommends for SaaS subscriptions, and is what most production apps use.
