"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  Gauge,
  GitMerge,
  Building2,
  CircleCheck,
  Play,
} from "lucide-react";

// Lazy-load the cinematic simulation.
const CivicEyeDemoSimulation = dynamic(
  () =>
    import("./civic-eye-demo-simulation").then(
      (m) => m.CivicEyeDemoSimulation
    ),
  { ssr: false }
);

interface CivicEyeDemoVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
  autoLoad?: boolean;
}

const WORKFLOW_STEPS = [
  {
    icon: Sparkles,
    label: "LIVE EVIDENCE",
    desc: "Record short video",
  },
  {
    icon: MapPin,
    label: "LOCATION VERIFIED",
    desc: "GPS + reverse geocode",
  },
  {
    icon: ScanEye,
    label: "AI VISION ANALYSIS",
    desc: "Detect civic issue",
  },
  {
    icon: ShieldCheck,
    label: "AUTHENTICITY CHECK",
    desc: "Real-world evidence",
  },
  {
    icon: GitMerge,
    label: "DUPLICATE DETECTION",
    desc: "Match nearby reports",
  },
  {
    icon: Gauge,
    label: "PRIORITY ENGINE",
    desc: "Severity & urgency",
  },
  {
    icon: Building2,
    label: "MUNICIPAL ACTION",
    desc: "Routed to department",
  },
];

function ScanEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function CivicEyeDemoVideo({
  videoSrc,
  posterSrc,
  title = "CIVICEYE IN ACTION",
  subtitle = "SEE THE ISSUE. PRIORITIZE THE IMPACT. FIX THE CITY.",
  autoLoad = true,
}: CivicEyeDemoVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(autoLoad);
  const [posterFailed, setPosterFailed] = useState(false);

  // Simulation gate.
  const [simPlayKey, setSimPlayKey] = useState(0);

  // Lazy-load the video when it enters the viewport.
  useEffect(() => {
    if (autoLoad) return;

    const el = containerRef.current;

    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      {
        rootMargin: "200px 0px",
      }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [autoLoad]);

  const startSimulation = () => {
    setSimPlayKey((key) => key + 1);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-5xl mx-auto px-1 sm:px-0"
    >
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs font-bold text-blue-400 tracking-[0.3em] uppercase mb-2">
          AI-Powered Civic Issue Intelligence
        </p>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 px-2 tracking-tight">
          {title}
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium px-4">
          {subtitle}
        </p>
      </div>

      {/* Video Container */}
      <div
        className="
          relative
          w-full
          aspect-video
          overflow-hidden
          rounded-2xl
          bg-[#1a1f2e]
          border
          border-[#2e3548]
          shadow-2xl
          shadow-black/50
        "
      >
        {/* REAL VIDEO */}
        {videoSrc && isInView ? (
          <video
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
              bg-black
            "
            poster={posterSrc}
            preload="metadata"
            playsInline
            muted
            autoPlay
            loop
            controls={false}
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
          >
            <source src={videoSrc} type="video/mp4" />

            Your browser does not support the video tag.
          </video>
        ) : !videoSrc && isInView ? (
          /* CINEMATIC SIMULATION */
          <div className="relative w-full h-full">
            <CivicEyeDemoSimulation
              key={simPlayKey}
              embedded
              autoStart={simPlayKey > 0}
            />

            {/* Simulation Play Button */}
            {simPlayKey === 0 && (
              <button
                type="button"
                onClick={startSimulation}
                aria-label="Play CivicEye demo"
                className="
                  absolute
                  inset-0
                  z-20
                  flex
                  flex-col
                  items-center
                  justify-center
                  bg-black/55
                  hover:bg-black/45
                  transition-colors
                  group/play
                "
              >
                <span className="relative">
                  <span
                    className="
                      absolute
                      inset-0
                      rounded-full
                      bg-blue-500/30
                      blur-2xl
                      group-hover/play:bg-blue-500/50
                      transition-colors
                    "
                  />

                  <span
                    className="
                      relative
                      w-20
                      h-20
                      sm:w-24
                      sm:h-24
                      md:w-28
                      md:h-28
                      rounded-full
                      bg-white/10
                      backdrop-blur-md
                      border-2
                      border-white/30
                      flex
                      items-center
                      justify-center
                      group-hover/play:scale-110
                      group-hover/play:border-blue-400/60
                      transition-all
                      shadow-2xl
                    "
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white ml-1" />
                  </span>
                </span>

                <span
                  className="
                    mt-3
                    sm:mt-4
                    px-3
                    sm:px-4
                    py-1.5
                    rounded-full
                    bg-white/5
                    border
                    border-white/15
                    backdrop-blur-sm
                  "
                >
                  <span
                    className="
                      text-[11px]
                      sm:text-xs
                      font-bold
                      tracking-[0.25em]
                      text-white
                      uppercase
                    "
                  >
                    Play CivicEye Demo
                  </span>
                </span>
              </button>
            )}
          </div>
        ) : (
          /* POSTER */
          <DemoPoster
            posterSrc={
              posterSrc && !posterFailed ? posterSrc : undefined
            }
            onPosterError={() => setPosterFailed(true)}
          />
        )}
      </div>

      {/* Workflow Step Strip */}
      <ol
        className="
          mt-6
          sm:mt-8
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-7
          gap-2
          sm:gap-3
          px-0
          sm:px-1
        "
      >
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;

          return (
            <li
              key={step.label}
              className="
                relative
                flex
                flex-col
                items-center
                text-center
                gap-1.5
                p-2.5
                sm:p-3
                rounded-xl
                bg-gradient-to-br
                from-[#1a1f2e]/70
                to-[#0f1419]/50
                border
                border-[#2e3548]
                hover:border-blue-500/30
                transition-colors
              "
            >
              <span
                className="
                  flex
                  items-center
                  gap-1.5
                  text-[10px]
                  font-bold
                  text-blue-400
                  tracking-widest
                "
              >
                <span
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-5
                    h-5
                    rounded-full
                    bg-blue-500/15
                    border
                    border-blue-500/30
                    text-[10px]
                  "
                >
                  {index + 1}
                </span>

                <CircleCheck className="w-3 h-3" />
              </span>

              <Icon className="w-5 h-5 text-blue-400" />

              <span
                className="
                  text-[11px]
                  sm:text-xs
                  font-semibold
                  text-white
                  leading-tight
                "
              >
                {step.label}
              </span>

              <span
                className="
                  text-[10px]
                  sm:text-[11px]
                  text-slate-500
                  leading-tight
                "
              >
                {step.desc}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Poster shown when the real video isn't currently loaded.
 */
function DemoPoster({
  posterSrc,
  onPosterError,
}: {
  posterSrc?: string;
  onPosterError: () => void;
}) {
  return (
    <div className="absolute inset-0 w-full h-full">
      {posterSrc ? (
        <img
          src={posterSrc}
          alt="CivicEye demo preview"
          loading="lazy"
          onError={onPosterError}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="
            relative
            w-full
            h-full
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-[#0f1419]
            via-[#10182a]
            to-[#1a1f2e]
          "
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 map-grid opacity-30"
            aria-hidden="true"
          />

          <div
            className="
              relative
              text-center
              px-4
              sm:px-6
              max-w-xl
              w-full
            "
          >
            {/* Live badge */}
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1
                rounded-full
                bg-white/5
                border
                border-white/10
                backdrop-blur-sm
                mb-4
              "
            >
              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-emerald-500
                  animate-pulse
                "
              />

              <span
                className="
                  text-[10px]
                  sm:text-xs
                  tracking-widest
                  text-emerald-400
                  font-semibold
                  uppercase
                "
              >
                CivicEye Live
              </span>
            </div>

            <p
              className="
                text-white/90
                text-lg
                sm:text-2xl
                font-bold
                mb-1
              "
            >
              From a citizen&apos;s phone
            </p>

            <p
              className="
                text-white/60
                text-sm
                sm:text-base
                mb-4
                sm:mb-5
              "
            >
              to a city-wide action.
            </p>

            {/* Mini workflow */}
            <ol
              className="
                grid
                grid-cols-2
                sm:grid-cols-4
                gap-2
                sm:gap-3
                mb-5
                text-left
              "
            >
              {[
                {
                  step: "01",
                  label: "Record",
                },
                {
                  step: "02",
                  label: "AI Analysis",
                },
                {
                  step: "03",
                  label: "Priority",
                },
                {
                  step: "04",
                  label: "Assigned",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="
                    flex
                    items-center
                    gap-2
                    px-2.5
                    py-2
                    rounded-lg
                    bg-white/5
                    border
                    border-white/10
                    backdrop-blur-sm
                    min-w-0
                  "
                >
                  <span
                    className="
                      text-[10px]
                      font-bold
                      text-blue-400
                      shrink-0
                    "
                  >
                    {item.step}
                  </span>

                  <span
                    className="
                      text-[11px]
                      sm:text-xs
                      text-white/80
                      truncate
                    "
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ol>

            <p
              className="
                text-[10px]
                sm:text-xs
                text-slate-500
                mt-2
              "
            >
              Demo video coming soon &mdash; full workflow shown below
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CivicEyeDemoVideo;