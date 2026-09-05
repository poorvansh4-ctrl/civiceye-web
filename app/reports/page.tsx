"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ReportCard } from '@/components/report-card';
import { EmptyState } from '@/components/empty-state';
import { STATUSES, type Category } from '@/lib/constants';
import { Search, Filter, SortAsc, FolderOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type SortOption = 'newest' | 'oldest' | 'priority';

interface RealReport {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  status: string;
  severity: string;
  priority_score: number;
  image_url: string | null;
  address: string | null;
  department: string | null;
  created_at: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<RealReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        const { data, error } = await supabase
          .from('complaints')
          .select('id, complaint_number, category, description, status, severity, priority_score, image_url, address, department, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) {
          toast.error('Failed to load your reports.');
          setReports([]);
        } else {
          setReports((data as RealReport[]) ?? []);
        }
      } catch {
        toast.error('Unable to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const filteredReports = useMemo(() => {
    let results = [...reports];
    if (search) {
      const s = search.toLowerCase();
      results = results.filter((r) =>
        r.complaint_number.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s) ||
        (r.address ?? '').toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'All') {
      const map: Record<string, string> = {
        Submitted: 'submitted',
        'Under Review': 'under_review',
        Assigned: 'assigned',
        'In Progress': 'in_progress',
        Resolved: 'resolved',
      };
      const want = map[statusFilter] ?? statusFilter.toLowerCase();
      results = results.filter((r) => r.status === want);
    }
    switch (sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'priority':
        results.sort((a, b) => b.priority_score - a.priority_score);
        break;
    }
    return results;
  }, [reports, search, statusFilter, sortBy]);

  const stats = {
    total: reports.length,
    active: reports.filter((r) => r.status !== 'resolved').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    critical: reports.filter((r) => r.severity === 'critical').length,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">My Reports</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">Track and manage your civic complaints</p>
          </div>
          <Link href="/report" className="self-stretch sm:self-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto min-h-[44px]">+ New Report</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-[var(--text-primary)]" },
            { label: "Active", value: stats.active, color: "text-amber-400" },
            { label: "Resolved", value: stats.resolved, color: "text-emerald-400" },
            { label: "Critical", value: stats.critical, color: "text-red-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-3 sm:p-4 min-w-0"
            >
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-1 truncate">{s.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by ID, issue, location..."
                className="pl-10 bg-[var(--bg-card)] border-[var(--border-primary)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-[var(--border-primary)] text-[var(--text-secondary)]"
            >
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3 rounded-md border border-[var(--border-primary)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority</option>
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)]">Status</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === 'All' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('All')}
                    className={statusFilter === 'All' ? 'bg-blue-600' : 'border-[var(--border-primary)]'}
                  >
                    All
                  </Button>
                  {STATUSES.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(status)}
                      className={statusFilter === status ? 'bg-blue-600' : 'border-[var(--border-primary)]'}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading your reports…</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((r) => {
              const categoryLabel = ({ pothole: 'Pothole', garbage: 'Garbage', streetlight: 'Broken Streetlight', water_leakage: 'Water Leakage', road_damage: 'Road Damage', drainage: 'Open Drain', other: 'Other' } as Record<string, string>)[r.category] ?? 'Other';
              const statusLabel = ({ submitted: 'Submitted', under_review: 'Under Review', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' } as Record<string, string>)[r.status] ?? 'Submitted';
              const severityLabel = ({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' } as Record<string, string>)[r.severity] ?? 'Medium';
               return (
                 <ReportCard
                   key={r.id}
                   report={{
                     id: r.id,
                     category: categoryLabel as unknown as Category,
                     description: r.description,
                     status: statusLabel as unknown as import('@/lib/constants').Status,
                     severity: severityLabel as unknown as import('@/lib/constants').Severity,
                     priority: r.priority_score,
                     imageUrl: r.image_url ?? '',
                     location: r.address ?? '',
                     area: r.address ?? '',
                     coordinates: { lat: 0, lng: 0 },
                     address: r.address ?? null,
                     aiConfidence: 0,
                      department: (r.department ?? 'Municipal Corporation') as import('@/lib/constants').Department,
                     reportedAt: r.created_at,
                     updatedAt: r.created_at,
                     duplicateCount: 0,
                     nearbyCount: 0,
                     reporterName: '',
                     timeline: [],
                   }}
                 />
               );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No reports found"
            description={
              search || statusFilter !== 'All'
                ? 'Try adjusting your search or filters'
                : "You haven't reported any issues yet"
            }
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
