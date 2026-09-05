import type { Category, Severity, Status, Department } from "@/lib/constants";

export interface Report {
  id: string;
  category: Category;
  description: string;
  location: string;
  area: string;
  coordinates: { lat: number; lng: number };
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  severity: Severity;
  status: Status;
  priority: number; // 0-100
  department: Department;
  aiConfidence: number; // 0-100
  imageUrl: string;
  reportedAt: string;
  updatedAt: string;
  duplicateCount: number;
  nearbyCount: number;
  reporterName: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
  status?: 'completed' | 'current' | 'pending';
}

export interface DashboardStats {
  totalIssues: number;
  criticalIssues: number;
  inProgress: number;
  resolved: number;
  avgResolutionDays: number;
  resolutionRate: number;
  totalDepartments: number;
  activeAreas: number;
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  title: string;
  location: string;
  priority: number;
  status: Status;
  department: Department;
  reports: number;
}

export interface AnalysisResult {
  issueType?: Category;
  confidence: number;
  severity: Severity;
  priorityScore: number;
  department: Department;
  detectedIssue?: string;
  recommendedDepartment?: string;
}

export interface FilterState {
  search: string;
  category: Category | "All";
  severity: Severity | "All";
  status: Status | "All";
  priority: "All" | "Critical" | "High" | "Medium" | "Low";
}

export interface DepartmentPerformance {
  department?: Department;
  name?: string;
  totalIssues?: number;
  total: number;
  resolved: number;
  avgResolutionDays: number;
  resolutionRate: number;
}
