/**
 * Centralized client for talking to the CivicEye AI backend.
 *
 * The browser posts multipart/form-data to the Next.js proxy at
 * `/api/analyze-complaint`, which forwards the request to the FastAPI
 * backend using `NEXT_PUBLIC_API_URL`. Using the proxy avoids CORS
 * issues and keeps the backend URL server-side only.
 *
 * The Gemini API key remains backend-only on the FastAPI side.
 */

/**
 * The endpoint the browser POSTs to.
 * In production this is the same-origin Next.js proxy to avoid CORS.
 */
export const ANALYZE_ENDPOINT = "/api/analyze-complaint";

export type CivicSeverity = "low" | "medium" | "high" | "critical";
export type CivicCategory =
  | "pothole"
  | "garbage"
  | "streetlight"
  | "water_leakage"
  | "road_damage"
  | "drainage"
  | "other";

export type AuthenticityStatus =
  | "likely_authentic"
  | "suspicious"
  | "inconclusive";

export interface DuplicateResult {
  is_duplicate: boolean;
  duplicate_confidence: number;
  duplicate_complaint_id: string | null;
  duplicate_complaint_number: string | null;
  duplicate_distance_meters: number | null;
  duplicate_reason: string;
}

export interface AnalyzeTimings {
  total?: number;
  validation?: number;
  gemini?: number;
  duplicate?: number;
}

export interface AIAnalysisResponse {
  detected_issue: string;
  ai_confidence: number;
  severity: CivicSeverity;
  priority_score: number;
  recommended_department: string;
  explanation: string;
  authenticity_status: AuthenticityStatus;
  authenticity_confidence: number;
  authenticity_explanation: string;
  is_duplicate: boolean;
  duplicate_confidence: number;
  duplicate_complaint_id: string | null;
  duplicate_complaint_number: string | null;
  duplicate_distance_meters: number | null;
  duplicate_reason: string;
  timings_ms?: AnalyzeTimings;
}

export class AIAnalysisError extends Error {
  status: number;
  code: string | null;
  upstream: string | null;
  constructor(
    message: string,
    status: number,
    code: string | null = null,
    upstream: string | null = null
  ) {
    super(message);
    this.name = "AIAnalysisError";
    this.status = status;
    this.code = code;
    this.upstream = upstream;
  }
}

import { createClient } from "@/lib/supabase/client";

/**
 * Send a complaint to the FastAPI /analyze endpoint using multipart/form-data.
 *
 * `video` is the primary evidence; `image` is an optional fallback that
 * the backend will only use if `video` is not provided.
 *
 * The function throws `AIAnalysisError` on any non-2xx response.
 */
