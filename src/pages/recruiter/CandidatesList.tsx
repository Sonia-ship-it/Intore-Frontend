import { useRouter } from 'next/router';
import { Users } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function CandidatesList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [jobId, setJobId] = useState('');
  const [rows, setRows] = useState<Array<{ applicationId: string; name: string; skills: string[]; experience: number; education: string; projects: string[] }>>([]);
  const [loading, setLoading] = useState(false);

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
        <div className="flex gap-2 mb-6">
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="bg-card rounded-lg border px-3 py-2 text-sm outline-none w-[320px]"
          >
            {jobs.length === 0 && <option value="">No jobs available</option>}
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <Button onClick={fetchCandidates} disabled={loading || !jobId}>{loading ? 'Loading...' : 'Load Candidates'}</Button>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates yet"
            description="Load candidates by job id after ingestion to view normalized records."
            actionLabel="Go to Jobs"
            onAction={() => router.push('/recruiter/jobs')}
          />
        ) : (
          <div className="bg-card rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  {['Name', 'Skills', 'Experience', 'Education', 'Projects'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.applicationId} className="border-b last:border-0">
                    <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{c.skills.join(', ')}</td>
                    <td className="px-5 py-3 text-sm">{c.experience}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{c.education}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{c.projects.slice(0, 2).join(' | ')}</td>
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
