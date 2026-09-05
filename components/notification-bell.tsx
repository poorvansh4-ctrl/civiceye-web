"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, AlertTriangle, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { alertSoundService, type AlertSeverity } from "@/lib/alert-sound";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ComplaintNotification {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  address: string | null;
  severity: AlertSeverity;
  priority_score: number;
  status: string;
  created_at: string;
  read: boolean;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ComplaintNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNewComplaint = useCallback((payload: { new: Record<string, unknown> }) => {
    const complaint = payload.new;
    const newNotification: ComplaintNotification = {
      id: complaint.id as string,
      complaint_number: (complaint.complaint_number as string) || "Unknown",
      category: (complaint.category as string) || "other",
      description: (complaint.description as string) || "",
      address: complaint.address as string | null,
      severity: ((complaint.severity as AlertSeverity) || "medium") as AlertSeverity,
      priority_score: (complaint.priority_score as number) || 50,
      status: (complaint.status as string) || "submitted",
      created_at: (complaint.created_at as string) || new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    if (soundEnabledRef.current) {
      alertSoundService.playAlert(newNotification.severity);
      if (newNotification.severity === "critical" || newNotification.severity === "high") {
        alertSoundService.startRepeatingAlert(newNotification.id, newNotification.severity);
      }
    }
  }, []);

  const handleComplaintUpdate = useCallback((payload: { new: Record<string, unknown> }) => {
    const updated = payload.new;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === updated.id
          ? {
              ...n,
              status: (updated.status as string) || n.status,
              severity: ((updated.severity as AlertSeverity) || n.severity) as AlertSeverity,
              priority_score: (updated.priority_score as number) || n.priority_score,
            }
          : n
      )
    );

    if (updated.status === "resolved") {
      alertSoundService.stopRepeatingAlert(updated.id as string);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("id, complaint_number, category, description, address, severity, priority_score, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && mounted) {
        const mappedNotifications: ComplaintNotification[] = data.map((item) => ({
          id: item.id,
          complaint_number: item.complaint_number,
          category: item.category,
          description: item.description,
          address: item.address,
          severity: item.severity as AlertSeverity,
          priority_score: item.priority_score,
          status: item.status,
          created_at: item.created_at,
          read: false,
        }));
        setNotifications(mappedNotifications);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaints",
        },
        handleNewComplaint
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
        },
        handleComplaintUpdate
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [handleNewComplaint, handleComplaintUpdate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: ComplaintNotification) => {
    handleMarkAsRead(notification.id);
    setIsOpen(false);
    router.push(`/admin/complaints/${notification.id}`);
  };

  const handleEnableSound = async () => {
    const success = await alertSoundService.activate();
    if (success) {
      setSoundEnabled(true);
    }
  };

  const handleDisableSound = () => {
    alertSoundService.deactivate();
    setSoundEnabled(false);
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "text-red-400 bg-red-500/10";
      case "high":
        return "text-orange-400 bg-orange-500/10";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10";
      case "low":
        return "text-emerald-400 bg-emerald-500/10";
    }
  };

  const getSeverityBg = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-emerald-500";
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#2e3548] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-hidden bg-[#1e2433] border border-[#2e3548] rounded-xl shadow-2xl shadow-black/50 z-50"
        >
          <div className="sticky top-0 bg-[#1e2433] border-b border-[#2e3548] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#2e3548] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {soundEnabled ? (
                  <button
                    onClick={handleDisableSound}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    title="Mute alerts"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleEnableSound}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-medium"
                  >
                    Activate Alerts
                  </button>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  New complaints will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2e3548]">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-[#242938] transition-colors border-l-4 ${getSeverityBg(notification.severity)} ${
                      notification.read ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${getSeverityColor(notification.severity)}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                          </span>
                          <span className="text-xs text-slate-500 shrink-0">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {notification.address && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{notification.address}</span>
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-500">
                            P:{notification.priority_score}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(notification.severity)}`}>
                            {notification.severity}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-xs text-slate-500 hover:text-white transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-[#1e2433] border-t border-[#2e3548] p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/admin/complaints");
                }}
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View All Complaints
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
