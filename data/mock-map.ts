import type { MapMarker } from "./types";

export const mapMarkers: MapMarker[] = [
  { id: "CE-1042", lat: 26.8672, lng: 75.7567, category: "Pothole", severity: "Critical", title: "Large pothole near Metro Station", location: "Mansarovar", priority: 95, status: "In Progress", department: "Road & Infrastructure", reports: 7 },
  { id: "CE-1038", lat: 26.9134, lng: 75.7280, category: "Garbage", severity: "High", title: "Garbage piling at main market", location: "Vaishali Nagar", priority: 88, status: "Assigned", department: "Sanitation", reports: 5 },
  { id: "CE-1035", lat: 26.9045, lng: 75.8014, category: "Broken Streetlight", severity: "High", title: "Multiple streetlights not working", location: "C-Scheme", priority: 85, status: "In Progress", department: "Electricity", reports: 3 },
  { id: "CE-1031", lat: 26.8584, lng: 75.8046, category: "Water Leakage", severity: "Critical", title: "Major water pipeline leak", location: "Malviya Nagar", priority: 92, status: "Under Review", department: "Water Department", reports: 6 },
  { id: "CE-1028", lat: 26.8325, lng: 75.8467, category: "Road Damage", severity: "High", title: "Road surface severely damaged", location: "Jagatpura", priority: 82, status: "Assigned", department: "Road & Infrastructure", reports: 4 },
  { id: "CE-1025", lat: 26.9078, lng: 75.8135, category: "Open Drain", severity: "Critical", title: "Open drain near school zone", location: "Raja Park", priority: 98, status: "In Progress", department: "Public Works", reports: 8 },
  { id: "CE-1020", lat: 26.9201, lng: 75.7734, category: "Pothole", severity: "High", title: "Deep pothole at circle", location: "Sodala", priority: 87, status: "Resolved", department: "Road & Infrastructure", reports: 5 },
  { id: "CE-1006", lat: 26.9140, lng: 75.7295, category: "Road Damage", severity: "Critical", title: "Road caved in - sinkhole", location: "Vaishali Nagar", priority: 99, status: "In Progress", department: "Road & Infrastructure", reports: 12 },
  { id: "CE-1012", lat: 26.9321, lng: 75.7901, category: "Water Leakage", severity: "High", title: "Sewage overflow on road", location: "Bani Park", priority: 84, status: "Submitted", department: "Water Department", reports: 4 },
  { id: "CE-1009", lat: 26.9060, lng: 75.8030, category: "Pothole", severity: "High", title: "Series of potholes on service lane", location: "C-Scheme", priority: 86, status: "In Progress", department: "Road & Infrastructure", reports: 9 },
  { id: "CE-0999", lat: 26.8590, lng: 75.8060, category: "Open Drain", severity: "High", title: "Drain overflow causing waterlogging", location: "Malviya Nagar", priority: 83, status: "Under Review", department: "Public Works", reports: 7 },
  { id: "CE-0983", lat: 26.9085, lng: 75.8140, category: "Garbage", severity: "High", title: "Illegal garbage dumping site", location: "Raja Park", priority: 80, status: "Under Review", department: "Sanitation", reports: 6 },
  { id: "CE-0968", lat: 26.8595, lng: 75.8055, category: "Garbage", severity: "Critical", title: "Medical waste in public bins", location: "Malviya Nagar", priority: 94, status: "In Progress", department: "Sanitation", reports: 3 },
  { id: "CE-0976", lat: 26.9210, lng: 75.7745, category: "Open Drain", severity: "High", title: "Open drain in residential area", location: "Sodala", priority: 79, status: "Submitted", department: "Public Works", reports: 5 },
  { id: "CE-0987", lat: 26.8340, lng: 75.8480, category: "Water Leakage", severity: "Medium", title: "Water pipe leaking at junction", location: "Jagatpura", priority: 71, status: "In Progress", department: "Water Department", reports: 3 },
  { id: "CE-1015", lat: 26.9186, lng: 75.7413, category: "Broken Streetlight", severity: "Critical", title: "Tilted pole with exposed wires", location: "Ajmer Road", priority: 96, status: "Resolved", department: "Electricity", reports: 3 },
  { id: "CE-1003", lat: 26.9310, lng: 75.7880, category: "Garbage", severity: "Medium", title: "Overflowing dustbins at bus stand", location: "Bani Park", priority: 72, status: "Assigned", department: "Sanitation", reports: 6 },
  { id: "CE-0980", lat: 26.8750, lng: 75.7935, category: "Road Damage", severity: "Medium", title: "Worn out speed breaker", location: "Tonk Road", priority: 62, status: "Assigned", department: "Road & Infrastructure", reports: 2 },
];

export const hotspots = [
  { area: "C-Scheme", issueCount: 142, criticalCount: 8, topCategory: "Pothole" as const },
  { area: "Mansarovar", issueCount: 187, criticalCount: 12, topCategory: "Pothole" as const },
  { area: "Vaishali Nagar", issueCount: 156, criticalCount: 6, topCategory: "Road Damage" as const },
  { area: "Raja Park", issueCount: 112, criticalCount: 9, topCategory: "Open Drain" as const },
  { area: "Malviya Nagar", issueCount: 134, criticalCount: 7, topCategory: "Water Leakage" as const },
  { area: "Sodala", issueCount: 98, criticalCount: 4, topCategory: "Pothole" as const },
  { area: "Jagatpura", issueCount: 128, criticalCount: 5, topCategory: "Road Damage" as const },
];

