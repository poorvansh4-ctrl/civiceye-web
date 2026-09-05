"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Square,
  RotateCcw,
  Video,
  VideoOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoRecorderProps {
  onVideoReady: (file: File, previewUrl: string) => void;
  maxSeconds?: number;
  className?: string;
  /** When false, the recorder will keep the clip local until the user
   *  explicitly taps "Use This Video" and only then call `onVideoReady`.
   *  Default: true (legacy auto-commit behaviour). */
  autoCommit?: boolean;
}

type Status =
  | "idle"
  | "requesting_permission"
  | "permission_denied"
  | "unsupported"
  | "camera_error"
  | "ready"
  | "recording"
  | "stopped"
  | "preview"
  | "compressing";

const TARGET_MAX_BYTES = 3 * 1024 * 1024; // 3 MB — stays under Vercel/backend limits

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return "";
}

function extensionFor(mime: string): string {
  if (mime.startsWith("video/mp4")) return "mp4";
  if (mime.startsWith("video/quicktime")) return "mov";
  return "webm";
}

function pickCompressionMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return "";
}

async function compressVideoFile(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video for compression"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;

  const fps = 15;
  const stream = canvas.captureStream(fps);
  const mimeType = pickCompressionMime() || "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 400_000,
  });

  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const done = () => {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
      const blob = new Blob(chunks, { type: mimeType });
      const compressed = new File(
        [blob],
        file.name.replace(/\.\w+$/, "") + "-compressed.webm",
        { type: mimeType }
      );
      URL.revokeObjectURL(video.src);
      resolve(compressed);
    };

    recorder.onstop = done;
    recorder.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Video compression failed"));
    };

    video.onended = done;
    video.onerror = done;

    // Safety timeout: stop recording after video duration + buffer
    const safetyTimeout = setTimeout(done, Math.ceil(video.duration * 1000) + 2000);

    recorder.start();
    video.play().catch(() => {});

    const interval = 1000 / fps;
    let stopped = false;

    function drawFrame() {
      if (stopped) return;
      if (video.ended || video.paused) {
        clearTimeout(safetyTimeout);
        done();
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setTimeout(drawFrame, interval);
    }
    drawFrame();

    // Store cleanup handle
    (video as unknown as { _compressionCleanup?: () => void })._compressionCleanup =
      () => {
        stopped = true;
        clearTimeout(safetyTimeout);
        try {
          recorder.stop();
        } catch {
          // ignore
        }
        URL.revokeObjectURL(video.src);
      };
  });
}

function readElapsed(
  startedAt: number,
  maxSeconds: number
): { elapsed: number; remaining: number } {
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const remaining = Math.max(0, maxSeconds - elapsed);
  return { elapsed, remaining };
}

