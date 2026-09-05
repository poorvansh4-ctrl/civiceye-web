"use client";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

interface AlertSoundConfig {
  frequency: number;
  duration: number;
  repeatCount: number;
  repeatInterval: number;
  type: OscillatorType;
  gain: number;
}

const SEVERITY_CONFIGS: Record<AlertSeverity, AlertSoundConfig> = {
  critical: {
    frequency: 880,
    duration: 0.3,
    repeatCount: 3,
    repeatInterval: 0.15,
    type: "square",
    gain: 0.3,
  },
  high: {
    frequency: 660,
    duration: 0.25,
    repeatCount: 2,
    repeatInterval: 0.2,
    type: "triangle",
    gain: 0.25,
  },
  medium: {
    frequency: 440,
    duration: 0.2,
    repeatCount: 1,
    repeatInterval: 0,
    type: "sine",
    gain: 0.2,
  },
  low: {
    frequency: 330,
    duration: 0.15,
    repeatCount: 1,
    repeatInterval: 0,
    type: "sine",
    gain: 0.15,
  },
};

const REPEAT_ALERT_INTERVAL = 30000;

class AlertSoundService {
  private audioContext: AudioContext | null = null;
  private isActivated = false;
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();

  async activate(): Promise<boolean> {
    if (this.isActivated && this.audioContext) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return true;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      this.isActivated = true;
      return true;
    } catch {
      return false;
    }
  }

  deactivate() {
    this.isActivated = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopAllRepeating();
  }

  get activated(): boolean {
    return this.isActivated;
  }

  private playTone(config: AlertSoundConfig): void {
    if (!this.audioContext || !this.isActivated) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
  }

  playAlert(severity: AlertSeverity): void {
    if (!this.isActivated || !this.audioContext) return;

    const config = SEVERITY_CONFIGS[severity];

    this.playTone(config);

    if (config.repeatCount > 1) {
      let count = 1;
      const interval = setInterval(() => {
        if (count < config.repeatCount) {
          this.playTone(config);
          count++;
        } else {
          clearInterval(interval);
        }
      }, (config.duration + config.repeatInterval) * 1000);
    }
  }

  startRepeatingAlert(complaintId: string, severity: AlertSeverity): void {
    if (!this.isActivated || this.activeIntervals.has(complaintId)) return;

    if (severity !== "critical" && severity !== "high") return;

    this.playAlert(severity);

    const interval = setInterval(() => {
      this.playAlert(severity);
    }, REPEAT_ALERT_INTERVAL);

    this.activeIntervals.set(complaintId, interval);
  }

  stopRepeatingAlert(complaintId: string): void {
    const interval = this.activeIntervals.get(complaintId);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(complaintId);
    }
  }

  stopAllRepeating(): void {
    this.activeIntervals.forEach((interval) => clearInterval(interval));
    this.activeIntervals.clear();
  }
}

export const alertSoundService = new AlertSoundService();
