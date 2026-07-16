# CleanGlide Pro Mop — Store

A lightweight, single-page store. No framework, no build step — plain HTML/CSS/JS
plus one tiny serverless function that emails you every order. Deploys to Vercel
straight from GitHub.

## What's included

- `index.html`, `style.css`, `script.js` — the whole storefront (gallery, Buy Now
  modal, address + payment form, animated order-success screen with a chime).
- `images/` — 5 placeholder product photos. **Replace these before launch.**
- `api/send-order.js` — Vercel serverless function that emails the order + full
  customer details to you via [Resend](https://resend.com), and a confirmation
  email to the customer if they gave one.

Total page weight is a few hundred KB (mostly the 5 photos) — no JS framework,
no analytics, no bloat.

## 1. Replace the product photos

Drop your own photos into `images/`, keeping the same filenames
(`photo-1.jpg` … `photo-5.jpg`), or update the `src` / `data-src` attributes in
`index.html` to whatever filenames you use. Using fewer than 5 photos? Just
delete the extra `<button class="thumb">…</button>` blocks in the gallery.

## 2. Set up Resend (order emails)

1. Create a free account at [resend.com](https://resend.com) and grab an API key.
2. For quick testing you can send from `onboarding@resend.dev`. For production,
   verify your own domain in Resend and use an address on it (e.g.
   `orders@yourdomain.com`).
3. Copy `.env.example` to `.env` locally and fill in the values (only needed if
   you run `vercel dev` locally — see below).

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "CleanGlide mop store"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: **Other** (it's static + one API function — no build step needed).
3. Add environment variables under **Settings → Environment Variables**:
   - `RESEND_API_KEY`
   - `TO_EMAIL` — the inbox that should receive new orders
   - `FROM_EMAIL` — your verified Resend sender (or `onboarding@resend.dev` for testing)
4. Deploy. Every push to `main` will auto-redeploy.

## Testing locally (optional)

```bash
npm install -g vercel   # once
npm install
vercel dev
```

This runs both the static site and the `/api/send-order` function locally.

## Adding Razorpay later

Everything is already wired with clear `RAZORPAY SPACE` comments in
`index.html` and `script.js`:

1. Add the checkout script tag to `<head>` in `index.html`:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
2. In `script.js`, inside the form submit handler, replace the `openUpiApp(...)`
   call with a real Razorpay Checkout call (a ready-made `options` object is
   already sketched out in the comment above `#orderForm` in `index.html`).
3. Only call `submitOrder(...)` once Razorpay's `handler` callback confirms
   payment succeeded.
4. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` as environment variables if
   you verify payments server-side.

Until then, selecting **UPI** at checkout opens the customer's UPI app directly
via a `upi://pay` deep link (works on mobile, no gateway needed) — just set your
real UPI ID in `UPI_VPA` at the top of `script.js`.

## Adding Meta Pixel later

Uncomment the Meta Pixel snippet at the top of `<head>` in `index.html` and
paste in your Pixel ID. Two event calls are already placed and commented for
you to uncomment once the base pixel is live:

- `InitiateCheckout` — fires when the Buy Now modal opens (`script.js`, `openModal()`)
- `Purchase` — fires on order success (`script.js`, `showSuccess()`)

## Customizing price / delivery window

Both live at the top of `script.js`:

```js
const PRODUCT = { name: "CleanGlide Pro Spin Mop", price: 899 };
const DELIVERY_MIN_DAYS = 4;
const DELIVERY_MAX_DAYS = 6;
```

Update the price shown in `index.html` (`.price`, `.price-old`, the Buy Now
button label) to match if you change it.
