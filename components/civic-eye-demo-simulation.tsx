"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  MapPin,
  Video,
  Brain,
  ShieldCheck,
  GitMerge,
  Gauge,
  Building2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  Eye,
  Camera,
  Droplet,
  Lightbulb,
  Trash2,
  Construction,
  Activity,
  BarChart3,
  Clock,
  Check,
  Loader2,
} from "lucide-react";

interface DemoScene {
  id: number;
  act: "OPENING" | "CITIZEN" | "AI" | "ADMIN" | "RESOLVE" | "FINALE";
  title: string;
  subtitle: string;
  duration: number;
}

const DEMO_SCENES: DemoScene[] = [
  { id: 1, act: "OPENING", title: "THE PROBLEM", subtitle: "The city has problems", duration: 5000 },
  { id: 2, act: "CITIZEN", title: "OPEN CIVICEYE", subtitle: "REPORT CIVIC ISSUE", duration: 4500 },
  { id: 3, act: "CITIZEN", title: "LIVE CAMERA EVIDENCE", subtitle: "5–10s live motion video", duration: 8000 },
  { id: 4, act: "CITIZEN", title: "VIDEO PREVIEW", subtitle: "Evidence ready", duration: 4000 },
  { id: 5, act: "CITIZEN", title: "LOCATION VERIFIED", subtitle: "Geo-tagged report", duration: 5000 },
  { id: 6, act: "AI", title: "AI VISION ANALYSIS", subtitle: "Detecting civic issue", duration: 8000 },
  { id: 7, act: "AI", title: "AUTHENTICITY CHECK", subtitle: "Likely authentic", duration: 7000 },
  { id: 8, act: "AI", title: "DUPLICATE DETECTION", subtitle: "Checking nearby reports", duration: 6000 },
  { id: 9, act: "AI", title: "PRIORITY ENGINE", subtitle: "Score 87/100 — HIGH", duration: 5500 },
  { id: 10, act: "CITIZEN", title: "SUBMIT COMPLAINT", subtitle: "CE-2026-A4821", duration: 4500 },
  { id: 11, act: "ADMIN", title: "MUNICIPAL COMMAND CENTER", subtitle: "Report received", duration: 9000 },
  { id: 12, act: "ADMIN", title: "DEPARTMENT ASSIGNMENT", subtitle: "Roads & Infrastructure", duration: 5500 },
  { id: 13, act: "ADMIN", title: "MUNICIPAL ACTION", subtitle: "In progress", duration: 6000 },
  { id: 14, act: "RESOLVE", title: "ISSUE RESOLVED", subtitle: "Timeline complete", duration: 5500 },
  { id: 15, act: "RESOLVE", title: "CITY IMPACT", subtitle: "2,481 reports · 78% resolved", duration: 6000 },
  { id: 16, act: "FINALE", title: "SEE THE ISSUE. FIX THE CITY.", subtitle: "AI-powered civic intelligence", duration: 6000 },
];

interface CivicEyeDemoSimulationProps {
  /** When true, the component renders only the cinematic 16:9
   *  scene canvas + its own controls (no header, no bottom workflow
   *  strip). Use this when the simulation is embedded inside another
   *  video container. */
  embedded?: boolean;
  /** Auto-start the demo when the simulation mounts. */
  autoStart?: boolean;
  /** Reset the simulation back to scene 0 and pause it. */
  resetSignal?: number;
  /** Notify the parent of playback state. */
  onStateChange?: (state: {
    isPlaying: boolean;
    currentScene: number;
    sceneCount: number;
    done: boolean;
  }) => void;
  /** Container ref for fullscreen targeting. */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function CivicEyeDemoSimulation({
  embedded = false,
  autoStart = false,
  resetSignal = 0,
  onStateChange,
  containerRef,
}: CivicEyeDemoSimulationProps = {}) {
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);

