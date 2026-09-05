export const CATEGORIES = [
  "Pothole",
  "Garbage",
  "Broken Streetlight",
  "Water Leakage",
  "Road Damage",
  "Open Drain",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const STATUSES = [
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
] as const;
export type Status = (typeof STATUSES)[number];

export const DEPARTMENTS = [
  "Road & Infrastructure",
  "Sanitation",
  "Electricity",
  "Water Department",
  "Public Works",
  "Municipal Corporation",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const CATEGORY_DEPARTMENT_MAP: Record<Category, Department> = {
  Pothole: "Road & Infrastructure",
  Garbage: "Sanitation",
  "Broken Streetlight": "Electricity",
  "Water Leakage": "Water Department",
  "Road Damage": "Road & Infrastructure",
  "Open Drain": "Public Works",
  Other: "Municipal Corporation",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "bg-red-500/15 text-red-400 border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const STATUS_COLORS: Record<Status, string> = {
  Submitted: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  "Under Review": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Assigned: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "In Progress": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const JAIPUR_AREAS = [
  "Mansarovar",
  "Vaishali Nagar",
  "C-Scheme",
  "Malviya Nagar",
  "Jagatpura",
  "Raja Park",
  "Sodala",
  "Tonk Road",
  "Ajmer Road",
  "Bani Park",
] as const;

export const JAIPUR_CENTER = { lat: 26.9124, lng: 75.7873 };

export const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Mansarovar: { lat: 26.8672, lng: 75.7567 },
  "Vaishali Nagar": { lat: 26.9134, lng: 75.7280 },
  "C-Scheme": { lat: 26.9045, lng: 75.8014 },
  "Malviya Nagar": { lat: 26.8584, lng: 75.8046 },
  Jagatpura: { lat: 26.8325, lng: 75.8467 },
  "Raja Park": { lat: 26.9078, lng: 75.8135 },
  Sodala: { lat: 26.9201, lng: 75.7734 },
  "Tonk Road": { lat: 26.8743, lng: 75.7920 },
  "Ajmer Road": { lat: 26.9186, lng: 75.7413 },
  "Bani Park": { lat: 26.9321, lng: 75.7901 },
};

