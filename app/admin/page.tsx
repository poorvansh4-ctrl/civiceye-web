"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock, CheckCircle2, TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { AdminAlertSystem } from "@/components/admin-alert-system";
import { createClient } from "@/lib/supabase/client";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

const CATEGORY_LABEL: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  streetlight: "Broken Streetlight",
  water_leakage: "Water Leakage",
  road_damage: "Road Damage",
  drainage: "Open Drain",
  other: "Other",
};

interface ComplaintRow {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  location: string | null;
  address: string | null;
  severity: string;
  priority_score: number;
  department: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  colorClass,
  comparison,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
  trendValue?: string;
  colorClass: string;
  comparison?: string;
}) {
  return (
    <Card className="bg-[#1e2433] border-[#2e3548] hover:border-[#2e3548]/80 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <h2 className="text-3xl font-bold text-white">{value}</h2>
            {trend && trendValue && (
              <div className="flex items-center gap-1.5">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                  {trendValue}
                </span>
                {comparison && <span className="text-xs text-slate-500">{comparison}</span>}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 80) return <Badge variant="destructive">Critical ({priority})</Badge>;
  if (priority >= 60) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">High ({priority})</Badge>;
  if (priority >= 40) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium ({priority})</Badge>;
  return <Badge className="bg-green-500 hover:bg-green-600 text-white">Low ({priority})</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "resolved":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          Resolved
        </Badge>
      );
    case "in progress":
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          In Progress
        </Badge>
      );
    case "under review":
    case "under_review":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Under Review
        </Badge>
      );
    case "assigned":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          Assigned
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity.toLowerCase()) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "high":
      return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
    default:
      return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
  }
}

export default function AdminDashboard() {
   const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("complaints")
          .select("id, complaint_number, category, description, address, severity, priority_score, department, status, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) {
          setComplaints([]);
        } else {
          setComplaints((data as ComplaintRow[]) ?? []);
        }
      } catch {
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const critical = complaints.filter((c) => c.severity === "critical").length;
    const inProgress = complaints.filter((c) => c.status === "in_progress" || c.status === "assigned" || c.status === "under_review").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    return { total, critical, inProgress, resolved };
  }, [complaints]);

  const priorityDistribution = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const c of complaints) {
      const k = c.severity as keyof typeof counts;
      if (k in counts) counts[k] += 1;
    }
    return [
      { name: "Critical", value: counts.critical, fill: "#ef4444" },
      { name: "High", value: counts.high, fill: "#f97316" },
      { name: "Medium", value: counts.medium, fill: "#eab308" },
      { name: "Low", value: counts.low, fill: "#22c55e" },
    ];
  }, [complaints]);

  const categoryDistribution = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of complaints) {
      m[c.category] = (m[c.category] ?? 0) + 1;
    }
    return Object.entries(m).map(([k, v]) => ({ name: CATEGORY_LABEL[k] ?? k, value: v }));
  }, [complaints]);

  const monthlyResolutionRate = useMemo(() => {
    const m: Record<string, { reported: number; resolved: number }> = {};
    for (const c of complaints) {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!m[key]) m[key] = { reported: 0, resolved: 0 };
      m[key].reported += 1;
      if (c.status === "resolved") m[key].resolved += 1;
    }
    return Object.entries(m)
      .sort()
      .map(([k, v]) => ({
        month: k,
        rate: v.reported > 0 ? Math.round((v.resolved / v.reported) * 100) : 0,
      }));
  }, [complaints]);

  const highPriorityAlerts = useMemo(
    () =>
      [...complaints]
        .filter((r) => r.priority_score >= 85)
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 5),
    [complaints]
  );

  const recentComplaints = useMemo(() => complaints.slice(0, 8), [complaints]);

  const customTooltipStyle = {
    backgroundColor: "#1e2433",
    border: "1px solid #2e3548",
    color: "#f1f5f9",
    borderRadius: "8px",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading admin dashboard…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Civic Administrator Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor, prioritize and resolve civic issues across the city.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Issues"
          value={stats.total}
          icon={FileText}
          colorClass="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Critical Issues"
          value={stats.critical}
          icon={AlertTriangle}
          colorClass="bg-red-500/10 text-red-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          colorClass="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          colorClass="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Priority Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {priorityDistribution.map((item) => {
          const total = priorityDistribution.reduce((s, x) => s + x.value, 0);
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <Card key={item.name} className="bg-[#1e2433] border-[#2e3548]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-400">{item.name}</span>
                  <span className="text-lg font-bold text-white">{item.value}</span>
                </div>
                <div className="h-2 bg-[#0f1419] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{pct}% of total</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-[#1e2433] border-[#2e3548]">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: "#f1f5f9" }} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2433] border-[#2e3548]">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3548" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: "#2e3548", opacity: 0.4 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card className="bg-[#1e2433] border-[#2e3548] border-t-4 border-t-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Critical Civic Issues
            </CardTitle>
            <Link
              href="/admin/complaints"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {highPriorityAlerts.length === 0 ? (
              <p className="text-center text-slate-500 py-6 text-sm">No high-priority issues. Great work!</p>
            ) : (
              highPriorityAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/admin/complaints/${alert.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0f1419]/50 hover:bg-[#0f1419] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">ID</p>
                      <p className="font-mono text-sm text-white">{alert.complaint_number}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {CATEGORY_LABEL[alert.category] ?? alert.category}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{alert.address ?? "Unknown location"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Priority</p>
                      <p className="font-bold text-red-400">{alert.priority_score}</p>
                    </div>
                    <SeverityBadge severity={alert.severity} />
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Complaints Table */}
      <Card className="bg-[#1e2433] border-[#2e3548]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Complaints</CardTitle>
            <Link
              href="/admin/complaints"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2e3548] hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium">ID</TableHead>
                <TableHead className="text-slate-400 font-medium">Issue</TableHead>
                <TableHead className="text-slate-400 font-medium hidden md:table-cell">Location</TableHead>
                <TableHead className="text-slate-400 font-medium">Severity</TableHead>
                <TableHead className="text-slate-400 font-medium">Priority</TableHead>
                <TableHead className="text-slate-400 font-medium hidden lg:table-cell">Department</TableHead>
                <TableHead className="text-slate-400 font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No complaints yet. Submitted reports will appear here in real time.
                  </TableCell>
                </TableRow>
              ) : (
                recentComplaints.map((report) => (
                  <TableRow
                    key={report.id}
                    className="border-[#2e3548] hover:bg-[#242938] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/complaints/${report.id}`)}
                  >
                    <TableCell className="font-mono text-sm text-white">{report.complaint_number}</TableCell>
                    <TableCell className="text-white font-medium">{CATEGORY_LABEL[report.category] ?? report.category}</TableCell>
                    <TableCell className="text-slate-400 truncate max-w-[180px] hidden md:table-cell">
                      {report.address ?? "—"}
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={report.severity} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={report.priority_score} />
                    </TableCell>
                    <TableCell className="text-slate-400 hidden lg:table-cell">{report.department}</TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Resolution Rate */}
      {monthlyResolutionRate.length > 0 && (
        <Card className="bg-[#1e2433] border-[#2e3548]">
          <CardHeader>
            <CardTitle>Monthly Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyResolutionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3548" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Real-time Alert System */}
      <AdminAlertSystem />
    </div>
  );
}
