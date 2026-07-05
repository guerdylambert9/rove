# Rové

A private peer-to-peer car rental app — starter scaffold in the **Harbor Trust** theme.

Built with **React + Vite + React Router**. Mobile-first: the app renders in a
phone-width shell centered on desktop, so it looks right on a phone and is easy to
work on at a laptop.

## What's inside

Six working screens wired into a real booking flow:

| Screen | Route | File |
| --- | --- | --- |
| Browse | `/` | `src/pages/Browse.jsx` |
| Car detail | `/car/:id` | `src/pages/CarDetail.jsx` |
| Insurance | `/insurance` | `src/pages/Insurance.jsx` |
| Checkout | `/checkout` | `src/pages/Checkout.jsx` |
| Confirmed | `/confirmed` | `src/pages/Confirmed.jsx` |
| Owner dashboard | `/dashboard` | `src/pages/Dashboard.jsx` |

Booking state lives in `src/state/booking.jsx`. Fleet data is static in
`src/data/cars.js` — swap it for an API call when you add a backend.

### A deliberate design choice on insurance

The insurance screen does **not** ship a bare "tap a link" flow. To continue, a
renter must upload proof of coverage **and** tick an explicit acknowledgment that
names Rové as *not the insurer* and accepts liability for any gap. That's a
starting hedge against the coverage-gap risk, not legal cover. **Have a Florida
insurance broker and an attorney review the arrangement before you launch.**

## Run it locally

Requires **Node.js 18+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other commands:

```bash
npm run build     # production build to /dist
npm run preview   # serve the production build locally
```

## Push it to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Rové Harbor Trust scaffold"
git branch -M main
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<your-username>/rove.git
git push -u origin main
```

`node_modules` and `dist` are already git-ignored.

## Where to go next

- Swap static `cars.js` for a real backend (bookings, users, availability).
- Add auth and a renter identity/verification step before checkout.
- Wire payments through a provider (do **not** handle raw card data yourself).
- Turn the insurance upload into real storage + a verification workflow.
- Re-theme by editing the palette tokens at the top of `src/index.css`.

## Tech

React 18 · Vite 5 · React Router 6. No CSS framework — plain CSS with theme tokens
in `src/index.css`.
