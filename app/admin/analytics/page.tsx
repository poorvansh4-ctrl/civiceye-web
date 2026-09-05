"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
  LineChart, Line
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

const customTooltipStyle = {
  backgroundColor: '#242938',
  border: '1px solid #2e3548',
  color: '#f1f5f9',
  borderRadius: '0.375rem',
  padding: '10px'
};

const axisStyle = {
  stroke: '#64748b',
  fontSize: 12,
  tickLine: false,
  axisLine: false
};

const gridStyle = {
  strokeDasharray: '3 3',
  stroke: '#2e3548',
  vertical: false
};

const CATEGORY_LABEL: Record<string, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  streetlight: 'Broken Streetlight',
  water_leakage: 'Water Leakage',
  road_damage: 'Road Damage',
  drainage: 'Open Drain',
  other: 'Other',
};

interface CategoryPoint { name: string; value: number }
interface DepartmentPoint { area: string; issues: number }
interface ResolutionPoint { category: string; days: number }
interface TimePoint { month: string; reported: number; resolved: number }
interface PriorityPoint { month: string; critical: number; high: number; medium: number; low: number }
interface DeptRow { department: string; total: number; resolved: number; avgResolutionDays: number }

interface ComplaintRow {
  id: string;
  category: string;
  status: string;
  severity: string;
  priority_score: number;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('complaints')
          .select('id, category, status, severity, priority_score, department, created_at, updated_at');
        if (error) throw error;
        setComplaints(data ?? []);
      } catch {
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categoryDistribution = useMemo<CategoryPoint[]>(() => {
    const m: Record<string, number> = {};
    for (const c of complaints) m[c.category] = (m[c.category] ?? 0) + 1;
    return Object.entries(m).map(([k, v]) => ({ name: CATEGORY_LABEL[k] ?? k, value: v }));
  }, [complaints]);

  const areaWiseIssues = useMemo<DepartmentPoint[]>(() => {
    const m: Record<string, number> = {};
    for (const c of complaints) {
      const dept = c.department ?? 'Unassigned';
      m[dept] = (m[dept] ?? 0) + 1;
    }
    return Object.entries(m).map(([k, v]) => ({ area: k, issues: v })).sort((a, b) => b.issues - a.issues).slice(0, 10);
  }, [complaints]);

  const resolutionTimeData = useMemo<ResolutionPoint[]>(() => {
    const m: Record<string, { sum: number; n: number }> = {};
    for (const c of complaints) {
      if (c.status === 'resolved' && c.updated_at && c.created_at) {
        const days = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const cat = CATEGORY_LABEL[c.category] ?? c.category;
        if (!m[cat]) m[cat] = { sum: 0, n: 0 };
        m[cat].sum += days;
        m[cat].n += 1;
      }
    }
    return Object.entries(m).map(([k, v]) => ({ category: k, days: v.n > 0 ? +(v.sum / v.n).toFixed(1) : 0 }));
  }, [complaints]);

  const issuesOverTime = useMemo<TimePoint[]>(() => {
    const m: Record<string, { reported: number; resolved: number }> = {};
    for (const c of complaints) {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!m[key]) m[key] = { reported: 0, resolved: 0 };
      m[key].reported += 1;
      if (c.status === 'resolved') m[key].resolved += 1;
    }
    return Object.entries(m).sort().map(([k, v]) => ({ month: k, ...v }));
  }, [complaints]);

  const priorityTrends = useMemo<PriorityPoint[]>(() => {
    const m: Record<string, PriorityPoint> = {};
    for (const c of complaints) {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!m[key]) m[key] = { month: key, critical: 0, high: 0, medium: 0, low: 0 };
      const sev = c.severity as 'critical' | 'high' | 'medium' | 'low' | undefined;
      if (sev && sev in m[key]) {
        m[key][sev] += 1;
      }
    }
    return Object.values(m).sort((a, b) => a.month.localeCompare(b.month));
  }, [complaints]);

  const departmentPerformance = useMemo<DeptRow[]>(() => {
    const m: Record<string, { total: number; resolved: number; sumDays: number; nDays: number }> = {};
    for (const c of complaints) {
      const dept = c.department ?? 'Unassigned';
      if (!m[dept]) m[dept] = { total: 0, resolved: 0, sumDays: 0, nDays: 0 };
      m[dept].total += 1;
      if (c.status === 'resolved') {
        m[dept].resolved += 1;
        if (c.updated_at && c.created_at) {
          const days = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
          m[dept].sumDays += days;
          m[dept].nDays += 1;
        }
      }
    }
    return Object.entries(m).map(([k, v]) => ({
      department: k,
      total: v.total,
      resolved: v.resolved,
      avgResolutionDays: v.nDays > 0 ? +(v.sumDays / v.nDays).toFixed(1) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [complaints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading analytics…</span>
      </div>
    );
  }

  const noData = complaints.length === 0;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
        <p className="text-secondary mt-1">Deep dive into civic data and department performance</p>
      </div>

      {noData && (
        <Card className="bg-[#1e2433] border-[#2e3548]">
          <CardContent className="py-8 text-center text-slate-400">
            No complaint data yet. Analytics will populate as citizens submit reports.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Issues Over Time (Reported vs Resolved)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={issuesOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Area type="monotone" dataKey="reported" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Reported" />
                <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Department Workload</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaWiseIssues} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3548" horizontal={false} />
                <XAxis type="number" {...axisStyle} />
                <YAxis dataKey="area" type="category" width={120} {...axisStyle} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{fill: '#2e3548', opacity: 0.4}} />
                <Bar dataKey="issues" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Average Resolution Time (Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionTimeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="category" {...axisStyle} />
                <YAxis {...axisStyle} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{fill: '#2e3548', opacity: 0.4}} />
                <Bar dataKey="days" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Priority Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priorityTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-secondary font-semibold">Department</TableHead>
                    <TableHead className="text-secondary font-semibold text-right">Total Issues</TableHead>
                    <TableHead className="text-secondary font-semibold text-right">Resolved</TableHead>
                    <TableHead className="text-secondary font-semibold w-[30%]">Resolution Rate</TableHead>
                    <TableHead className="text-secondary font-semibold text-right">Avg Days to Resolve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPerformance.map((dept, i) => {
                    const rate = dept.total > 0 ? (dept.resolved / dept.total) * 100 : 0;
                    const getRateColor = (r: number) => {
                      if (r >= 85) return "bg-green-500";
                      if (r >= 70) return "bg-yellow-500";
                      return "bg-red-500";
                    };
                    return (
                      <TableRow key={i} className="border-border hover:bg-background">
                        <TableCell className="font-medium text-foreground">{dept.department}</TableCell>
                        <TableCell className="text-foreground text-right">{dept.total}</TableCell>
                        <TableCell className="text-foreground text-right">{dept.resolved}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-secondary w-12">{rate.toFixed(0)}%</span>
                            <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border border-border">
                              <div className={`h-2.5 rounded-full ${getRateColor(rate)}`} style={{ width: `${rate}%` }}></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground text-right">{dept.avgResolutionDays}</TableCell>
                      </TableRow>
                    );
                  })}
                  {departmentPerformance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-6">No department data yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
