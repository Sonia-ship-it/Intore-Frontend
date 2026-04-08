import Link from 'next/link';
import { Briefcase, Clock, CheckCircle, AlertCircle, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

type ApplicationStatus = 'Applied' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Rejected';

interface MockApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: ApplicationStatus;
}

const mockApplications: MockApplication[] = [
  { id: '1', jobTitle: 'Senior Software Engineer', company: 'Inyarwanda Ltd', location: 'Kigali', appliedDate: '2024-03-18', status: 'Under Review' },
  { id: '2', jobTitle: 'UI/UX Designer', company: 'Kigali Tech Hub', location: 'Kigali', appliedDate: '2024-03-14', status: 'Shortlisted' },
  { id: '3', jobTitle: 'Data Analyst', company: 'BK Capital', location: 'Musanze', appliedDate: '2024-03-10', status: 'Interview' },
  { id: '4', jobTitle: 'Digital Marketing Lead', company: 'MTN Rwanda', location: 'Huye', appliedDate: '2024-02-28', status: 'Rejected' },
  { id: '5', jobTitle: 'Systems Engineer', company: 'RwandAir', location: 'Kigali', appliedDate: '2024-03-20', status: 'Applied' },
];

const statusConfig: Record<ApplicationStatus, { color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  'Applied': { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: FileText },
  'Under Review': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  'Shortlisted': { color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200', icon: CheckCircle },
  'Interview': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
  'Rejected': { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
};

const steps: ApplicationStatus[] = ['Applied', 'Under Review', 'Shortlisted', 'Interview'];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function ProgressTracker({ current }: { current: ApplicationStatus }) {
  const currentIdx = steps.indexOf(current);
  if (current === 'Rejected') return null;

  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0 transition-colors',
              done ? 'bg-[#4B7BFF]' : 'bg-slate-200'
            )} />
            {i < steps.length - 1 && (
              <div className={cn(
                'h-[2px] flex-1 transition-colors',
                i < currentIdx ? 'bg-[#4B7BFF]' : 'bg-slate-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicantDashboardPage() {
  const { user } = useAuthStore();

  const stats = {
    total: mockApplications.length,
    active: mockApplications.filter((a) => !['Rejected'].includes(a.status)).length,
    interviews: mockApplications.filter((a) => a.status === 'Interview').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] || 'Applicant'} 👋
        </h1>
        <p className="text-[14px] text-slate-500 mt-1">Track your job applications across Rwanda.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[12px] text-slate-400 font-medium">Total Applications</p>
          <p className="text-[28px] font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[12px] text-slate-400 font-medium">Active</p>
          <p className="text-[28px] font-bold text-emerald-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[12px] text-slate-400 font-medium">Interviews Scheduled</p>
          <p className="text-[28px] font-bold text-brand-600 mt-1">{stats.interviews}</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900">My Applications</h2>
          <Link href="/jobs" className="text-[13px] text-[#4B7BFF] hover:text-[#2D3DB5] font-medium transition-colors">
            Browse more jobs →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {mockApplications.map((app) => (
            <div key={app.id} className="px-5 py-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="h-5 w-5 text-[#4B7BFF]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-slate-900">{app.jobTitle}</h3>
                    <p className="text-[13px] text-slate-500">{app.company}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {app.location}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Applied {new Date(app.appliedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <div className="ml-13 pl-13 mt-2 max-w-xs">
                <ProgressTracker current={app.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