  const totalDuration = DEMO_SCENES.reduce((acc, s) => acc + s.duration, 0);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (currentScene >= DEMO_SCENES.length - 1) {
      setCurrentScene(0);
      setSceneProgress(0);
    }
  }, [currentScene]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentScene(0);
    setSceneProgress(0);
    setIsPlaying(true);
  }, []);

  const handleNextScene = useCallback(() => {
    setCurrentScene((prev) => Math.min(prev + 1, DEMO_SCENES.length - 1));
    setSceneProgress(0);
  }, []);

  const handlePrevScene = useCallback(() => {
    setCurrentScene((prev) => Math.max(prev - 1, 0));
    setSceneProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSceneProgress((prev) => {
        const safeIndex = Math.min(
          Math.max(currentScene, 0),
          DEMO_SCENES.length - 1
        );
        const increment = 100 / (DEMO_SCENES[safeIndex].duration / 50);
        const next = prev + increment;

        if (next >= 100) {
          if (safeIndex < DEMO_SCENES.length - 1) {
            setCurrentScene((s) => Math.min(s + 1, DEMO_SCENES.length - 1));
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentScene]);

  // External reset signal
  useEffect(() => {
    if (resetSignal > 0) {
      const timeout = setTimeout(() => {
        setCurrentScene(0);
        setSceneProgress(0);
        setIsPlaying(false);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [resetSignal]);
  useEffect(() => {
    onStateChange?.({
      isPlaying,
      currentScene,
      sceneCount: DEMO_SCENES.length,
      done: !isPlaying && currentScene === DEMO_SCENES.length - 1 && sceneProgress >= 100,
    });
  }, [isPlaying, currentScene, sceneProgress, onStateChange]);

  const progress = useMemo(() => {
    const safeIndex = Math.min(
      Math.max(currentScene, 0),
      DEMO_SCENES.length - 1
    );
    let accumulated = 0;
    for (let i = 0; i < safeIndex; i++) {
      accumulated += DEMO_SCENES[i].duration;
    }
    accumulated += (sceneProgress / 100) * DEMO_SCENES[safeIndex].duration;
    return (accumulated / totalDuration) * 100;
  }, [currentScene, sceneProgress, totalDuration]);

  const scene = DEMO_SCENES[Math.min(currentScene, DEMO_SCENES.length - 1)];

  return (
    <div className={embedded ? "w-full" : "w-full max-w-6xl mx-auto"}>
      {!embedded && (
        <div className="text-center mb-6 sm:mb-8 px-1">
          <p className="text-xs sm:text-sm font-medium text-blue-400 tracking-wider uppercase mb-2">
            CIVICEYE • IN ACTION
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight">
            From a citizen&apos;s phone to a city-wide action
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base px-2">
            Watch the full CivicEye workflow &mdash; live evidence, GPS,
            AI analysis, authenticity, duplicates, priority, and municipal
            resolution.
          </p>
        </div>
      )}

      {/* Demo Container — FIXED 16:9 frame, scene + controls inside */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden rounded-2xl bg-[#0a0d12] border border-[#2e3548] shadow-2xl shadow-black/50"
      >
        {/* Scene Content — absolute fill, NEVER changes parent height */}
        <div className="absolute inset-0">
          <SceneCanvas scene={scene} progress={sceneProgress} />

          {/* Act badge (top-left) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 z-10">
            {scene.act === "OPENING" && <Sparkles className="w-3 h-3 text-amber-400" />}
            {scene.act === "CITIZEN" && <Smartphone className="w-3 h-3 text-emerald-400" />}
            {scene.act === "AI" && <Sparkles className="w-3 h-3 text-blue-400" />}
            {scene.act === "ADMIN" && <Building2 className="w-3 h-3 text-amber-400" />}
            {scene.act === "RESOLVE" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {scene.act === "FINALE" && <Sparkles className="w-3 h-3 text-blue-400" />}
            <span className="text-[10px] sm:text-xs font-medium text-white tracking-wider">
              {scene.act}
            </span>
          </div>
        </div>


      </div>

      {/* Cinematic workflow step strip — matches the new flow */}
      {!embedded && (
      <ol className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 px-0 sm:px-1">
        {[
          { icon: Video, label: "LIVE EVIDENCE" },
          { icon: MapPin, label: "LOCATION VERIFIED" },
          { icon: Brain, label: "AI VISION ANALYSIS" },
          { icon: ShieldCheck, label: "AUTHENTICITY CHECK" },
          { icon: GitMerge, label: "DUPLICATE DETECTION" },
          { icon: Gauge, label: "PRIORITY ENGINE" },
          { icon: Building2, label: "MUNICIPAL ACTION" },
        ].map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.label}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1f2e]/60 border border-[#2e3548] min-w-0"
            >
              <span className="w-6 h-6 shrink-0 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">
                {i + 1}
              </span>
              <Icon className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-white tracking-wide truncate">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      )}
    </div>
  );
}

/* ---------- Per-scene cinematic renderer ---------- */

function SceneCanvas({
  scene,
  progress,
}: {
  scene: DemoScene;
  progress: number;
}) {
  const idx = scene.id;
  return (
    <div className="relative w-full h-full">
      {idx === 1 && <TheProblemScene />}
      {idx === 2 && <CitizenOpensAppScene />}
      {idx === 3 && <RecordVideoScene progress={progress} />}
      {idx === 4 && <VideoPreviewScene />}
      {idx === 5 && <LocationVerifiedScene />}
      {idx === 6 && <AIVisionScene progress={progress} />}
      {idx === 7 && <AuthenticityScene progress={progress} />}
      {idx === 8 && <DuplicateScene />}
      {idx === 9 && <PriorityEngineScene />}
      {idx === 10 && <SubmitScene />}
      {idx === 11 && <CommandCenterScene />}
      {idx === 12 && <AssignDepartmentScene />}
      {idx === 13 && <MunicipalActionScene />}
      {idx === 14 && <ResolutionScene />}
      {idx === 15 && <CityImpactScene />}
      {idx === 16 && <FinaleScene progress={progress} />}
    </div>
  );
}

function SceneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] overflow-hidden p-2 sm:p-3 md:p-5 flex flex-col items-center justify-center">
      {children}
    </div>
  );
}

function SceneTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-2 sm:mb-4 max-w-full shrink-0">
      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white leading-tight">
        {title}
      </h3>
      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 px-1">
        {subtitle}
      </p>
    </div>
  );
}

function CitizenOpensAppScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-2">
        {/* Cinematic background */}
        <div className="absolute inset-0 map-grid opacity-20 pointer-events-none" />
        {/* Phone frame — scaled for 16:9 frame */}
        <div className="mx-auto w-20 sm:w-40 md:w-56 relative shrink-0">
          <div className="relative aspect-[9/16] sm:aspect-[9/19] rounded-xl sm:rounded-[28px] bg-gradient-to-b from-[#0f1419] to-[#1a1f2e] border border-[#2e3548] sm:border-2 shadow-xl sm:shadow-2xl p-1.5 sm:p-2 md:p-3">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 sm:w-14 md:w-20 h-0.5 rounded-full bg-[#0a0d12] z-10" />
            <div className="relative w-full h-full rounded-lg sm:rounded-[20px] md:rounded-[28px] bg-gradient-to-b from-[#10182a] to-[#0a0d12] overflow-hidden flex flex-col">
              {/* Status bar */}
              <div className="flex items-center justify-between px-2 sm:px-3 md:px-4 pt-1 sm:pt-2 md:pt-3 text-[7px] sm:text-[8px] md:text-[9px] text-white/70">
                <span>9:41</span>
                <span className="flex items-center gap-0.5">
                  <span className="w-2 sm:w-3 h-1 sm:h-1.5 rounded-sm border border-white/70" />
                </span>
              </div>
              {/* App content */}
              <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 text-center gap-1.5 sm:gap-2 md:gap-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Eye className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-[8px] sm:text-[10px] md:text-xs tracking-[0.2em] text-blue-400 font-semibold uppercase">
                  CivicEye
                </p>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-400">
                  Tap to report a civic issue
                </p>
                <button className="w-full mt-0.5 sm:mt-1 md:mt-2 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] sm:text-[11px] md:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 shadow-lg">
                  <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  REPORT CIVIC ISSUE
                </button>
                <p className="text-[7px] sm:text-[8px] md:text-[9px] text-slate-600 mt-0.5 leading-tight px-1">
                  Record a short live video of the issue
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-[9px] sm:text-[10px] md:text-xs text-slate-500 mt-1.5 sm:mt-2 md:mt-3 px-2">
          Citizen taps &ldquo;REPORT CIVIC ISSUE&rdquo;
        </p>
      </div>
    </SceneShell>
  );
}

/* ---------- SCENE 1: THE PROBLEM ---------- */
function TheProblemScene() {
  return (
    <SceneShell>
      <div className="w-full h-full absolute inset-0">
        {/* City environment - stylized illustration using gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d12] via-[#10182a] to-[#0f1419]" />
        {/* Skyline silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent">
          <svg
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-full h-full opacity-50"
          >
            <path
              d="M0,100 L0,70 L20,70 L20,50 L40,50 L40,60 L60,60 L60,30 L80,30 L80,55 L100,55 L100,40 L130,40 L130,65 L150,65 L150,25 L180,25 L180,45 L200,45 L200,60 L230,60 L230,35 L260,35 L260,55 L290,55 L290,40 L320,40 L320,70 L350,70 L350,50 L380,50 L380,65 L400,65 L400,100 Z"
              fill="#1a1f2e"
            />
            <g fill="#fbbf24" opacity="0.6">
              <rect x="65" y="35" width="2" height="3" />
              <rect x="72" y="40" width="2" height="3" />
              <rect x="155" y="30" width="2" height="3" />
              <rect x="165" y="35" width="2" height="3" />
              <rect x="172" y="42" width="2" height="3" />
              <rect x="265" y="40" width="2" height="3" />
              <rect x="272" y="45" width="2" height="3" />
              <rect x="295" y="45" width="2" height="3" />
              <rect x="305" y="50" width="2" height="3" />
            </g>
          </svg>
        </div>

        {/* Civic problem markers floating across the screen */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-6 max-w-3xl">
            {[
              { Icon: Construction, label: "Pothole" },
              { Icon: Trash2, label: "Garbage" },
              { Icon: Lightbulb, label: "Broken Streetlight", highlight: true },
              { Icon: Droplet, label: "Water Leak" },
            ].map(({ Icon, label, highlight }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-sm border ${highlight ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-white/10'}`}
                style={{ animation: `fadeIn 0.6s ease-out ${i * 0.15}s both` }}
              >
                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full ${highlight ? 'bg-amber-500/20 border-amber-500/40' : 'bg-red-500/15 border-red-500/30'} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${highlight ? 'text-amber-400' : 'text-red-400'}`} />
                </div>
                <span className={`text-[9px] sm:text-[11px] font-medium uppercase tracking-wider ${highlight ? 'text-amber-300' : 'text-white/80'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p
            className="text-white text-base sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 drop-shadow-2xl"
            style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}
          >
            THE CITY HAS PROBLEMS.
          </p>
          <p
            className="text-amber-300 text-xs sm:text-sm md:text-base font-semibold tracking-wider"
            style={{ animation: "fadeIn 0.8s ease-out 0.9s both" }}
          >
            BUT REPORTING THEM IS STILL SLOW.
          </p>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </SceneShell>
  );
}

function RecordVideoScene({ progress }: { progress: number }) {
  const secs = Math.min(8, Math.max(0, Math.round((progress / 100) * 8)));
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-2 sm:gap-3">
        {/* Caption */}
        <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-600/20 border border-blue-500/40 backdrop-blur-sm shrink-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-widest text-blue-300">
            RECORDING CIVIC EVIDENCE
          </span>
        </div>

        {/* Phone camera frame — scaled for 16:9 */}
        <div className="mx-auto w-20 sm:w-48 md:w-64 relative shrink-0">
          <div className="relative aspect-[9/16] sm:aspect-[9/19] rounded-xl sm:rounded-[28px] bg-black border border-[#2e3548] sm:border-2 shadow-xl sm:shadow-2xl p-1.5 sm:p-2 md:p-3">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 sm:w-14 md:w-20 h-0.5 rounded-full bg-[#0a0d12] z-10" />
            <div className="relative w-full h-full rounded-md sm:rounded-[20px] md:rounded-[28px] bg-gradient-to-b from-[#0f1419] via-[#1a1f2e] to-[#0a0d12] overflow-hidden flex flex-col">
              {/* Camera preview area - broken streetlight at night */}
              <div className="relative flex-1 bg-gradient-to-b from-[#0a0d12] via-[#111827] to-[#1f2937]">
                {/* Night sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b1026] via-[#111827] to-[#1f2937]" />
                {/* Street / ground */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f1419] to-transparent" />
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1.5 sm:h-2 md:h-3 bg-[#1a1f2e] rounded-full blur-sm" />
                {/* Streetlight pole */}
                <div className="absolute bottom-0 right-[25%] w-1.5 sm:w-2 h-3/5 bg-gradient-to-t from-[#374151] to-[#6b7280]" />
                {/* Broken streetlight arm */}
                <div className="absolute top-[28%] right-[22%] w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-[#6b7280] rounded-full rotate-[-8deg]" />
                {/* Broken streetlight head - tilted/damaged */}
                <div className="absolute top-[24%] right-[18%] w-5 h-3 sm:w-6 sm:h-4 md:w-8 md:h-5 bg-[#4b5563] rounded-sm rotate-[-12deg] border border-[#6b7280]" />
                {/* No glow - light is broken */}
                <div className="absolute top-[26%] right-[19%] w-4 h-2 sm:w-5 sm:h-3 md:w-6 md:h-4 bg-black/60 rounded-sm rotate-[-12deg]" />
                {/* AI targeting box */}
                <div className="absolute top-[18%] right-[14%] w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-20 border border-blue-400/70 rounded-sm">
                  <span className="absolute -top-3 sm:-top-4 left-0 px-0.5 sm:px-1 text-[7px] sm:text-[8px] md:text-[9px] bg-blue-500 text-white font-bold">
                    BROKEN STREETLIGHT
                  </span>
                  <span className="absolute -bottom-3 sm:-bottom-4 left-0 text-[7px] sm:text-[8px] md:text-[9px] text-blue-300 font-mono">
                    AI VISION
                  </span>
                </div>
                {/* REC indicator */}
                <div className="absolute top-1.5 sm:top-2 md:top-3 left-1.5 sm:left-2 md:left-3 flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full bg-red-600/90 text-white z-10">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-bold tracking-wider">
                    REC 00:0{secs}
                  </span>
                </div>
                {/* Location permission banner */}
                <div className="absolute top-1.5 sm:top-2 md:top-3 right-1.5 sm:right-2 md:right-3 flex items-center gap-0.5 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-600/80 text-white z-10">
                  <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] font-semibold">GPS</span>
                </div>
                {/* Instruction */}
                <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-3 left-0 right-0 text-center">
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/80 bg-black/50 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Keep the issue in frame
                  </span>
                </div>
              </div>
              {/* Bottom camera UI */}
              <div className="bg-black/80 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 flex items-center justify-around">
                <div className="text-[7px] sm:text-[8px] md:text-[10px] text-white/60">GALLERY</div>
                <button className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white border-2 sm:border-4 border-white/30 flex items-center justify-center shadow-2xl">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-red-600" />
                  <span className="absolute -inset-0.5 sm:-inset-1 rounded-full border border-red-500/40 animate-pulse" />
                </button>
                <button className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay caption */}
        <p
          className="text-center text-[9px] sm:text-[10px] md:text-xs text-amber-300 font-semibold tracking-wider px-2"
          style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
        >
          5–10 SECOND LIVE VIDEO
        </p>
        <p className="text-center text-[9px] sm:text-[10px] md:text-xs text-slate-500 px-2">
          Issue: <span className="text-white font-semibold">BROKEN STREETLIGHT</span>
        </p>
        <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      </div>
    </SceneShell>
  );
}

function VideoPreviewScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-xs sm:max-w-sm mx-auto">
        <SceneTitle title="VIDEO PREVIEW" subtitle="Confirm evidence" />
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#2e3548] bg-black mb-3">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d12] via-[#111827] to-[#1f2937]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] sm:text-[10px] font-mono">
            0:08
          </span>
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-blue-500/90 text-white text-[8px] sm:text-[9px] font-bold">
            BROKEN STREETLIGHT
          </span>
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400">
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Video captured
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400">
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Issue detected: Broken Streetlight
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-[#2e3548] bg-[#0f1419] text-slate-200 text-[11px] sm:text-xs font-medium">
            Retake
          </button>
          <button className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] sm:text-xs font-semibold">
            Use This Video
          </button>
        </div>
      </div>
    </SceneShell>
  );
}

function LocationVerifiedScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="LOCATION VERIFIED"
          subtitle="Every report is geo-tagged"
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          {/* Map */}
          <div className="relative w-full aspect-square sm:aspect-video rounded-xl overflow-hidden border border-[#2e3548] bg-gradient-to-br from-[#10182a] to-[#0a0d12]">
            <div className="absolute inset-0 map-grid opacity-40" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <path
                d="M 10 80 Q 30 60, 50 50 T 90 20"
                stroke="#3b82f6"
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M 10 30 Q 40 40, 60 60 T 90 70"
                stroke="#3b82f6"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
            </svg>
            {/* Marker with pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-blue-500/30 animate-ping" />
                <span className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </span>
              </div>
            </div>
          </div>
          {/* Details */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold tracking-wider">
                LOCATION DETECTED
              </span>
            </div>
            <p className="text-white text-sm sm:text-base font-bold break-words">
              Mansarovar, Jaipur
              <br />
              <span className="text-slate-400 text-xs sm:text-sm font-normal">
                Rajasthan, India
              </span>
            </p>
            <div className="space-y-1 text-[10px] sm:text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Latitude</span>
                <span className="text-white font-mono">26.8672° N</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Longitude</span>
                <span className="text-white font-mono">75.7567° E</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-blue-300 mt-3 sm:mt-4 font-semibold tracking-wider">
          EVERY REPORT IS GEO-TAGGED
        </p>
      </div>
    </SceneShell>
  );
}

function AIVisionScene({ progress }: { progress: number }) {
  const stage = Math.min(2, Math.floor((progress / 100) * 3));
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="AI VISION ANALYSIS"
          subtitle={
            stage < 1
              ? "Scanning video frames..."
              : stage < 2
                ? "Detecting civic issue..."
                : "Analysis complete"
          }
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {/* Video frame with scan line */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#2e3548] bg-gradient-to-br from-[#0a0d12] via-[#111827] to-[#1f2937]">
            <div className="absolute inset-0">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-5 sm:w-16 sm:h-8 rounded-[50%] bg-black/80" />
            </div>
            {/* Scan line */}
            {stage < 2 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                style={{
                  top: `${(progress * 0.9) % 100}%`,
                  transition: "top 0.05s linear",
                }}
              />
            )}
            {/* Bounding box around broken streetlight */}
            {stage >= 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-8 sm:w-20 sm:h-10 border-2 border-blue-400 rounded">
                <span className="absolute -top-5 left-0 px-1 text-[8px] sm:text-[9px] bg-blue-500 text-white font-bold">
                  BROKEN STREETLIGHT 94%
                </span>
              </div>
            )}
            {stage >= 2 && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[8px] sm:text-[9px] font-bold">
                ✓ DETECTED
              </div>
            )}
          </div>
          {/* Results */}
          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Detected Issue
              </p>
              <p className="text-white font-bold">Broken Streetlight</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                AI Confidence
              </p>
              <p className="text-blue-400 font-bold text-base sm:text-lg">94%</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Severity
              </p>
              <p className="text-red-400 font-bold">HIGH</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Recommended Department
              </p>
              <p className="text-white font-bold">Electrical / Street Lighting</p>
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function AuthenticityScene({ progress }: { progress: number }) {
  const checks = [
    { label: "Frame consistency" },
    { label: "Motion consistency" },
    { label: "Visual artifacts" },
    { label: "Temporal consistency" },
  ];
  const completedCount = Math.min(
    checks.length,
    Math.ceil((progress / 100) * (checks.length + 1))
  );
  const isComplete = completedCount > checks.length;
  const status = isComplete ? "LIKELY AUTHENTIC" : "ANALYZING";
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="AUTHENTICITY CHECK"
          subtitle="Analyzing visual consistency"
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          <div className="space-y-1.5 sm:space-y-2">
            {checks.map((c, i) => {
              const done = i < completedCount;
              return (
                <div
                  key={c.label}
                  className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548] text-[10px] sm:text-xs"
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 animate-spin shrink-0" />
                  )}
                  <span className={done ? "text-emerald-400" : "text-blue-300"}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            <p className="text-emerald-400 text-sm sm:text-base font-bold text-center">
              {status}
            </p>
            {isComplete && (
              <p className="text-[10px] sm:text-xs text-slate-400 text-center">
                Confidence: 92%
              </p>
            )}
          </div>
        </div>
        <p className="text-center text-[9px] sm:text-[10px] text-slate-500 mt-3 sm:mt-4 px-2 leading-relaxed">
          No definitive guarantee &mdash; risk assessment based on available
          visual evidence.
        </p>
      </div>
    </SceneShell>
  );
}

function PriorityEngineScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="PRIORITY ENGINE"
          subtitle="Severity + impact = priority"
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
            {[
              { l: "Severity", v: "HIGH", color: "text-red-400" },
              { l: "Public Impact", v: "HIGH", color: "text-red-400" },
              { l: "Location Risk", v: "MEDIUM", color: "text-amber-400" },
              { l: "Duplicate Reports", v: "2", color: "text-blue-400" },
            ].map((row) => (
              <div
                key={row.l}
                className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]"
              >
                <span className="text-slate-400">{row.l}</span>
                <span className={`font-bold ${row.color}`}>{row.v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#2e3548"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${87 * 2.64} ${100 * 2.64}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  87
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400">
                  /100
                </span>
              </div>
            </div>
            <p className="text-orange-400 text-sm sm:text-base font-bold">
              HIGH PRIORITY
            </p>
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-3 sm:mt-4 px-2">
          Priority helps municipal teams focus on high-impact issues first.
        </p>
      </div>
    </SceneShell>
  );
}

function DuplicateScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="DUPLICATE DETECTION"
          subtitle="Checking nearby reports"
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {/* Map with markers */}
          <div className="relative w-full aspect-square sm:aspect-video rounded-xl overflow-hidden border border-[#2e3548] bg-gradient-to-br from-[#10182a] to-[#0a0d12]">
            <div className="absolute inset-0 map-grid opacity-40" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <path
                d="M 5 50 L 95 50"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>
            {/* Current location */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping" />
                <span className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </span>
              </div>
            </div>
            {/* Nearby report */}
            <div
              className="absolute"
              style={{ top: "30%", left: "62%" }}
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[8px] sm:text-[9px] text-amber-300 font-bold whitespace-nowrap">
                120m
              </span>
            </div>
            {/* Another */}
            <div
              className="absolute"
              style={{ top: "70%", left: "25%" }}
            >
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>
          </div>
          {/* Result */}
          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
            <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-300 font-bold text-[11px] sm:text-xs mb-1.5">
                ⚠ SIMILAR REPORT FOUND
              </p>
              <div className="space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Distance</span>
                  <span className="text-white font-bold">120 m</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Similarity</span>
                  <span className="text-white font-bold">87%</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Existing</span>
                  <span className="text-white font-mono">#CIV-1019</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button className="min-h-[36px] px-2 py-1.5 rounded-lg border border-[#2e3548] bg-[#0f1419] text-slate-200 text-[10px] sm:text-xs font-medium">
                View Existing
              </button>
              <button className="min-h-[36px] px-2 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] sm:text-xs font-semibold">
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function SubmitScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle title="CIVICEYE REPORT" subtitle="Ready to submit" />
        <div className="bg-[#1e2433] rounded-xl border border-[#2e3548] p-3 sm:p-4 space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs mb-3 sm:mb-4">
          {[
            { l: "Issue", v: "Broken Streetlight" },
            { l: "Location", v: "📍 Detected Location" },
            { l: "Severity", v: <span className="text-red-400 font-bold">HIGH</span> },
            { l: "Priority", v: <span className="text-orange-400 font-bold">87</span> },
            {
              l: "Authenticity",
              v: <span className="text-emerald-400 font-bold">LIKELY AUTHENTIC</span>,
            },
            {
              l: "Duplicate",
              v: <span className="text-amber-400 font-bold">Similar report detected</span>,
            },
            {
              l: "Department",
              v: <span className="text-blue-400 font-bold">Electrical / Street Lighting</span>,
            },
          ].map((row) => (
            <div
              key={row.l}
              className="flex items-center justify-between gap-2 min-w-0"
            >
              <span className="text-slate-500 shrink-0">{row.l}</span>
              <span className="text-white font-medium truncate text-right">
                {row.v}
              </span>
            </div>
          ))}
        </div>
        <button className="w-full min-h-[44px] py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> SUBMIT REPORT
        </button>
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-emerald-400 text-[11px] sm:text-xs font-bold">
            ✓ REPORT SUBMITTED
          </p>
          <p className="text-white text-base sm:text-lg font-mono font-bold mt-1">
            CE-2026-A4821
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

function CommandCenterScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wider">
            CIVICEYE COMMAND CENTER
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {[
            { v: "2,481", l: "Total Reports", color: "text-blue-400" },
            { v: "847", l: "Active", color: "text-amber-400" },
            { v: "192", l: "High Priority", color: "text-red-400" },
            { v: "1,932", l: "Resolved", color: "text-emerald-400" },
          ].map((s) => (
            <div
              key={s.l}
              className="p-1.5 sm:p-2.5 rounded-lg bg-[#1e2433]/80 border border-[#2e3548] min-w-0"
            >
              <p className={`text-sm sm:text-lg font-bold ${s.color} truncate`}>
                {s.v}
              </p>
              <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider truncate">
                {s.l}
              </p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Map */}
          <div className="sm:col-span-2 relative w-full aspect-video rounded-xl overflow-hidden border border-[#2e3548] bg-gradient-to-br from-[#10182a] to-[#0a0d12]">
            <div className="absolute inset-0 map-grid opacity-40" />
            <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
              <path
                d="M 5 30 L 95 30"
                stroke="#3b82f6"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <path
                d="M 50 5 L 50 55"
                stroke="#3b82f6"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </svg>
            {[
              { x: 20, y: 25, color: "bg-red-500", label: "CRITICAL" },
              { x: 40, y: 40, color: "bg-orange-500", label: "HIGH" },
              { x: 65, y: 30, color: "bg-amber-500", label: "MEDIUM" },
              { x: 75, y: 50, color: "bg-blue-500", label: "MEDIUM" },
              { x: 30, y: 60, color: "bg-emerald-500", label: "RESOLVED" },
              { x: 80, y: 18, color: "bg-emerald-500", label: "RESOLVED" },
            ].map((m, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                <span
                  className={`absolute -inset-1 rounded-full ${m.color} opacity-40 animate-ping`}
                />
                <span
                  className={`relative w-3 h-3 sm:w-4 sm:h-4 rounded-full ${m.color} border-2 border-white block`}
                />
              </div>
            ))}
            {/* New report notification */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 max-w-[60%] p-1.5 sm:p-2 rounded-lg bg-blue-600/90 border border-blue-400 backdrop-blur-sm">
              <p className="text-[8px] sm:text-[9px] text-white/80 font-semibold tracking-wider">
                NEW CIVIC REPORT
              </p>
              <p className="text-[9px] sm:text-[10px] text-white font-bold">
                Broken Streetlight · High Priority
              </p>
              <p className="text-[8px] sm:text-[9px] text-white/70">
                📍 Location Verified
              </p>
            </div>
          </div>
          {/* New report list */}
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-bold text-white tracking-wider">
              INCOMING
            </p>
            {[
              { id: "CE-2026-A4821", t: "Broken Streetlight", p: "HIGH", c: "text-red-400" },
              { id: "CE-2026-A4820", t: "Pothole", p: "MED", c: "text-amber-400" },
              { id: "CE-2026-A4819", t: "Garbage", p: "LOW", c: "text-blue-400" },
            ].map((r) => (
              <div
                key={r.id}
                className="p-1.5 sm:p-2 rounded-lg bg-[#1e2433] border border-[#2e3548]"
              >
                <p className="text-[9px] sm:text-[10px] text-white font-mono truncate">
                  {r.id}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 truncate">
                    {r.t}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-bold ${r.c} shrink-0`}>
                    {r.p}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function AssignDepartmentScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="DEPARTMENT ASSIGNMENT"
          subtitle="AI routes the report"
        />
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 text-center">
          <p className="text-[10px] sm:text-xs tracking-widest text-blue-300 font-semibold mb-1">
            AI RECOMMENDED DEPARTMENT
          </p>
          <p className="text-base sm:text-lg font-bold text-white">
            Electrical / Street Lighting
          </p>
        </div>
        <button className="w-full min-h-[44px] py-2.5 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <CheckCircle2 className="w-4 h-4" /> ASSIGN COMPLAINT
        </button>
        <ol className="space-y-1.5 sm:space-y-2">
          {STATUS_FLOW.slice(0, 3).map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-[10px] sm:text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-[11px] sm:text-xs text-emerald-300 font-semibold flex-1">
                {s}
              </span>
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </li>
          ))}
        </ol>
      </div>
    </SceneShell>
  );
}

function MunicipalActionScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="MUNICIPAL ACTION"
          subtitle="Department begins work"
        />
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Complaint
              </p>
              <p className="text-white font-mono">CE-2026-A4821</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Issue
              </p>
              <p className="text-white font-bold">Broken Streetlight</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#1e2433] border border-[#2e3548]">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Department
              </p>
              <p className="text-blue-400 font-bold">Electrical / Street Lighting</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">
                Status
              </p>
              <p className="text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> IN PROGRESS
              </p>
            </div>
          </div>
          <div className="relative w-full aspect-square sm:aspect-auto rounded-xl overflow-hidden border border-[#2e3548] bg-gradient-to-br from-[#10182a] to-[#0a0d12]">
            <div className="absolute inset-0 map-grid opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-amber-500/30 animate-ping" />
                <span className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500 border-2 border-white shadow-lg">
                  <Construction className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </span>
              </div>
            </div>
            <p className="absolute bottom-2 sm:bottom-3 left-0 right-0 text-center text-[10px] sm:text-xs text-amber-300 font-bold">
              Crew dispatched
            </p>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

const STATUS_FLOW = [
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
];

function ResolutionScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-md mx-auto">
        <SceneTitle
          title="ISSUE RESOLVED"
          subtitle="From report to fix in record time"
        />
        <ol className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
          {STATUS_FLOW.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0"
            >
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border bg-emerald-500/15 border-emerald-500/40 text-emerald-300">
                {s}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <span className="w-3 sm:w-4 h-px bg-emerald-500" />
              )}
            </li>
          ))}
        </ol>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-base sm:text-lg font-bold">
            RESOLVED ✓
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

function CityImpactScene() {
  return (
    <SceneShell>
      <div className="w-full max-w-3xl mx-auto">
        <SceneTitle title="CITY IMPACT" subtitle="Measurable results" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {[
            { v: "2,481", l: "REPORTS", Icon: BarChart3, c: "text-blue-400" },
            { v: "1,932", l: "RESOLVED", Icon: CheckCircle2, c: "text-emerald-400" },
            { v: "78%", l: "RESOLUTION RATE", Icon: TrendingUp, c: "text-amber-400" },
            { v: "18 min", l: "AVG. RESPONSE", Icon: Clock, c: "text-purple-400" },
          ].map((s) => {
            const I = s.Icon;
            return (
              <div
                key={s.l}
                className="p-2 sm:p-3 rounded-xl bg-[#1e2433] border border-[#2e3548] text-center"
              >
                <I className={`w-4 h-4 sm:w-5 sm:h-5 ${s.c} mx-auto mb-1`} />
                <p className={`text-base sm:text-xl font-bold ${s.c} tabular-nums`}>
                  {s.v}
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                  {s.l}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[9px] sm:text-[10px] text-slate-500 italic">
          * Demo data for illustration
        </p>
      </div>
    </SceneShell>
  );
}

function FinaleScene({ progress }: { progress: number }) {
  const line = Math.min(2, Math.floor((progress / 100) * 3));
  const lines = [
    "SEE THE ISSUE.",
    "PRIORITIZE THE IMPACT.",
    "FIX THE CITY.",
  ];
  return (
    <SceneShell>
      <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-[#0a0d12] via-[#10182a] to-[#0f1419]">
        <div className="absolute inset-0 map-grid opacity-20" />
        <div className="relative w-full h-full flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] sm:text-xs tracking-[0.4em] text-blue-400 font-bold uppercase mb-3 sm:mb-5">
            CIVICEYE
          </p>
          <div className="space-y-1 sm:space-y-2 max-w-2xl">
            {lines.map((l, i) => (
              <p
                key={l}
                className="text-lg sm:text-2xl md:text-4xl font-bold text-white leading-tight"
                style={{
                  opacity: i <= line ? 1 : 0.15,
                  transform: i <= line ? "translateY(0)" : "translateY(8px)",
                  transition: "all 0.5s ease-out",
                }}
              >
                {l}
              </p>
            ))}
          </div>
          <p
            className="text-[10px] sm:text-xs text-slate-400 mt-4 sm:mt-6 max-w-md px-2"
            style={{
              opacity: line >= 2 ? 1 : 0,
              transition: "opacity 0.6s ease-out",
            }}
          >
            AI-powered civic intelligence for faster, smarter urban response.
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

export default CivicEyeDemoSimulation;
