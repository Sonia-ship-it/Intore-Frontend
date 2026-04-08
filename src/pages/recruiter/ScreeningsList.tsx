import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

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
        <h2 className="text-2xl font-semibold mb-6">Screening History</h2>
        <div className="flex gap-2 mb-6">
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="bg-card rounded-lg border px-3 py-2 text-sm outline-none w-[320px]"
          >
            {jobs.length === 0 && <option value="">No jobs available</option>}
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <Button onClick={loadResults} disabled={loading || !jobId}>{loading ? 'Loading...' : 'Load Results'}</Button>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No screening runs yet"
            description="Run your first screening from a job detail page to see ranked results here."
            actionLabel="Go to Jobs"
            onAction={() => router.push('/recruiter/jobs')}
          />
        ) : (
          <div className="bg-card rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  {['Rank', 'Candidate', 'Score', 'Recommendation'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.name}`} className="border-b last:border-0">
                    <td className="px-5 py-3 text-sm font-semibold">#{r.rank}</td>
                    <td className="px-5 py-3 text-sm">{r.name}</td>
                    <td className="px-5 py-3 text-sm">{r.score}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{r.recommendation}</td>
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
