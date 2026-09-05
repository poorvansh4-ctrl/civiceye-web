"use client";

import dynamic from "next/dynamic";

const Civic3DSceneInner = dynamic(
  () => import("./civic-3d-scene").then((mod) => mod.Civic3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading 3D City...</p>
        </div>
      </div>
    ),
  }
);

export function Civic3DSceneWrapper() {
  return (
    <div className="absolute inset-0 z-0">
      <Civic3DSceneInner />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d12] via-transparent to-[#0a0d12] pointer-events-none" />
      <div className="absolute inset-0 bg-[#0a0d12]/40 pointer-events-none" />
    </div>
  );
}
