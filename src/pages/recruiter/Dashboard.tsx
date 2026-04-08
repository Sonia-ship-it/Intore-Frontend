import { Briefcase, Sparkles } from 'lucide-react';
import { useRouter } from 'next/router';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useAuthStore } from '@/stores/authStore';

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Format today's date safely
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="mb-8">
          <h2 className="text-[24px] font-semibold text-slate-900">Good morning, {user?.name?.split(' ')[0] || 'User'}. </h2>
          <p className="text-[13px] text-slate-400 mt-1">{dateStr}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-sm border p-2">
            <EmptyState
              icon={Briefcase}
              title="No jobs yet"
              description="Create your first job posting to start receiving applicants."
              actionLabel="Post New Job"
              onAction={() => router.push('/recruiter/jobs/new')}
            />
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-2">
            <EmptyState
              icon={Sparkles}
              title="No activity yet"
              description="Once you run screenings and manage candidates, activity will appear here."
              actionLabel="Go to Jobs"
              onAction={() => router.push('/recruiter/jobs')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
