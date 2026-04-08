import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/intore/Avatar';
import { ScoreBar } from '@/components/intore/ScoreBar';
import { mockCandidates, mockScreeningResults, mockJobs } from '@/data/mockData';
import { Button } from '@/components/ui/button';

export default function CandidatesList() {
  const router = useRouter();
  const [jobFilter, setJobFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('');

  const candidatesWithScores = mockCandidates.map((c) => {
    const result = mockScreeningResults.find((r) => r.candidateId === c.id);
    return { ...c, matchScore: result?.matchScore || 0, jobId: result?.jobId || '1' };
  });

  const filtered = candidatesWithScores.filter((c) => {
    if (jobFilter !== 'All' && c.jobId !== jobFilter) return false;
    if (skillFilter && !c.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    return true;
  });

  return (
    <>
      <AppHeader title="Candidates" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="bg-card rounded-lg border px-3 py-2 text-sm outline-none">
            <option value="All">All Jobs</option>
            {mockJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <input value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} placeholder="Filter by skill..." className="bg-card rounded-lg border px-3 py-2 text-sm outline-none w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const job = mockJobs.find((j) => j.id === c.jobId);
            return (
              <div key={c.id} className="bg-card rounded-xl p-5 shadow-sm border space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} color={c.avatarColor} />
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.currentRole}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.slice(0, 3).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-700 dark:bg-[rgba(75,123,255,0.1)] dark:text-[#4B7BFF]">{s}</span>
                  ))}
                </div>
                <ScoreBar score={c.matchScore} />
                <p className="text-xs text-muted-foreground">Applied for: {job?.title}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/recruiter/jobs/${c.jobId}`)}>
                  View
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
