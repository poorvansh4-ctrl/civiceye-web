"use client";

import { useState, useCallback, useEffect } from "react";
import { X, AlertTriangle, Bell, Volume2, VolumeX, MapPin, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  useComplaintAlerts,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  type ComplaintAlert,
} from "@/lib/complaint-alerts";
import { alertSoundService, type AlertSeverity } from "@/lib/alert-sound";
import { Button } from "@/components/ui/button";

interface ActiveAlert {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  address: string | null;
  severity: AlertSeverity;
  priority_score: number;
  created_at: string;
  acknowledged: boolean;
}

const ALERT_INTERVAL_MS =
  process.env.NEXT_PUBLIC_ALERT_DEMO_MODE === "true"
    ? 60 * 1000
    : 60 * 60 * 1000;

function getAlertTiming(createdAt: string, now: number) {
  const createdTime = new Date(createdAt).getTime();
  const elapsedMs = Math.max(0, now - createdTime);
  const elapsedIntervals = Math.floor(elapsedMs / ALERT_INTERVAL_MS);
  const nextAlertMs =
    (elapsedIntervals + 1) * ALERT_INTERVAL_MS - elapsedMs;

  return {
    elapsedMs,
    elapsedIntervals,
    nextAlertMs,
  };
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function AdminAlertSystem() {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Keep the escalation timer synchronized with real time.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleNewComplaint = useCallback((complaint: ComplaintAlert) => {
    const severity = complaint.severity as AlertSeverity;

    const newAlert: ActiveAlert = {
      id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      description: complaint.description,
      address: complaint.address,
      severity,
      priority_score: complaint.priority_score,
      created_at: complaint.created_at,
      acknowledged: false,
    };

    setActiveAlerts((prev) => {
      if (prev.some((a) => a.id === complaint.id)) {
        return prev;
      }
      return [newAlert, ...prev];
    });

    const locationText = complaint.address || "Unknown location";

    if (severity === "critical") {
      toast.error(`CRITICAL: ${complaint.category}`, {
        description: `${locationText} | Priority: ${complaint.priority_score}`,
        duration: 10000,
      });
    } else if (severity === "high") {
      toast.warning(`High Priority: ${complaint.category}`, {
        description: `${locationText} | Priority: ${complaint.priority_score}`,
        duration: 8000,
      });
    } else {
      toast.info(`New ${complaint.category}`, {
        description: `${locationText} | Priority: ${complaint.priority_score}`,
        duration: 5000,
      });
    }

    if (soundEnabled) {
      alertSoundService.playAlert(severity);
      if (severity === "critical" || severity === "high") {
        alertSoundService.startRepeatingAlert(complaint.id, severity);
      }
    }

    if (notificationPermission === "granted" && (severity === "critical" || severity === "high")) {
      showBrowserNotification(
        `${severity === "critical" ? "CRITICAL" : "High Priority"}: ${complaint.category}`,
        `${locationText} | Priority: ${complaint.priority_score}`,
        complaint.id
      );
    }
  }, [soundEnabled, notificationPermission]);

  const handleComplaintResolved = useCallback((complaintId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== complaintId));
    alertSoundService.stopRepeatingAlert(complaintId);
    toast.success("Issue Resolved", {
      description: "Complaint has been marked as resolved",
      duration: 3000,
    });
  }, []);

  // Escalate unresolved critical/high complaints at every alert interval.
  useEffect(() => {
    if (activeAlerts.length === 0) return;

    const checkEscalations = () => {
      const now = Date.now();

      activeAlerts.forEach((alert) => {
        if (alert.acknowledged) return;
        if (alert.severity !== "critical" && alert.severity !== "high") return;

        const timing = getAlertTiming(alert.created_at, now);

        // elapsedIntervals === 0 means the first interval has not completed yet.
        if (timing.elapsedIntervals < 1) return;

        const storageKey = `civiceye-alert-${alert.id}`;
        const lastEscalation = Number(localStorage.getItem(storageKey) || "0");

        // Only fire once for each completed interval.
        if (timing.elapsedIntervals <= lastEscalation) return;

        localStorage.setItem(storageKey, String(timing.elapsedIntervals));

        if (soundEnabled) {
          alertSoundService.playAlert(alert.severity);
        }

        if (notificationPermission === "granted") {
          showBrowserNotification(
            `ESCALATION: ${alert.category}`,
            `${alert.complaint_number} unresolved for ${timing.elapsedIntervals} hour(s). Priority: ${alert.priority_score}`,
            `${alert.id}-escalation-${timing.elapsedIntervals}`
          );
        }

        toast.warning(
          `ESCALATION #${timing.elapsedIntervals}: ${alert.category}`,
          {
            description: `${alert.complaint_number} is still unresolved`,
            duration: 10000,
          }
        );
      });
    };

    checkEscalations();

    const escalationTimer = window.setInterval(checkEscalations, 1000);

    return () => window.clearInterval(escalationTimer);
  }, [activeAlerts, soundEnabled, notificationPermission, currentTime]);

  useComplaintAlerts({
    onNewComplaint: handleNewComplaint,
    onComplaintResolved: handleComplaintResolved,
    enabled: true,
  });

  const handleEnableSound = async () => {
    const success = await alertSoundService.activate();
    if (success) {
      setSoundEnabled(true);
      toast.success("Alert sounds enabled");
    } else {
      toast.error("Failed to enable alert sounds");
    }
  };

  const handleDisableSound = () => {
    alertSoundService.deactivate();
    setSoundEnabled(false);
    toast.info("Alert sounds disabled");
  };

  const handleRequestNotificationPermission = async () => {
    const permission = await requestBrowserNotificationPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast.success("Browser notifications enabled");
    } else if (permission === "denied") {
      toast.error("Browser notifications denied");
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    alertSoundService.stopRepeatingAlert(alertId);
  };

  const handleDismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    alertSoundService.stopRepeatingAlert(alertId);
  };

  const criticalCount = activeAlerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const highCount = activeAlerts.filter((a) => a.severity === "high" && !a.acknowledged).length;
  const totalUnacknowledged = activeAlerts.filter((a) => !a.acknowledged).length;

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "border-red-500/50 bg-red-500/10";
      case "high":
        return "border-orange-500/50 bg-orange-500/10";
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "low":
        return "border-blue-500/50 bg-blue-500/10";
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "high":
        return <Zap className="w-4 h-4 text-orange-400" />;
      case "medium":
        return <Bell className="w-4 h-4 text-yellow-400" />;
      case "low":
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {showAlertPanel && activeAlerts.length > 0 && (
        <div className="w-80 max-h-96 overflow-y-auto bg-[#1e2433] border border-[#2e3548] rounded-xl shadow-2xl shadow-black/50">
          <div className="sticky top-0 bg-[#1e2433] border-b border-[#2e3548] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Active Alerts</span>
              {totalUnacknowledged > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                  {totalUnacknowledged}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAlertPanel(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityStyles(alert.severity)} ${
                  alert.acknowledged ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="text-sm font-medium text-white">{alert.category}</span>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-0.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{alert.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{alert.address || "Unknown"}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">#{alert.priority_score}</span>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="mt-2 w-full py-1 text-xs text-slate-400 hover:text-white border border-[#2e3548] rounded transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAlerts.length > 0 && !showAlertPanel && (
        <button
          onClick={() => setShowAlertPanel(true)}
          className={`relative px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all ${
            criticalCount > 0
              ? "bg-red-600 hover:bg-red-700 animate-pulse"
              : highCount > 0
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-[#1e2433] border border-[#2e3548] hover:border-blue-500/50"
          }`}
        >
          <Bell className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">
            {criticalCount > 0
              ? `${criticalCount} Critical`
              : highCount > 0
              ? `${highCount} High`
              : `${activeAlerts.length} Alerts`}
          </span>
          {totalUnacknowledged > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {totalUnacknowledged}
            </span>
          )}
        </button>
      )}

      <div className="flex items-center gap-2">
        {notificationPermission !== "granted" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestNotificationPermission}
            className="border-[#2e3548] bg-[#1e2433] text-slate-300 hover:bg-[#2e3548]"
          >
            <Bell className="w-3 h-3 mr-1" />
            Enable Notifications
          </Button>
        )}
        {soundEnabled ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisableSound}
            className="border-[#2e3548] bg-[#1e2433] text-slate-300 hover:bg-[#2e3548]"
          >
            <VolumeX className="w-3 h-3 mr-1" />
            Mute Alerts
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEnableSound}
            className="border-[#2e3548] bg-[#1e2433] text-slate-300 hover:bg-[#2e3548]"
          >
            <Volume2 className="w-3 h-3 mr-1" />
            Enable Sound
          </Button>
        )}
      </div>
    </div>
  );
}

export function AlertSoundIndicator() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleToggleSound = async () => {
    if (soundEnabled) {
      alertSoundService.deactivate();
      setSoundEnabled(false);
    } else {
      const success = await alertSoundService.activate();
      setSoundEnabled(success);
    }
  };

  return (
    <button
      onClick={handleToggleSound}
      className={`p-2 rounded-lg transition-colors ${
        soundEnabled
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-[#2e3548] text-slate-400 hover:text-white"
      }`}
      title={soundEnabled ? "Alert sounds enabled" : "Enable alert sounds"}
    >
      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}
