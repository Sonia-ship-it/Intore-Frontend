import { useEffect, useState } from 'react';
import { Briefcase, Zap, Users, TrendingUp, Plus, ArrowRight, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBadge } from '@/components/intore/Badges';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useTranslation } from 'next-i18next/pages';

type JobsListResponse = { data?: Array<{ id?: string; _id?: string; title: string; status?: string; location?: string; createdAt?: string }> };

const activityData = [
  { day: 'Mon', value: 4 }, { day: 'Tue', value: 7 }, { day: 'Wed', value: 5 },
  { day: 'Thu', value: 9 }, { day: 'Fri', value: 6 }, { day: 'Sat', value: 3 }, { day: 'Sun', value: 8 },
];

const avatarColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

function MiniAvatar({ name, index }: { name: string; index: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${avatarColors[index % avatarColors.length]}`}>
      {initials}
    </div>
  );
}

export default function RecruiterDashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; status: string; location?: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const hour = today.getHours();
  const greetingKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening';
  const greeting = t(`dashboard.${greetingKey}`);
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await apiFetch<JobsListResponse>('/jobs?limit=10');
        const rows = (resp.data || []).map((j) => ({
          id: j.id || j._id || '',
          title: j.title,
          status: j.status ? String(j.status).charAt(0).toUpperCase() + String(j.status).slice(1) : 'Draft',
          location: j.location || 'Remote / Flexible',
          createdAt: j.createdAt,
        }));
        setJobs(rows);
      } catch (err) {
        toast({ title: 'Could not load dashboard', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'Active').length;
  const draftJobs = jobs.filter((j) => j.status === 'Draft').length;

  return (
    <>
      <AppHeader title={t('nav.dashboard', 'Dashboard')} />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Hero welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1547] via-[#1a2060] to-[#0d1240] p-7 flex items-center justify-between min-h-[160px]">
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#4B7BFF]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <p className="text-white/50 text-sm font-medium">{dateStr}</p>
            <h2 className="text-3xl font-black text-white tracking-tight">{greeting}, {firstName} 👋</h2>
            <p className="text-white/60 text-sm max-w-sm">
              {jobs.length === 0
                ? t("dashboard.postFirstJob")
                : `You have ${activeJobs} ${t("common.active").toLowerCase()} and ${draftJobs} ${t("common.draft").toLowerCase()}.`}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push('/recruiter/jobs/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4B7BFF] text-white text-sm font-semibold hover:bg-[#3461DF] transition-colors shadow-lg shadow-[#4B7BFF]/30"
              >
                <Plus className="h-4 w-4" /> {t("dashboard.postJob")}
              </button>
              <button
                onClick={() => router.push('/recruiter/jobs')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                {t("nav.jobs")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative z-10 hidden md:flex items-end justify-end shrink-0 w-48 h-36 select-none">
            <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
              {/* Desk */}
              <rect x="20" y="120" width="160" height="8" rx="4" fill="rgba(75,123,255,0.3)" />
              {/* Monitor */}
              <rect x="60" y="55" width="80" height="55" rx="6" fill="rgba(75,123,255,0.25)" stroke="rgba(75,123,255,0.5)" strokeWidth="1.5" />
              <rect x="65" y="60" width="70" height="42" rx="3" fill="rgba(15,21,71,0.8)" />
              {/* Screen content lines */}
              <rect x="70" y="66" width="40" height="3" rx="1.5" fill="rgba(75,123,255,0.7)" />
              <rect x="70" y="73" width="55" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
              <rect x="70" y="79" width="45" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
              <rect x="70" y="85" width="50" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
              {/* Monitor stand */}
              <rect x="95" y="110" width="10" height="10" rx="2" fill="rgba(75,123,255,0.3)" />
              <rect x="85" y="118" width="30" height="4" rx="2" fill="rgba(75,123,255,0.2)" />
              {/* Person */}
              <circle cx="155" cy="50" r="16" fill="rgba(75,123,255,0.3)" />
              <circle cx="155" cy="44" r="9" fill="rgba(255,255,255,0.2)" />
              <path d="M138 80 Q155 65 172 80 L172 120 L138 120 Z" fill="rgba(75,123,255,0.25)" />
              {/* Sparkles */}
              <circle cx="40" cy="40" r="3" fill="#4B7BFF" opacity="0.6" />
              <circle cx="170" cy="25" r="2" fill="#a78bfa" opacity="0.7" />
              <circle cx="30" cy="90" r="2" fill="#4B7BFF" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('dashboard.totalJobs'), value: jobs.length, icon: Briefcase, color: 'text-[#4B7BFF]', bg: 'bg-[#4B7BFF]/10' },
            { label: t('dashboard.activeJobs'), value: activeJobs, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: t('dashboard.drafts'), value: draftJobs, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: t('dashboard.candidates'), value: '—', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`${stat.bg} p-3 rounded-xl shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black">{loading ? '—' : stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Screening CTA */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-violet-500/10 via-[#4B7BFF]/10 to-cyan-500/10 p-6 flex items-center justify-between gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-[#4B7BFF]/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-[#4B7BFF]" />
              <span className="text-xs font-bold text-[#4B7BFF] uppercase tracking-wider">{t('dashboard.aiPowered', 'AI-Powered')}</span>
            </div>
            <h3 className="font-bold text-base">{t('dashboard.screenCandidates', 'Screen candidates in seconds')}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.screenDesc', 'Upload resumes and let Intore AI rank and shortlist the best fits automatically.')}</p>
          </div>
          <button
            onClick={() => router.push('/recruiter/jobs')}
            className="relative z-10 shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4B7BFF] text-white text-sm font-semibold hover:bg-[#3461DF] transition-colors shadow-lg shadow-[#4B7BFF]/20 whitespace-nowrap"
          >
            {t('dashboard.getStarted', 'Get Started')} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Jobs — takes 2 cols */}
          <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-sm">{t('dashboard.recentJobs')}</h3>
              <Link href="/recruiter/jobs" className="text-xs text-[#4B7BFF] hover:underline flex items-center gap-1">
                {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-[#4B7BFF]/10 flex items-center justify-center mb-3">
                  <Briefcase className="h-6 w-6 text-[#4B7BFF]" />
                </div>
                <p className="font-semibold text-sm mb-1">{t('dashboard.noJobsYet')}</p>
                <p className="text-xs text-muted-foreground mb-4">{t('dashboard.postFirstJob')}</p>
                <button onClick={() => router.push('/recruiter/jobs/new')} className="px-4 py-2 rounded-lg bg-[#4B7BFF] text-white text-xs font-semibold hover:bg-[#3461DF] transition-colors">
                  {t('dashboard.postJob')}
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {jobs.slice(0, 6).map((j, i) => (
                  <div key={j.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${avatarColors[i % avatarColors.length]}/20`}
                      style={{ background: `${['#4B7BFF', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i % 6]}20` }}>
                      <Briefcase className="h-4 w-4" style={{ color: ['#4B7BFF', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i % 6] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/recruiter/jobs/${j.id}`} className="text-sm font-semibold hover:text-[#4B7BFF] transition-colors truncate block">
                        {j.title}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{j.location}
                      </p>
                    </div>
                    <StatusBadge status={j.status as 'Active' | 'Draft' | 'Closed'} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Activity chart */}
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{t('dashboard.weeklyActivity')}</h3>
                <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4B7BFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4B7BFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }} />
                  <Area type="monotone" dataKey="value" stroke="#4B7BFF" strokeWidth={2} fill="url(#actGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-4">{t('dashboard.quickActions')}</h3>
              <div className="space-y-2">
                {[
                  { label: t('dashboard.postNewJob'), icon: Plus, path: '/recruiter/jobs/new', color: '#4B7BFF' },
                  { label: t('dashboard.viewCandidates'), icon: Users, path: '/recruiter/candidates', color: '#8b5cf6' },
                  { label: t('dashboard.runAiScreening'), icon: Zap, path: '/recruiter/jobs', color: '#10b981' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}20` }}>
                      <action.icon className="h-3.5 w-3.5" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>


      </div>
    </>
  );
}
