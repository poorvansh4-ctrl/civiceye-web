import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0f1419] border-t border-[#2e3548] py-12 text-slate-400 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1 */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Eye className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                CivicEye
              </span>
            </Link>
            <p className="text-sm font-medium text-slate-300">
              See the Issue. Prioritize the Impact. Fix the City.
            </p>
            <p className="text-sm text-slate-500 max-w-xs">
              Empowering citizens and city officials to collaboratively build a better, safer, and cleaner community.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-blue-400 transition-colors">Report Issue</Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-blue-400 transition-colors">My Reports</Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-blue-400 transition-colors">City Status</Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">About CivicEye</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              CivicEye is an AI-powered civic platform designed to streamline incident reporting, prioritize critical infrastructure issues, and enhance communication between the city and its residents.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#2e3548] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2026 CivicEye. All rights reserved.</p>
          <p>Powered by AI</p>
        </div>
      </div>
    </footer>
  );
}
