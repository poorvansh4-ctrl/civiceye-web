import Link from "next/link";
import { ScanEye, Gauge, GitMerge, Building2, MapPin, CheckCircle2, UserCheck, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CivicEyeDemoVideo } from "@/components/civic-eye-demo-video";
import { Civic3DSceneWrapper } from "@/components/civic-3d-scene-wrapper";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0d12] text-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* 3D Background */}
          <Civic3DSceneWrapper />

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto text-center px-4 py-32">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">AI-Powered Civic Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                THE CITY HAS
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                PROBLEMS.
              </span>
              <br />
              <span className="text-white">NOW IT CAN SEE THEM.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
              AI-powered civic intelligence that turns citizen reports into prioritized, actionable solutions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/report">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white w-full sm:w-auto text-lg h-14 px-10 rounded-full shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
                >
                  REPORT AN ISSUE
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg h-14 px-10 rounded-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  ENTER CITY COMMAND
                </Button>
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-slate-500 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* How CivicEye Works */}
        <section className="py-16 sm:py-24 md:py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16 md:mb-20">
              <p className="text-sm font-medium text-blue-400 tracking-wider uppercase mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                From Report to Resolution
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg px-2">
                A seamless, automated pipeline powered by artificial intelligence.
              </p>
            </div>

            <div className="relative">
              {/* Connecting Line — desktop only */}
              <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#2e3548] to-transparent" />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
                {[
                  { icon: Sparkles, label: "LIVE EVIDENCE", desc: "Record short video", num: "01" },
                  { icon: MapPin, label: "LOCATION VERIFIED", desc: "GPS + reverse geocode", num: "02" },
                  { icon: ScanEye, label: "AI VISION ANALYSIS", desc: "Detects the issue", num: "03" },
                  { icon: ShieldCheck, label: "AUTHENTICITY CHECK", desc: "Real evidence check", num: "04" },
                  { icon: GitMerge, label: "DUPLICATE DETECTION", desc: "Merges nearby reports", num: "05" },
                  { icon: Gauge, label: "PRIORITY ENGINE", desc: "Severity score", num: "06" },
                  { icon: UserCheck, label: "MUNICIPAL ACTION", desc: "Routed to dept", num: "07" },
                ].map((step, index) => (
                  <div key={index} className="relative flex flex-col items-center text-center group min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-[100px] md:h-[100px] lg:w-[120px] lg:h-[120px] rounded-2xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#2e3548] flex items-center justify-center mb-3 sm:mb-5 md:mb-6 relative group-hover:border-blue-500/30 transition-all duration-300 shadow-xl shadow-black/20">
                      <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0a0d12] border border-[#2e3548] text-[10px] sm:text-xs font-bold text-blue-400 flex items-center justify-center">
                        {step.num}
                      </span>
                      <step.icon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-blue-400" />
                    </div>
                    <h4 className="text-[11px] sm:text-sm md:text-base font-bold text-white mb-1 leading-tight px-1">
                      {step.label}
                    </h4>
                    <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm leading-tight px-1">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Demo Video */}
        <section className="py-16 sm:py-24 md:py-32 px-4 relative bg-gradient-to-b from-transparent via-[#0f1419]/50 to-transparent">
          <CivicEyeDemoVideo />
        </section>

        {/* AI Intelligence Features */}
        <section className="py-16 sm:py-24 md:py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <p className="text-sm font-medium text-blue-400 tracking-wider uppercase mb-4">AI Intelligence</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Powered by Advanced AI
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg px-2">
                Cutting-edge artificial intelligence transforms how cities handle civic issues.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: ScanEye,
                  title: "AI Issue Detection",
                  desc: "Vision AI automatically detects and classifies civic issues from a short live video recorded on the citizen's phone.",
                },
                {
                  icon: Gauge,
                  title: "Smart Priority Scoring",
                  desc: "AI calculates a 0-100 priority score based on severity, location, and urgency.",
                },
                {
                  icon: GitMerge,
                  title: "Duplicate Detection",
                  desc: "Automatically identifies and merges duplicate reports from the same area.",
                },
                {
                  icon: Building2,
                  title: "Automatic Assignment",
                  desc: "AI routes each issue to the correct municipal department instantly.",
                },
                {
                  icon: MapPin,
                  title: "Live Civic Map",
                  desc: "Real-time interactive 3D map showing all civic issues across the city.",
                },
                {
                  icon: CheckCircle2,
                  title: "Resolution Tracking",
                  desc: "End-to-end tracking from report to resolution with real-time updates.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1a1f2e]/50 to-transparent border border-[#2e3548]/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Statistics */}
        <section className="py-16 sm:py-24 md:py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-sm font-medium text-blue-400 tracking-wider uppercase mb-4">City Impact</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Smart City Statistics
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {[
                { value: "1,284", label: "Civic Issues Detected", color: "text-blue-400" },
                { value: "94%", label: "AI Detection Accuracy", color: "text-emerald-400" },
                { value: "74%", label: "Resolution Rate", color: "text-indigo-400" },
                { value: "12", label: "Avg. Duplicates Detected", color: "text-amber-400" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-4 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1a1f2e]/50 to-transparent border border-[#2e3548]/50 min-w-0"
                >
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-bold ${stat.color} mb-2 sm:mb-3 tracking-tight`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-[11px] sm:text-sm font-medium leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 md:py-32 px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="relative p-8 sm:p-12 md:p-16 rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Ready to make your city better?
                </h2>
                <p className="text-slate-300 mb-8 sm:mb-10 max-w-xl mx-auto text-base sm:text-lg px-2">
                  Join thousands of citizens using CivicEye to report issues and improve their communities.
                </p>
                <Link href="/report">
                  <Button
                    size="lg"
                    className="bg-white text-[#0a0d12] hover:bg-slate-100 text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-10 rounded-full shadow-lg transition-all hover:scale-105 w-full sm:w-auto"
                  >
                    Report an Issue Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
