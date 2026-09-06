import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side proxy for the CivicEye FastAPI /analyze endpoint.
 *
 * The browser talks only to this same-origin Next.js route.
 * Next.js forwards the multipart request to the FastAPI backend.
 * The Gemini API key remains backend-only.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow uploads up to 10 MB.
export const maxBodySize = 10 * 1024 * 1024;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!BACKEND_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. The /api/analyze-complaint route handler requires it to forward requests to the FastAPI backend."
  );
}

// Backend timeout is 180 seconds.
// Proxy timeout is slightly higher so the backend gets enough time.
const UPSTREAM_TIMEOUT_MS = 200_000;

// Safety-net TTL for duplicate-analysis protection.
const DEDUP_TTL_MS = 120_000;

const inFlightAnalyses = new Map<string, { cleanup: NodeJS.Timeout }>();

function getAnalyzeDedupKey(form: FormData): string | null {
  const token = form.get("user_access_token");

  if (token && typeof token === "string" && token.length > 0) {
    return `user:${token.slice(-16)}`;
  }

  const desc = asString(form.get("description"));
  const cat = asString(form.get("category"));
  const lat = asString(form.get("latitude"));
  const lng = asString(form.get("longitude"));
  const video = form.get("video");
  const size = video instanceof File ? video.size : 0;

  return `content:${desc}:${cat}:${lat}:${lng}:${size}`;
}

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
    console.error(
      "[CivicEye] /api/analyze-complaint formData parse error:",
      err
    );

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

  const totalSize =
    inbound.get("video") instanceof File
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

  // ------------------------------------------------------------
  // SERVER-SIDE DEDUPLICATION
  // Prevent duplicate Gemini analysis requests.
  // ------------------------------------------------------------

  const dedupKey = getAnalyzeDedupKey(inbound);

  if (dedupKey) {
    if (inFlightAnalyses.has(dedupKey)) {
      console.warn(
        `[CivicEye] Duplicate /analyze rejected (in-flight dedup): key=%s`,
        dedupKey
      );

      return Response.json(
        {
          detail:
            "An AI analysis is already in progress for this complaint. Please wait for it to complete before submitting another.",
          code: "ANALYSIS_IN_PROGRESS",
        },
        { status: 409 }
      );
    }

    inFlightAnalyses.set(dedupKey, {
      cleanup: setTimeout(() => {
        inFlightAnalyses.delete(dedupKey);

        console.warn(
          `[CivicEye] In-flight analyze lock auto-released after ${DEDUP_TTL_MS}ms: key=%s`,
          dedupKey
        );
      }, DEDUP_TTL_MS),
    });
  }

  // ------------------------------------------------------------
  // SUPABASE SESSION
  // ------------------------------------------------------------

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
            // No-op. Route handler does not refresh the session.
          },
        },
      }
    );

    const { data } = await supabase.auth.getSession();

    accessToken = data.session?.access_token ?? null;
  } catch (err) {
    console.warn(
      "[analyze-complaint] Could not read Supabase session:",
      err
    );
  }

  // ------------------------------------------------------------
  // BUILD UPSTREAM FORM
  // ------------------------------------------------------------

  const upstreamForm = new FormData();

  upstreamForm.append("description", description);
  upstreamForm.append("category", category);

  if (latitude !== null) {
    upstreamForm.append("latitude", String(latitude));
  }

  if (longitude !== null) {
    upstreamForm.append("longitude", String(longitude));
  }

  if (locationName) {
    upstreamForm.append("location_name", locationName);
  }

  if (accessToken) {
    upstreamForm.append("user_access_token", accessToken);
  }

  // Video
  if (videoEntry && typeof videoEntry !== "string") {
    const filename =
      (videoEntry as File).name || `evidence-${Date.now()}.webm`;

    const type =
      (videoEntry as File).type || "video/webm";

    upstreamForm.append(
      "video",
      new Blob([await videoEntry.arrayBuffer()], {
        type,
      }),
      filename
    );
  }

  // Image
  if (imageEntry && typeof imageEntry !== "string") {
    const filename =
      (imageEntry as File).name || "evidence.jpg";

    const type =
      (imageEntry as File).type || "image/jpeg";

    upstreamForm.append(
      "image",
      new Blob([await imageEntry.arrayBuffer()], {
        type,
      }),
      filename
    );
  }

  // ------------------------------------------------------------
  // FORWARD TO FASTAPI BACKEND
  // ------------------------------------------------------------

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: upstreamForm,
      signal: controller.signal,
      headers: {
        // Do NOT manually set Content-Type.
        // fetch automatically creates the multipart boundary.
        Accept: "application/json",
      },
    });

    const text = await upstream.text();

    let payload: unknown = {};

    try {
      payload = text
        ? JSON.parse(text)
        : {};
    } catch {
      payload = {
        detail:
          text || "Upstream returned non-JSON response",
      };
    }

    return new Response(
      JSON.stringify(payload),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ||
            "application/json",

          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" ||
        err.name === "TimeoutError");

    const detail = isAbort
      ? `The AI backend did not respond within ${UPSTREAM_TIMEOUT_MS}ms.`
      : "The AI backend is unreachable.";

    return Response.json(
      {
        detail,
        code: isAbort
          ? "TIMEOUT"
          : "UPSTREAM_UNREACHABLE",
      },
      {
        status: isAbort ? 504 : 502,
      }
    );
  } finally {
    clearTimeout(timer);

    if (dedupKey) {
      const entry = inFlightAnalyses.get(dedupKey);

      if (entry) {
        clearTimeout(entry.cleanup);
        inFlightAnalyses.delete(dedupKey);
      }
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,

    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept",
      "Access-Control-Max-Age": "600",
    },
  });
}
