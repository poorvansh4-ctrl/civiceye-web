"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Map as MapIcon,
  BarChart3,
  ArrowLeft,
  Eye,
  Menu,
  X,
  Activity,
  Database,
  Cpu,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Complaints", href: "/admin/complaints", icon: FileText },
    { name: "Civic Map", href: "/admin/map", icon: MapIcon },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const systemStatus = [
    { label: "AI Engine", status: "operational", icon: Cpu },
    { label: "Database", status: "connected", icon: Database },
    { label: "Map Service", status: "operational", icon: Wifi },
  ];

  const closeSidebar = () => {
    if (isMobile) setIsOpen(false);
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-3 left-4 z-50 p-2 text-slate-400 hover:text-white bg-[#1a1f2e] border border-[#2e3548] rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-[#1a1f2e] border-r border-[#2e3548] z-40 flex flex-col transition-transform duration-300 ease-in-out",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#2e3548]">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CivicEye
            </span>
            <span className="ml-1 text-[9px] uppercase font-bold bg-blue-500/15 text-blue-400 rounded px-1.5 py-0.5">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 -ml-3 pl-[14px]"
                    : "text-slate-400 hover:bg-[#242938] hover:text-slate-200"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {item.href === "/admin/complaints" && (
                  <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                    47
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* System Status */}
        <div className="px-3 py-4 border-t border-[#2e3548]">
          <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            System Status
          </p>
          <div className="space-y-2">
            {systemStatus.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-400"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1">{item.label}</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Activity className="w-3 h-3" />
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back to Site */}
        <div className="p-3 border-t border-[#2e3548]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-[#242938] hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Citizen Portal
          </Link>
        </div>
      </aside>
    </>
  );
}
