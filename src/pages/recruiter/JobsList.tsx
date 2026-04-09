import { useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Briefcase } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBadge, TypeBadge } from '@/components/intore/Badges';
import { EmptyState } from '@/components/intore/EmptyState';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
type JobsResponse = { data?: Array<{ id?: string; _id?: string; title: string; department?: string; requiredSkills?: string[]; location?: string; isRemote?: boolean; employmentType?: string; status?: string; publishedAt?: string; createdAt?: string }> };

export default function JobsList() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Array<{
    id: string;
    title: string;
    department?: string;
    location?: string;
    type?: 'Remote' | 'Hybrid' | 'Onsite';
    employmentType?: string;
    status?: string;
    postedDate?: string;
    applicantCount?: number;
  }>>([]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const resp = await apiFetch<JobsResponse>('/jobs?limit=200');
      const rows = (resp.data || []).map((j) => ({
        id: j.id || j._id,
        title: j.title,
        department: j.department || (j.requiredSkills?.[0] ? 'General' : 'General'),
        location: j.location || 'Remote / Flexible',
        type: (j.isRemote ? 'Remote' : 'Onsite') as 'Remote' | 'Hybrid' | 'Onsite',
        employmentType: j.employmentType || 'Full-time',
        status: j.status ? String(j.status).charAt(0).toUpperCase() + String(j.status).slice(1) : 'Draft',
        postedDate: j.publishedAt ? new Date(j.publishedAt).toLocaleDateString() : (j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—'),
        applicantCount: 0,
      }));
      setJobs(rows);
    } catch (err) {
      toast({
        title: 'Could not load jobs',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const departments = ['All', ...new Set(jobs.map((j) => j.department).filter(Boolean) as string[])];
  const filtered = jobs.filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All' && (j.status || '') !== statusFilter) return false;
    if (deptFilter !== 'All' && (j.department || '') !== deptFilter) return false;
    return true;
  });

  return (
    <>
      <AppHeader title="Jobs" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">All Jobs</h2>
          <Button onClick={() => router.push('/recruiter/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" /> Post New Job
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-card rounded-lg border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="bg-transparent text-sm outline-none w-40 placeholder:text-muted-foreground" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-card rounded-lg border px-3 py-2 text-sm outline-none">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card rounded-lg border px-3 py-2 text-sm outline-none">
            <option>All</option><option>Active</option><option>Draft</option><option>Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs found" description="No jobs match your filters or none have been created yet." actionLabel="Post New Job" onAction={() => router.push('/recruiter/jobs/new')} />
        ) : (
          <div className="bg-card rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  {['Job Title', 'Department', 'Location', 'Type', 'Applicants', 'Status', 'Posted', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3"><Link href={`/recruiter/jobs/${job.id}`} className="text-sm font-medium text-primary hover:underline">{job.title}</Link></td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{job.department}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{job.location}</td>
                    <td className="px-5 py-3"><TypeBadge type={job.type || 'Remote'} /></td>
                    <td className="px-5 py-3 text-sm">{job.applicantCount ?? 0}</td>
                    <td className="px-5 py-3"><StatusBadge status={job.status || 'Draft'} /></td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{job.postedDate}</td>
                    <td className="px-5 py-3">
                      <Link href={`/recruiter/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
