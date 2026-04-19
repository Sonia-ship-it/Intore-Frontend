import { useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Briefcase, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBadge, TypeBadge } from '@/components/intore/Badges';
import { EmptyState } from '@/components/intore/EmptyState';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';

type JobsResponse = { data?: Array<{ id?: string; _id?: string; title: string; department?: string; requiredSkills?: string[]; location?: string; isRemote?: boolean; employmentType?: string; status?: string; publishedAt?: string; createdAt?: string }> };

export default function JobsList() {
  const { t } = useTranslation('common');
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
      <AppHeader title={t('nav.jobs', 'Jobs')} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{t('jobs.allJobs', 'All Jobs')}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{jobs.length} {t('nav.jobs', 'jobs')} {t('common.all', 'posted')}</p>
          </div>
          <Button onClick={() => router.push('/recruiter/jobs/new')} className="gap-2">
            <Plus className="h-4 w-4" /> {t('jobs.postNewJob', 'Post New Job')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-card rounded-xl border px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('jobs.searchJobs', 'Search jobs...')} className="bg-transparent text-sm outline-none w-44 placeholder:text-muted-foreground" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-card rounded-xl border px-3 py-2 text-sm outline-none shadow-sm">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card rounded-xl border px-3 py-2 text-sm outline-none shadow-sm">
            <option>{t('common.all', 'All')}</option><option>{t('common.active', 'Active')}</option><option>{t('common.draft', 'Draft')}</option><option>{t('common.closed', 'Closed')}</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title={t('jobs.noJobsFound', 'No jobs found')} description={t('jobs.noJobsDesc', 'No jobs match your filters or none have been created yet.')} actionLabel={t('jobs.postNewJob', 'Post New Job')} onAction={() => router.push('/recruiter/jobs/new')} />
        ) : (
          <div className="space-y-3">
            {filtered.map((job, i) => {
              const colors = ['#4B7BFF', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
              const c = colors[i % colors.length];
              return (
                <div key={job.id} className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all group flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c}18` }}>
                    <Briefcase className="h-5 w-5" style={{ color: c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/recruiter/jobs/${job.id}`} className="text-sm font-semibold hover:text-[#4B7BFF] transition-colors">
                      {job.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      {job.department && <span>{job.department}</span>}
                      {job.postedDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{job.postedDate}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <TypeBadge type={job.type || 'Remote'} />
                    <StatusBadge status={job.status || 'Draft'} />
                    <Link href={`/recruiter/jobs/${job.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
