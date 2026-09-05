import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side proxy for the CivicEye FastAPI /analyze endpoint.
 *
 * Why this exists:
 *   The frontend runs in the browser and the FastAPI backend listens on a
 *   configurable URL (via `NEXT_PUBLIC_API_URL`). Calling the backend
 *   directly from the browser can fail with "Load failed" / "Failed to
 *   fetch" whenever the page is opened at an origin not on the backend
 *   CORS allow-list (e.g. 192.168.x.x:3000, https://, or when the
 *   browser's Private Network Access policy blocks the cross-origin
 *   request).
 *
 *   Proxying through a same-origin Next.js Route Handler avoids all of
 *   that: the browser only ever talks to the Next.js server, which
 *   forwards the multipart request to the FastAPI backend over the
 *   server-side loopback. The Gemini API key stays backend-only on the
 *   FastAPI side and is never exposed to the browser.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow uploads up to 10 MB through the Next.js proxy so the browser
// does not reject the multipart body before it reaches this handler.
export const maxBodySize = 10 * 1024 * 1024;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!BACKEND_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. The /api/analyze-complaint route handler requires it to forward requests to the FastAPI backend."
  );
}

const UPSTREAM_TIMEOUT_MS = 95_000;

function asString(v: FormDataEntryValue | null): string {
  if (v === null || typeof v === "string") return v ?? "";
  return "";
}

function asNumber(v: FormDataEntryValue | null): number | null {
  const s = asString(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get("content-length");
  const contentType = request.headers.get("content-type") || "";
  console.info(
    `[CivicEye] /api/analyze-complaint received: content-length=%s type=%s`,
    contentLength,
    contentType
  );

  let inbound: FormData;
  try {
    inbound = await request.formData();
  } catch (err) {
    console.error("[CivicEye] /api/analyze-complaint formData parse error:", err);
    return Response.json(
      {
        detail: `Could not parse multipart request body: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 400 }
    );
  }

  const videoEntry = inbound.get("video");
  if (videoEntry && typeof videoEntry !== "string") {
    const vSize = (videoEntry as File).size;
    console.info(
      `[CivicEye] /api/analyze-complaint video file: name=%s type=%s size=%sMB`,
      (videoEntry as File).name,
      (videoEntry as File).type,
      (vSize / 1024 / 1024).toFixed(2)
    );
  }

  // If we get here, the body was parsed successfully. The 413 (if any)
  // would have come from an upstream proxy (Cloudflare Tunnel, Vercel,
  // etc.) before reaching this handler. We surface a clear error so the
  // frontend can tell the user which layer rejected the request.
  const totalSize = inbound.get("video") instanceof File
    ? (inbound.get("video") as File).size
    : 0;
  console.info(
    `[CivicEye] /api/analyze-complaint parsed successfully, forwarding to upstream. Total form size≈%sMB`,
    (totalSize / 1024 / 1024).toFixed(2)
  );

  const description = asString(inbound.get("description"));
  const category = asString(inbound.get("category")) || "other";
  const latitude = asNumber(inbound.get("latitude"));
  const longitude = asNumber(inbound.get("longitude"));
  const locationName = asString(inbound.get("location_name"));
  const imageEntry = inbound.get("image");

  if (!videoEntry && !imageEntry) {
    return Response.json(
      {
        detail:
          "Evidence required. Provide a short video (preferred) or a photo.",
      },
      { status: 400 }
    );
  }

  // Read the logged-in Supabase session via the SSR helper so we
  // forward the right access token to the backend. The backend uses
  // it to run duplicate detection under the user's RLS-restricted
  // view of the complaints table.
  let accessToken: string | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            /* no-op; route handlers don't refresh the session */
          },
        },
      }
    );
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  } catch (err) {
    // Continue without an access token. Duplicate detection will
    // simply be skipped on the backend.
    console.warn("[analyze-complaint] Could not read Supabase session:", err);
  }

  const upstreamForm = new FormData();
  upstreamForm.append("description", description);
  upstreamForm.append("category", category);
  if (latitude !== null) upstreamForm.append("latitude", String(latitude));
  if (longitude !== null) upstreamForm.append("longitude", String(longitude));
  if (locationName) upstreamForm.append("location_name", locationName);
  if (accessToken) upstreamForm.append("user_access_token", accessToken);
  if (videoEntry && typeof videoEntry !== "string") {
    const filename =
      (videoEntry as File).name || `evidence-${Date.now()}.webm`;
    const type =
      (videoEntry as File).type || "video/webm";
    upstreamForm.append(
      "video",
      new Blob([await videoEntry.arrayBuffer()], { type }),
      filename
    );
  }
  if (imageEntry && typeof imageEntry !== "string") {
    const filename = (imageEntry as File).name || "evidence.jpg";
    const type = (imageEntry as File).type || "image/jpeg";
    upstreamForm.append(
      "image",
      new Blob([await imageEntry.arrayBuffer()], { type }),
      filename
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: upstreamForm,
      signal: controller.signal,
      headers: {
        // Intentionally NOT setting Content-Type. `fetch` with a
        // FormData body will set the multipart boundary automatically.
        Accept: "application/json",
      },
    });

    const text = await upstream.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { detail: text || "Upstream returned non-JSON response" };
    }

    return new Response(JSON.stringify(payload), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError");
    const detail = isAbort
      ? `The AI backend did not respond within ${UPSTREAM_TIMEOUT_MS}ms.`
      : `The AI backend is unreachable.`;

    return Response.json(
      {
        detail,
        code: isAbort ? "TIMEOUT" : "UPSTREAM_UNREACHABLE",
      },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Max-Age": "600",
    },
  });
}
