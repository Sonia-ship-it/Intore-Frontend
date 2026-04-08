import { useRouter } from 'next/router';
import { Users } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/intore/EmptyState';

export default function CandidatesList() {
  const router = useRouter();

  return (
    <>
      <AppHeader title="Candidates" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EmptyState
          icon={Users}
          title="No candidates yet"
          description="Candidates will appear here after you upload applicants and run screening."
          actionLabel="Go to Jobs"
          onAction={() => router.push('/recruiter/jobs')}
        />
      </div>
    </>
  );
}