export function VideoRecorder({
  onVideoReady,
  maxSeconds = 8,
  className,
  autoCommit = true,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [mimeType, setMimeType] = useState<string>("");
  const compressingRef = useRef(false);

  useEffect(() => {
    return () => {
       if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          /* noop */
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (compressingRef.current) {
        compressingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);

    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setErrorMessage(
        "Your browser does not support the camera API. Try a modern Chrome, Safari, or Firefox."
      );
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      setErrorMessage(
        "Your browser does not support the MediaRecorder API. Try a modern Chrome, Safari, or Firefox."
      );
      return;
    }

    setStatus("requesting_permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 360 },
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute("playsinline", "true");
        try {
          await videoRef.current.play();
        } catch {
          /* autoplay may be blocked; user can still tap start */
        }
      }
      setStatus("ready");
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("permission_denied");
        setErrorMessage(
          "Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (
        name === "NotFoundError" ||
        name === "OverconstrainedError" ||
        name === "DevicesNotFoundError"
      ) {
        setStatus("camera_error");
        setErrorMessage(
          "No camera was found on this device. Please connect a camera and try again."
        );
      } else {
        setStatus("camera_error");
        setErrorMessage(
          `Could not start the camera (${name || "unknown error"}). Please try again.`
        );
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setErrorMessage("Camera is not ready. Tap 'Open Camera' first.");
      return;
    }
    chunksRef.current = [];
    const chosenMime = pickRecorderMimeType();
    setMimeType(chosenMime);
    let recorder: MediaRecorder;
    const recorderOptions: MediaRecorderOptions = { mimeType: chosenMime };
    try {
      recorderOptions.videoBitsPerSecond = 500_000;
      recorder = chosenMime
        ? new MediaRecorder(streamRef.current, recorderOptions)
        : new MediaRecorder(streamRef.current, recorderOptions);
    } catch {
      try {
        delete recorderOptions.videoBitsPerSecond;
        recorder = chosenMime
          ? new MediaRecorder(streamRef.current, recorderOptions)
          : new MediaRecorder(streamRef.current, recorderOptions);
      } catch (err) {
        setStatus("camera_error");
        setErrorMessage(
          `Could not start the recorder: ${(err as Error)?.message ?? "unknown"}`
        );
        return;
      }
    }
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onerror = (event) => {
      const message = (event as unknown as { error?: { message?: string } })
        ?.error?.message;
      setErrorMessage(message || "Recording failed.");
      setStatus("ready");
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: chosenMime || "video/webm",
      });
      const ext = extensionFor(chosenMime);
      const url = URL.createObjectURL(blob);
      const file = new File(
        [blob],
        `evidence-${Date.now()}.${ext}`,
        { type: chosenMime || "video/webm" }
      );
      console.info(
        `[CivicEye] Recorder onstop: raw file size=%sMB mime=%s`,
        (file.size / 1024 / 1024).toFixed(2),
        file.type
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();

      setStatus("compressing");
      compressingRef.current = true;

      let finalFile = file;
      let finalUrl = url;

      try {
        if (file.size > TARGET_MAX_BYTES) {
          console.info(
            `[CivicEye] Compressing video: %sMB → target %sMB`,
            (file.size / 1024 / 1024).toFixed(2),
            (TARGET_MAX_BYTES / 1024 / 1024).toFixed(2)
          );
          const compressed = await compressVideoFile(file, TARGET_MAX_BYTES);
          console.info(
            `[CivicEye] Compression result: %sMB (was %sMB, ratio=%s)`,
            (compressed.size / 1024 / 1024).toFixed(2),
            (file.size / 1024 / 1024).toFixed(2),
            ((compressed.size / file.size) * 100).toFixed(1)
          );
          if (compressed.size < file.size) {
            URL.revokeObjectURL(url);
            finalFile = compressed;
            finalUrl = URL.createObjectURL(compressed);
          }
        } else {
          console.info(
            `[CivicEye] Video under target size (%sMB < %sMB), skipping compression`,
            (file.size / 1024 / 1024).toFixed(2),
            (TARGET_MAX_BYTES / 1024 / 1024).toFixed(2)
          );
        }
      } catch (compressionErr) {
        console.warn("[CivicEye] Compression failed:", compressionErr);
      } finally {
        compressingRef.current = false;
      }

      if (finalFile.size > TARGET_MAX_BYTES) {
        setErrorMessage("Video is too large. Please record a shorter video and try again.");
        setStatus("ready");
        if (finalUrl !== url) {
          URL.revokeObjectURL(finalUrl);
        }
        return;
      }

      setPreviewUrl(finalUrl);
      setPendingFile(finalFile);
      setStatus("preview");
      if (autoCommit) {
        onVideoReady(finalFile, finalUrl);
      }
    };

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setStatus("recording");
    recorder.start(250);

    stopTimerRef.current = window.setTimeout(() => {
      try {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      } catch {
        /* noop */
      }
    }, maxSeconds * 1000);

    const tick = window.setInterval(() => {
      if (startedAtRef.current == null) return;
      const { elapsed: e } = readElapsed(startedAtRef.current, maxSeconds);
      setElapsed(e);
    }, 250);
    // Save tick id on a ref so we can clear it on stop.
    (recorderRef.current as unknown as { _tick?: number })._tick = tick;
  };

  const stopRecording = () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    const rec = recorderRef.current as unknown as { _tick?: number } | null;
    if (rec && rec._tick) window.clearInterval(rec._tick);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setElapsed(0);
    setErrorMessage(null);
    setStatus("idle");
    compressingRef.current = false;
  };

  const useVideo = () => {
    if (pendingFile && previewUrl) {
      onVideoReady(pendingFile, previewUrl);
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
    setStatus("idle");
  };

  // Bind preview video element when a recording is available.
  useEffect(() => {
    if (previewVideoRef.current && previewUrl) {
      previewVideoRef.current.src = previewUrl;
      previewVideoRef.current.load();
    }
  }, [previewUrl]);

  return (
    <div className={cn("w-full max-w-full min-w-0", className)}>
      {status !== "preview" && (
        <div className="relative w-full aspect-video bg-[#0f1419] border border-[#2e3548] rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
            playsInline
            muted
            autoPlay
          />

          {status === "recording" && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-sm font-medium shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              REC {elapsed}s / {maxSeconds}s
            </div>
          )}

          {status === "ready" && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/85 text-white text-sm font-medium">
              <Video className="w-3.5 h-3.5" />
              Camera ready
            </div>
          )}

          {status === "requesting_permission" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Requesting camera permission…</span>
            </div>
          )}

          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-3 px-6 text-center bg-[#0f1419]">
              <VideoOff className="w-10 h-10 text-slate-500" />
              <p className="text-sm text-slate-400 max-w-xs">
                Record a short 5–10 second video of the civic issue. Your
                camera will only be used while you are on this screen.
              </p>
            </div>
          )}

          {(status === "permission_denied" ||
            status === "camera_error" ||
            status === "unsupported") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 text-red-200 gap-2 px-6 text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">
                {status === "permission_denied"
                  ? "Camera permission denied"
                  : status === "unsupported"
                  ? "Camera not supported"
                  : "Camera error"}
              </p>
              {errorMessage && (
                <p className="text-xs text-red-300/80 max-w-md">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {status === "compressing" && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Optimizing video for upload…</span>
          <span className="text-xs text-slate-500">This keeps the file small enough for AI analysis.</span>
        </div>
      )}

      {status === "preview" && previewUrl && pendingFile && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
            <Video className="w-4 h-4 text-emerald-400" />
            Video Preview
            <span className="text-xs text-slate-500 ml-auto">
              {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
              {pendingFile.size > TARGET_MAX_BYTES && (
                <span className="text-amber-400 ml-2">(compressed)</span>
              )}
            </span>
          </div>
          <div className="relative w-full aspect-video bg-[#0f1419] border border-[#2e3548] rounded-xl overflow-hidden">
            <video
              ref={previewVideoRef}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          </div>
        </div>
      )}

      {errorMessage && status !== "preview" && (
        <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
        {(status === "idle" || status === "permission_denied" || status === "camera_error" || status === "unsupported") && (
          <Button
            type="button"
            onClick={startCamera}
            className="w-full sm:w-auto min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Open Camera
          </Button>
        )}

        {status === "ready" && (
          <Button
            type="button"
            onClick={startRecording}
            className="w-full sm:w-auto min-h-[48px] bg-red-600 hover:bg-red-700 text-white"
          >
            <span className="w-3 h-3 rounded-full bg-white mr-2" />
            Start Recording
          </Button>
        )}

        {status === "recording" && (
          <Button
            type="button"
            onClick={stopRecording}
            className="w-full sm:w-auto min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {status === "recording" && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-300 px-3 min-h-[44px]">
            {maxSeconds - elapsed}s remaining
          </div>
        )}

        {(status === "ready" || status === "recording") && (
          <Button
            type="button"
            variant="outline"
            onClick={toggleCamera}
            className="w-full sm:w-auto min-h-[48px] border-[#2e3548] bg-[#0f1419] text-slate-300 hover:bg-[#1e2433]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip
          </Button>
        )}

        {status === "preview" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={retake}
              className="w-full sm:flex-1 min-h-[48px] border-[#2e3548] bg-[#0f1419] text-slate-300 hover:bg-[#1e2433]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              type="button"
              onClick={useVideo}
              className="w-full sm:flex-1 min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              Use This Video
            </Button>
            {mimeType && (
              <span className="sm:ml-auto text-xs text-slate-500 self-center px-1">
                Format: {mimeType.split(";")[0]}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
