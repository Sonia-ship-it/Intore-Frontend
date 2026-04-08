import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AIChatFAB } from '@/components/ui/AIChatFAB';
import { Footer } from '@/components/layout/Footer';

export function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <AppSidebar />
      <div className="flex flex-col h-screen md:pl-16 lg:pl-60">
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
      <AIChatFAB />
    </div>
  );
}
