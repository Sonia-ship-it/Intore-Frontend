import { ListChecks, Trophy, TrendingUp } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { ScoreBar } from '@/components/intore/ScoreBar';

const avatarColors = ['#4B7BFF', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function ScreeningsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [jobId, setJobId] = useState('');
  const [rows, setRows] = useState<Array<{ rank: number; name: string; score: number; recommendation: string }>>([]);
  const [loading, setLoading] = useState(false);

  const loadResults = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await apiFetch<Array<{ rank: number; name: string; score: number; recommendation: string }>>(
        `/screening-results?jobId=${encodeURIComponent(jobId)}&top=20`
      );
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

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
      <AppHeader title="Screenings" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Screening Results</h2>
            <p className="text-sm text-muted-foreground mt-0.5">AI-ranked candidates by job</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="bg-card rounded-xl border px-3 py-2 text-sm outline-none w-[280px] shadow-sm"
          >
            {jobs.length === 0 && <option value="">No jobs available</option>}
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <Button onClick={loadResults} disabled={loading || !jobId} className="gap-2">
            <ListChecks className="h-4 w-4" />
            {loading ? 'Loading...' : 'Load Results'}
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No screening runs yet"
            description="Run your first screening from a job detail page to see ranked results here."
            actionLabel="Go to Jobs"
            onAction={() => router.push('/recruiter/jobs')}
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => {
              const color = avatarColors[i % avatarColors.length];
              const initials = r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={`${r.rank}-${r.name}`} className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4">
                  {/* Rank badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${i < 3 ? 'bg-[#4B7BFF] text-white' : 'bg-muted text-muted-foreground'}`}>
                    {i === 0 ? <Trophy className="h-4 w-4" /> : `#${r.rank}`}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: color }}>
                    {initials}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.recommendation}</p>
                  </div>
                  {/* Score */}
                  <div className="w-32 shrink-0">
                    <ScoreBar score={Math.round(r.score)} />
                  </div>
                  {/* Score label */}
                  <div className="shrink-0 flex items-center gap-1 text-xs font-semibold" style={{ color: r.score >= 70 ? '#10b981' : r.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {Math.round(r.score)}%
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
