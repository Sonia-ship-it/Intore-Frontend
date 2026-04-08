import { useEffect, useState } from 'react';
import { Briefcase, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { StatusBadge } from '@/components/intore/Badges';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';
type JobsListResponse = { data?: Array<{ id?: string; _id?: string; title: string; status?: string; location?: string; createdAt?: string }> };

export default function RecruiterDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; status: string; location?: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  // Format today's date safely
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await apiFetch<JobsListResponse>('/jobs?limit=10');
        const rows = (resp.data || []).map((j) => ({
          id: j.id || j._id,
          title: j.title,
          status: j.status ? String(j.status).charAt(0).toUpperCase() + String(j.status).slice(1) : 'Draft',
          location: j.location || 'Remote / Flexible',
          createdAt: j.createdAt,
        }));
        setJobs(rows);
      } catch (err) {
        toast({
          title: 'Could not load dashboard jobs',
          description: err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="mb-8">
          <h2 className="text-[24px] font-semibold text-slate-900">Good morning, {user?.name?.split(' ')[0] || 'User'}. </h2>
          <p className="text-[13px] text-slate-400 mt-1">{dateStr}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-sm border p-2">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Create your first job posting to start receiving applicants."
                actionLabel="Add Applicants"
                onAction={() => router.push('/recruiter/jobs/new')}
              />
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Recent Jobs</h3>
                  <Link href="/recruiter/jobs" className="text-xs text-primary hover:underline">View all</Link>
                </div>
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((j) => (
                    <div key={j.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <Link href={`/recruiter/jobs/${j.id}`} className="text-sm font-medium hover:underline">{j.title}</Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{j.location}</p>
                      </div>
                      <StatusBadge status={j.status as 'Active' | 'Draft' | 'Closed'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-2">
            <EmptyState
              icon={Sparkles}
              title="No activity yet"
              description="Once you run screenings and manage candidates, activity will appear here."
              actionLabel="Run AI Screening"
              onAction={() => router.push('/recruiter/jobs')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
