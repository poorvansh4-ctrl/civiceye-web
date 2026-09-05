"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { StatCard } from "@/components/stat-card";
import { SeverityBadge } from "@/components/severity-badge";
import {
  dashboardStats,
  areaWiseIssues,
  categoryDistribution,
} from "@/data/mock-dashboard";
import { mockReports } from "@/data/mock-reports";
import { formatDate } from "@/lib/utils";
import {
  Activity,
  Clock,
  FileText,
  CheckCircle2,
  MapPin,
  ArrowRight,
  AlertTriangle,
  Car,
  Trash2,
  Zap,
  Droplet,
  Building,
  TrendingUp,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Severity } from "@/lib/constants";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Pothole: Car,
  Garbage: Trash2,
  "Broken Streetlight": Zap,
  "Water Leakage": Droplet,
  "Road Damage": Building,
  "Open Drain": Droplet,
  Other: AlertTriangle,
};

export default function CityStatusPage() {
  const activeIssues = dashboardStats.totalIssues - dashboardStats.resolved;

  const topCategories = categoryDistribution.slice(0, 6);

  const criticalReports = mockReports
    .filter((r) => r.severity === "Critical" || r.severity === "High")
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#1e2433] to-[#0f1419] py-16 px-4 border-b border-[var(--border-primary)]">
          <div className="container mx-auto text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Live City Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              City Status{" "}
              <span className="text-[var(--accent-blue)]">— Jaipur</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Real-time overview of civic issues across the city. Track progress and help make Jaipur better.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 space-y-12">
          {/* Stats Row */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Issues"
              value={dashboardStats.totalIssues}
              icon={FileText}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Active Issues"
              value={activeIssues}
              icon={Activity}
              trend={{ value: 5, positive: false }}
            />
            <StatCard
              title="Resolution Rate"
              value={`${dashboardStats.resolutionRate}%`}
              icon={CheckCircle2}
              trend={{ value: 2.4, positive: true }}
            />
            <StatCard
              title="Avg Resolution Time"
              value={`${dashboardStats.avgResolutionDays} days`}
              icon={Clock}
              trend={{ value: 0.5, positive: true }}
            />
          </section>

          {/* Category Breakdown */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Issues by Category
              </h2>
              <TrendingUp className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] || AlertTriangle;
                return (
                  <Card
                    key={cat.name}
                    className="bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--accent-blue)]/50 transition-colors"
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2a3142] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[var(--accent-blue)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        {cat.name}
                      </p>
                      <p className="text-2xl font-bold text-[var(--accent-blue)]">
                        {cat.value}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Area-wise Breakdown */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Area-wise Breakdown
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areaWiseIssues.map((area, idx) => (
                  <div
                    key={area.name}
                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center justify-between hover:border-[var(--accent-blue)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2a3142] flex items-center justify-center text-[var(--accent-blue)] shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">
                          {area.name}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Top issue: {topCategories[idx % topCategories.length]?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-bold text-[var(--text-primary)]">
                        {area.value}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                        Issues
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Critical Issues */}
            <section className="lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Critical Issues
                </h2>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 space-y-4">
                {criticalReports.length > 0 ? (
                  criticalReports.map((report) => (
                    <Link
                      href={`/reports/${report.id}`}
                      key={report.id}
                      className="block group"
                    >
                      <div className="p-3 rounded-lg border border-transparent hover:bg-[#242938] hover:border-[#2e3548] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <SeverityBadge severity={report.severity as Severity} />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {formatDate(report.reportedAt)}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-blue)] transition-colors">
                          {report.category} Issue
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{report.location}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--text-secondary)] flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-green-500 opacity-50" />
                    <p>No critical issues reported recently.</p>
                  </div>
                )}

                {criticalReports.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full text-[var(--accent-blue)] hover:text-blue-400 hover:bg-[#2a3142]"
                    asChild
                  >
                    <Link href="/reports">
                      View All Reports <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </section>
          </div>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-[#1e2433] to-[#1a1f2e] border border-[var(--border-primary)] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent-blue)]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#2a3142] rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-[var(--accent-blue)]" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                Spot an issue?
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                Help us keep Jaipur clean and safe. Report issues with just a few
                taps and track their resolution status in real-time.
              </p>
              <Button
                size="lg"
                className="bg-[var(--accent-blue)] hover:bg-blue-600 text-white font-medium px-8"
                asChild
              >
                <Link href="/report">Report It Now</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
