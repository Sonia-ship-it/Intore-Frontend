import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AIChatFAB } from '@/components/ui/AIChatFAB';
import { Footer } from '@/components/layout/Footer';

export function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-16 lg:ml-60 pt-16 min-h-screen flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
      <AIChatFAB />
    </div>
  );
}
