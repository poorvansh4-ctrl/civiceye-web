"use client";

import React from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Bell, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 min-h-screen bg-[#0f1419]">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }
  return (
    <div className="min-h-screen bg-[#0f1419]">
      <AdminSidebar />
      <div className="pl-0 md:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 border-b border-[#2e3548] bg-[#0f1419]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-full">
            <div className="flex items-center gap-4 ml-12 md:ml-0">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search complaints, locations..."
                  className="w-64 h-9 pl-10 pr-4 bg-[#1a1f2e] border border-[#2e3548] rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-[#1a1f2e]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f1419]"></span>
              </button>
              <div className="h-6 w-px bg-[#2e3548]"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-200">Civic Admin</p>
                  <p className="text-[10px] text-slate-500">Municipal Authority</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
