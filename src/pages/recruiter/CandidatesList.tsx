import { useRouter } from 'next/router';
import { Users, Search, Briefcase } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

const avatarColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

function CandidateAvatar({ name, index }: { name: string; index: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColors[index % avatarColors.length]}`}>
      {initials}
    </div>
  );
}

export default function CandidatesList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [jobId, setJobId] = useState('');
  const [rows, setRows] = useState<Array<{ applicationId: string; name: string; skills: string[]; experience: number; education: string; projects: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCandidates = async () => {
    if (!jobId.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch<Array<{ applicationId: string; name: string; skills: string[]; experience: number; education: string; projects: string[] }>>(
        `/screening/candidates?jobId=${encodeURIComponent(jobId)}`
      );
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) setRows([]);
  }, [jobId]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const resp = await apiFetch<{ data?: Array<{ _id?: string; id?: string; title: string }> }>('/jobs?limit=100');
        const items = (resp.data || []).map((j) => ({ id: j.id || j._id || '', title: j.title })).filter((j) => j.id);
        setJobs(items);
        if (!jobId && items.length > 0) setJobId(items[0].id);
      } catch {
        setJobs([]);
      }
    };
    loadJobs();
  }, []);

  return (
    <>
      <AppHeader title="Candidates" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Candidates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Normalized candidate profiles by job</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="bg-card rounded-xl border px-3 py-2 text-sm outline-none w-[280px] shadow-sm"
          >
            {jobs.length === 0 && <option value="">No jobs available</option>}
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <Button onClick={fetchCandidates} disabled={loading || !jobId} className="gap-2">
            {loading ? 'Loading...' : 'Load Candidates'}
          </Button>
          {rows.length > 0 && (
            <div className="flex items-center gap-2 bg-card rounded-xl border px-3 py-2 shadow-sm ml-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates..." className="bg-transparent text-sm outline-none w-40 placeholder:text-muted-foreground" />
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates yet"
            description="Select a job and click Load Candidates to view normalized profiles."
            actionLabel="Go to Jobs"
            onAction={() => router.push('/recruiter/jobs')}
          />
        ) : (
          <div className="space-y-3">
            {rows
              .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
              .map((c, i) => (
                <div key={c.applicationId} className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-4">
                  <CandidateAvatar name={c.name} index={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{c.experience} yr{c.experience !== 1 ? 's' : ''} exp</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.education}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.skills.slice(0, 5).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#4B7BFF]/10 text-[#4B7BFF]">{s}</span>
                      ))}
                      {c.skills.length > 5 && <span className="px-2 py-0.5 rounded-full text-[11px] text-muted-foreground bg-muted">+{c.skills.length - 5}</span>}
                    </div>
                    {c.projects.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">{c.projects.slice(0, 2).join(' · ')}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
