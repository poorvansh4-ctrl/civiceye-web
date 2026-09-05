"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ComplaintAlert {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  address: string | null;
  severity: "critical" | "high" | "medium" | "low";
  priority_score: number;
  status: string;
  created_at: string;
}

type AlertCallback = (complaint: ComplaintAlert) => void;
type ResolveCallback = (complaintId: string) => void;

interface UseComplaintAlertsOptions {
  onNewComplaint?: AlertCallback;
  onComplaintResolved?: ResolveCallback;
  enabled?: boolean;
}

export function useComplaintAlerts({
  onNewComplaint,
  onComplaintResolved,
  enabled = true,
}: UseComplaintAlertsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onNewComplaintRef = useRef(onNewComplaint);
  const onComplaintResolvedRef = useRef(onComplaintResolved);

  useEffect(() => {
    onNewComplaintRef.current = onNewComplaint;
    onComplaintResolvedRef.current = onComplaintResolved;
  }, [onNewComplaint, onComplaintResolved]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const channel = supabase
      .channel("complaints-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaints",
        },
        (payload) => {
          const complaint = payload.new as ComplaintAlert;
          onNewComplaintRef.current?.(complaint);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
        },
        (payload) => {
          const updated = payload.new as ComplaintAlert;
          if (updated.status === "resolved") {
            onComplaintResolvedRef.current?.(updated.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return cleanup;
  }, [enabled, cleanup]);

  return { cleanup };
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

export function showBrowserNotification(title: string, body: string, tag?: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag,
      requireInteraction: true,
    });
  } catch {
    // Notification not supported
  }
}
