"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Eye, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

type NavLink = {
  name: string;
  href: string;
  highlight?: boolean;
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, isAdmin } = useAuth();

  const citizenLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Report Issue", href: "/report" },
    { name: "My Reports", href: "/reports" },
    { name: "City Status", href: "/status" },
  ];

  const adminLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Report Issue", href: "/report" },
    { name: "My Reports", href: "/reports" },
    { name: "City Status", href: "/status" },
    {
      name: "Command Center",
      href: "/admin",
      highlight: true,
    },
  ];

  const navLinks: NavLink[] = isAdmin ? adminLinks : citizenLinks;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      closeMobileMenu();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] h-16 bg-[#0f1419]/95 backdrop-blur-xl border-b border-[#2e3548]">
      <div className="max-w-7xl mx-auto h-16 px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">

        {/* LOGO */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Eye className="w-5 h-5 text-blue-500" />
          </div>

          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            CivicEye
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isReport = link.href === "/report";
            const isCommandCenter = link.highlight === true;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-[#3b82f6]/10 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e]",
                  isReport &&
                    !isActive &&
                    "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20",
                  isCommandCenter &&
                    !isActive &&
                    "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
                  isCommandCenter &&
                    isActive &&
                    "bg-amber-500/20 text-amber-400"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 shrink-0">

          {/* DESKTOP AUTH */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden lg:block text-sm text-slate-400 max-w-[140px] truncate">
                  {user.email?.split("@")[0]}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-300 hover:text-white hover:bg-[#1a1f2e]"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-300 hover:text-white hover:bg-[#1a1f2e]"
                >
                  <Link href="/login">Login</Link>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            className="md:hidden relative z-[10001] flex items-center justify-center w-11 h-11 rounded-lg text-slate-300 hover:text-white hover:bg-[#1a1f2e] active:bg-[#242938] cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-[10000] bg-[#111720] border-b border-[#2e3548] shadow-2xl">
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4">

            {/* MOBILE NAV LINKS */}
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isCommandCenter = link.highlight === true;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "w-full flex items-center px-4 py-3.5 rounded-xl text-base font-medium min-h-[48px]",
                      "transition-colors",
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-300 hover:bg-[#1f2633] hover:text-white",
                      isCommandCenter &&
                        !isActive &&
                        "bg-amber-500/10 text-amber-400",
                      isCommandCenter &&
                        isActive &&
                        "bg-amber-500/20 text-amber-400"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* DIVIDER */}
            <div className="my-4 h-px bg-[#2e3548]" />

            {/* MOBILE AUTH */}
            {user ? (
              <div className="flex flex-col gap-3">

                <div className="w-full px-4 py-3 rounded-xl bg-[#0f1419] border border-[#2e3548]">
                  <p className="text-xs text-slate-500 mb-1">
                    Signed in as
                  </p>

                  <p className="text-sm text-white font-medium truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[50px] flex items-center justify-center rounded-xl border border-[#3a4356] text-slate-200 hover:bg-[#242938] hover:text-white transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>

              </div>
            ) : (
              <div className="flex flex-col gap-3">

                {/* LOGIN */}
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full min-h-[50px] flex items-center justify-center rounded-xl border border-[#3a4356] text-white hover:bg-[#242938] transition-colors font-semibold"
                >
                  Login
                </Link>

                {/* SIGN UP */}
                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="w-full min-h-[50px] flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
                >
                  Sign Up
                </Link>

              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}