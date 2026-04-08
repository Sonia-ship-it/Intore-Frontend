import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';
import { useRouter } from 'next/router';

export default function ScreeningsList() {
  const router = useRouter();
  return (
    <>
      <AppHeader title="Screenings" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Screening History</h2>
        <EmptyState
          icon={Sparkles}
          title="No screening runs yet"
          description="Run your first screening from a job detail page to see history here."
          actionLabel="Go to Jobs"
          onAction={() => router.push('/recruiter/jobs')}
        />
      </div>
    </>
  );
}
