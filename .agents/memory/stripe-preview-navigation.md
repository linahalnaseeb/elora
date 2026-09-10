---
name: Stripe preview navigation
description: External Stripe Checkout redirects need an explicit user-clicked link in the preview iframe.
---

Use a normal anchor targeting the top browsing context for hosted Stripe Checkout, and keep it visible after the API returns the session URL. Background `window.location` redirects can be blocked or appear to do nothing inside the Replit preview iframe.

**Why:** The checkout API can return HTTP 200 with a valid `checkout.stripe.com` URL while the preview iframe still prevents the asynchronous cross-origin navigation.

**How to apply:** After creating a Checkout Session, render a prominent `href={session.url}` control with `target="_top"` instead of relying only on `window.location.assign()` or `window.location.href`.