This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

### Supabase (browser-safe, exposed via `NEXT_PUBLIC_*`)

Get these from your Supabase project dashboard at **Settings → API Keys**:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The browser-safe **Publishable** key (a JWT starting with `eyJ...`). This is what your frontend uses. **Do NOT use the `sb_secret_...` server key here** — it will not work in the browser. |

These are loaded automatically by Next.js from `.env.local`.

### AI Analysis (via Next.js proxy)

The frontend posts multipart/form-data to the Next.js proxy route at `/api/analyze-complaint`, which forwards the request to the FastAPI backend using `NEXT_PUBLIC_API_URL`. Using the proxy avoids CORS issues and keeps the backend URL server-side only.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public HTTPS base URL of the FastAPI backend. Required by the `/api/analyze-complaint` route handler. Not exposed to the browser. |

The FastAPI backend reads these server-only environment variables:

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key. **Never expose this to the browser.** Get one from https://aistudio.google.com/apikey |
| `AI_MODEL` | Model name. Default: `gemini-2.5-flash` (a current multimodal model with image input and structured JSON output). |

**Where to configure them:**

1. Local development — add to `civic-eye-backend/.env` (already documented in `civic-eye-backend/.env.example`).
2. Vercel / production — set them in your hosting provider's environment variable settings.

The `GEMINI_API_KEY` is read **only** inside `civic-eye-backend/app/services/ai_service.py` and is never sent to the browser or logged. It has no `NEXT_PUBLIC_` prefix and must remain server-side only.

If the key is missing, the backend returns `503` with the message: `AI provider is not configured.`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

When deploying, the FastAPI backend must also be deployed and reachable from the Next.js frontend. Set `NEXT_PUBLIC_API_URL` to the deployed backend's public HTTPS base URL. Set the `GEMINI_API_KEY` (and optional `AI_MODEL`) environment variables in your backend hosting environment so the `/analyze` route can reach Google Gemini.

**CORS:** The backend's `CORS_ORIGINS` should still include the frontend's origin for any direct access or health checks. The Next.js proxy (`/api/analyze-complaint`) avoids CORS for the main complaint flow by forwarding requests server-side.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