export async function analyzeComplaint(input: {
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  video?: File | Blob;
  videoContentType?: string;
  image?: File | Blob;
  imageContentType?: string;
  signal?: AbortSignal;
}): Promise<AIAnalysisResponse> {
  if (!input.video && !input.image) {
    throw new AIAnalysisError(
      "Evidence required. Record a short video or attach a photo.",
      0
    );
  }

  if (input.video && input.video instanceof Blob && input.video.size === 0) {
    throw new AIAnalysisError(
      "The recorded video is empty (0 bytes). Please retake the video.",
      0
    );
  }

  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB frontend cap
  if (input.video && input.video instanceof Blob && input.video.size > MAX_UPLOAD_BYTES) {
    console.warn(
      `[CivicEye] Frontend size guard: video is ${(input.video.size / 1024 / 1024).toFixed(2)} MB, limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`
    );
    throw new AIAnalysisError(
      `Video is too large (${(input.video.size / 1024 / 1024).toFixed(1)} MB). Please record a shorter video (5–10s) or use a faster connection.`,
      413,
      "PAYLOAD_TOO_LARGE"
    );
  }

  const formData = new FormData();
  formData.append("description", input.description ?? "");
  formData.append("category", input.category ?? "other");
  formData.append("latitude", String(input.latitude));
  formData.append("longitude", String(input.longitude));
  if (input.locationName && input.locationName.trim()) {
    formData.append("location_name", input.locationName.trim());
  }

  let accessToken: string | null = null;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token ?? null;
  } catch {
    // Continue without an access token. Duplicate detection will
    // simply be skipped on the backend.
  }
  if (accessToken) {
    formData.append("user_access_token", accessToken);
  }

  if (input.video) {
    const filename =
      input.video instanceof File
        ? input.video.name
        : "evidence.webm";
    const contentType =
      input.videoContentType ||
      (input.video instanceof File ? input.video.type : "video/webm");
    formData.append("video", input.video, filename);
    const videoSizeMB = (input.video.size / 1024 / 1024).toFixed(2);
    console.info(
      `[CivicEye] Frontend upload: video=%s mime=%s size=%sMB`,
      filename,
      contentType,
      videoSizeMB
    );
    void contentType;
  }
  if (input.image) {
    formData.append("image", input.image);
  }

  const response = await fetch(ANALYZE_ENDPOINT, {
    method: "POST",
    body: formData,
    signal: input.signal,
    // Do NOT set Content-Type here — the browser will set the
    // correct multipart/form-data boundary automatically because we
    // passed a FormData body.
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // The backend returns FastAPI HTTPException-style errors. Since we
    // sometimes return a structured `detail: { message, code, upstream }`
    // (for Gemini quota / timeout / etc.) and sometimes a plain string
    // `detail` (for older paths), handle both shapes.
    const d: unknown = data;
    let detailMessage: string | null = null;
    let detailCode: string | null = null;
    let detailUpstream: string | null = null;
    if (d && typeof d === "object") {
      const obj = d as Record<string, unknown>;
      if (typeof obj.detail === "string") {
        detailMessage = obj.detail;
      } else if (obj.detail && typeof obj.detail === "object") {
        const inner = obj.detail as Record<string, unknown>;
        if (typeof inner.message === "string") detailMessage = inner.message;
        if (typeof inner.code === "string") detailCode = inner.code;
        if (typeof inner.upstream === "string") detailUpstream = inner.upstream;
      }
      if (!detailMessage && typeof obj.message === "string") {
        detailMessage = obj.message;
      }
      if (!detailCode && typeof obj.code === "string") {
        detailCode = obj.code;
      }
      if (!detailUpstream && typeof obj.upstream === "string") {
        detailUpstream = obj.upstream;
      }
    }
    const finalMessage =
      detailMessage || `AI analysis failed (HTTP ${response.status})`;
    throw new AIAnalysisError(
      finalMessage,
      response.status,
      detailCode,
      detailUpstream
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof data.detected_issue !== "string" ||
    typeof data.ai_confidence !== "number" ||
    typeof data.severity !== "string" ||
    typeof data.priority_score !== "number" ||
    typeof data.recommended_department !== "string" ||
    typeof data.explanation !== "string" ||
    typeof data.authenticity_status !== "string" ||
    typeof data.authenticity_confidence !== "number" ||
    typeof data.authenticity_explanation !== "string" ||
    typeof (data as { is_duplicate?: unknown }).is_duplicate !== "boolean"
  ) {
    throw new AIAnalysisError("AI returned an invalid response.", 502);
  }

  // Backend is required to always include duplicate fields; we
  // backfill with safe defaults so the UI can render even when the
  // backend skipped duplicate detection (no session, no GPS, etc.).
  const d = data as Record<string, unknown>;
  return {
    detected_issue: d.detected_issue as string,
    ai_confidence: d.ai_confidence as number,
    severity: d.severity as CivicSeverity,
    priority_score: d.priority_score as number,
    recommended_department: d.recommended_department as string,
    explanation: d.explanation as string,
    authenticity_status: d.authenticity_status as AuthenticityStatus,
    authenticity_confidence: d.authenticity_confidence as number,
    authenticity_explanation: d.authenticity_explanation as string,
    is_duplicate: d.is_duplicate as boolean,
    duplicate_confidence: (d.duplicate_confidence as number) ?? 0,
    duplicate_complaint_id: (d.duplicate_complaint_id as string | null) ?? null,
    duplicate_complaint_number:
      (d.duplicate_complaint_number as string | null) ?? null,
    duplicate_distance_meters:
      (d.duplicate_distance_meters as number | null) ?? null,
    duplicate_reason:
      (d.duplicate_reason as string) ?? "No nearby matching complaint found",
    timings_ms: d.timings_ms as AnalyzeTimings | undefined,
  };
}
