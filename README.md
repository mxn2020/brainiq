# BrainIQ

[![CI](https://github.com/mxn2020/brainiq/actions/workflows/ci.yml/badge.svg)](https://github.com/mxn2020/brainiq/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-yellow.svg)](https://opensource.org/licenses/Apache-2.0)

AI-powered IQ trainer — multiple-choice questions across 5 categories (pattern, verbal, numerical, spatial, logic), timed IQ tests, scoring, and progress tracking.

## Tech Stack
- **Frontend**: Vite + React + TypeScript
- **Styling**: Vanilla CSS (dark theme design system)
- **UI Library**: @geenius-ui/react-css
- **Backend**: Convex (Serverless)
- **Auth**: Convex Auth (email/password)
- **Payments**: Stripe (subscriptions)
- **AI**: NVIDIA NIMs
- **Analytics**: Vercel Analytics

## Quick Start

```bash
cd web
pnpm install
npx convex dev        # Start Convex backend (in one terminal)
pnpm run dev          # Start Vite dev server (in another terminal)
```

## First-Time Setup

### 1. Convex Auth Keys
```bash
cd web
node generateKeys.mjs
```

### 2. NVIDIA AI
```bash
npx convex env set NVIDIA_API_KEY nvapi-xxxxx
```

### 3. Stripe
```bash
bash scripts/setup-stripe-products.sh
npx convex env set STRIPE_SECRET_KEY rk_live_xxxxx
npx convex env set STRIPE_WEBHOOK_SECRET whsec_xxxxx
```

## Folder Structure

```
web/
├── convex/           # Convex backend (schema, functions, actions)
├── src/
│   ├── components/   # Shared UI components
│   ├── pages/        # Route pages
│   ├── i18n/         # Internationalization
│   ├── App.tsx       # Router + routes
│   ├── main.tsx      # Entry point + providers
│   └── index.css     # Design system
├── scripts/          # Stripe & utility scripts
└── ...configs
```

---

> **License note:** As of 2026-10-23 this project is licensed under the Apache License 2.0 (previously MIT). Versions released before this change remain available under MIT to those who received them.
