import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase configuration is missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  if (!key.startsWith("eyJ") && !key.startsWith("sb_publishable_")) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[CivicEye] Supabase key format may be invalid. Browser keys should be JWT (eyJ...) or new publishable tokens (sb_publishable_...).");
    }
  }

  return createBrowserClient(url, key);
}
