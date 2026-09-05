import type { DashboardStats, ChartDataPoint, DepartmentPerformance } from "./types";

export const dashboardStats: DashboardStats = {
  totalIssues: 1247,
  criticalIssues: 23,
  inProgress: 156,
  resolved: 892,
  avgResolutionDays: 4.2,
  resolutionRate: 71.5,
  totalDepartments: 6,
  activeAreas: 10,
};

export const priorityDistribution: ChartDataPoint[] = [
  { name: "Critical", value: 23, fill: "#ef4444" },
  { name: "High", value: 89, fill: "#f97316" },
  { name: "Medium", value: 178, fill: "#eab308" },
  { name: "Low", value: 65, fill: "#22c55e" },
];

export const categoryDistribution: ChartDataPoint[] = [
  { name: "Pothole", value: 312, fill: "#6366f1" },
  { name: "Garbage", value: 278, fill: "#8b5cf6" },
  { name: "Broken Streetlight", value: 189, fill: "#a855f7" },
  { name: "Water Leakage", value: 156, fill: "#3b82f6" },
  { name: "Road Damage", value: 198, fill: "#06b6d4" },
  { name: "Open Drain", value: 87, fill: "#14b8a6" },
  { name: "Other", value: 27, fill: "#64748b" },
];

export const issuesOverTime: ChartDataPoint[] = [
  { name: "Jan", reported: 78, resolved: 62 },
  { name: "Feb", reported: 92, resolved: 74 },
  { name: "Mar", reported: 105, resolved: 89 },
  { name: "Apr", reported: 118, resolved: 98 },
  { name: "May", reported: 132, resolved: 112 },
  { name: "Jun", reported: 145, resolved: 125 },
  { name: "Jul", reported: 168, resolved: 142 },
  { name: "Aug", reported: 189, resolved: 158 },
  { name: "Sep", reported: 156, resolved: 132 },
];

export const areaWiseIssues: ChartDataPoint[] = [
  { name: "Mansarovar", value: 187 },
  { name: "Vaishali Nagar", value: 156 },
  { name: "C-Scheme", value: 142 },
  { name: "Malviya Nagar", value: 134 },
  { name: "Jagatpura", value: 128 },
  { name: "Raja Park", value: 112 },
  { name: "Sodala", value: 98 },
  { name: "Tonk Road", value: 92 },
  { name: "Ajmer Road", value: 108 },
  { name: "Bani Park", value: 90 },
];

export const resolutionTimeData: ChartDataPoint[] = [
  { name: "Road & Infra", value: 5.2 },
  { name: "Sanitation", value: 2.8 },
  { name: "Electricity", value: 3.5 },
  { name: "Water Dept", value: 4.1 },
  { name: "Public Works", value: 6.3 },
  { name: "Municipal Corp", value: 7.8 },
];

export const priorityTrends: ChartDataPoint[] = [
  { name: "Week 1", critical: 5, high: 18, medium: 32, low: 12 },
  { name: "Week 2", critical: 7, high: 22, medium: 28, low: 15 },
  { name: "Week 3", critical: 4, high: 16, medium: 35, low: 18 },
  { name: "Week 4", critical: 8, high: 25, medium: 30, low: 10 },
  { name: "Week 5", critical: 3, high: 20, medium: 38, low: 14 },
  { name: "Week 6", critical: 6, high: 19, medium: 26, low: 16 },
  { name: "Week 7", critical: 9, high: 23, medium: 33, low: 11 },
  { name: "Week 8", critical: 5, high: 21, medium: 29, low: 13 },
];

export const departmentPerformance: DepartmentPerformance[] = [
  { department: "Road & Infrastructure", total: 510, resolved: 378, avgResolutionDays: 5.2, resolutionRate: 74.1 },
  { department: "Sanitation", total: 278, resolved: 234, avgResolutionDays: 2.8, resolutionRate: 84.2 },
  { department: "Electricity", total: 189, resolved: 156, avgResolutionDays: 3.5, resolutionRate: 82.5 },
  { department: "Water Department", total: 156, resolved: 108, avgResolutionDays: 4.1, resolutionRate: 69.2 },
  { department: "Public Works", total: 87, resolved: 52, avgResolutionDays: 6.3, resolutionRate: 59.8 },
  { department: "Municipal Corporation", total: 27, resolved: 14, avgResolutionDays: 7.8, resolutionRate: 51.9 },
];

export const monthlyResolutionRate: ChartDataPoint[] = [
  { name: "Jan", rate: 79.5 },
  { name: "Feb", rate: 80.4 },
  { name: "Mar", rate: 84.8 },
  { name: "Apr", rate: 83.1 },
  { name: "May", rate: 84.8 },
  { name: "Jun", rate: 86.2 },
  { name: "Jul", rate: 84.5 },
  { name: "Aug", rate: 83.6 },
  { name: "Sep", rate: 84.6 },
];

