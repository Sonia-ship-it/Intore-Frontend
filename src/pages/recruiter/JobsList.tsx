import { useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Briefcase } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { Button } from '@/components/ui/button';

export default function JobsList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const departments = ['All'];
  const filtered: never[] = [];

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

        <EmptyState icon={Briefcase} title="No jobs yet" description="Start fresh by creating your first job posting." actionLabel="Post New Job" onAction={() => router.push('/recruiter/jobs/new')} />
      </div>
    </>
  );
}
