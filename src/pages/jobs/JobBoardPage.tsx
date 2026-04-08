import Link from 'next/link';
import { MapPin, Clock, Briefcase, Search, Filter } from 'lucide-react';
import { mockJobs } from '@/data/mockData';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const departmentFilters = ['All', 'Engineering', 'Design', 'Data', 'Infrastructure', 'Marketing'];

export default function JobBoardPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');

  const activeJobs = mockJobs.filter((j) => j.status === 'Active');
  const filtered = activeJobs.filter((job) => {
    const matchSearch =
      search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    const matchDept = department === 'All' || job.department === department;
    return matchSearch && matchDept;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[40px] font-bold text-slate-900 dark:text-white leading-tight">
          Find Your Next Opportunity in Rwanda
        </h1>
        <p className="mt-3 text-[16px] text-slate-500 dark:text-white/55 max-w-lg mx-auto">
          Browse open positions from leading Rwandan companies. Apply in minutes.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-4 md:p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-white/[0.06] rounded-xl px-4 py-3 border border-slate-100 dark:border-white/10">
            <Search className="h-4 w-4 text-slate-400 dark:text-white/45 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or location..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-white/35 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="h-4 w-4 text-slate-400 dark:text-white/45 shrink-0" />
            {departmentFilters.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartment(dept)}
                className={cn(
                  'text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap',
                  department === dept
                    ? 'bg-[#0F1547] text-white border-[#0F1547] dark:border-white/10'
                    : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-[#2D3DB5]'
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No jobs match your search. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-white dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 p-6 hover:border-brand-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-white/[0.06] flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-[#4B7BFF]" />
                </div>
                <span className="text-[11px] font-medium text-brand-600 dark:text-white/80 bg-brand-50 dark:bg-white/[0.06] border border-brand-100 dark:border-white/10 px-2 py-0.5 rounded-full">
                  {job.employmentType}
                </span>
              </div>

              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-white/55 mt-1">{job.department}</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-white/45">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-white/45">
                  <Clock className="h-3.5 w-3.5" />
                  {job.type}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-1.5">
                {job.requiredSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/[0.06] rounded px-2 py-0.5"
                  >
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 3 && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-white/45 px-1">
                    +{job.requiredSkills.length - 3}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
