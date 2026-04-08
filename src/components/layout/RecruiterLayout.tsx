import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AIChatFAB } from '@/components/ui/AIChatFAB';
import { Footer } from '@/components/layout/Footer';

export function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-16 lg:ml-60 pt-16 min-h-screen flex flex-col justify-between">
        <div className="flex-1 px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div
              className="bg-white/95 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm overflow-auto scrollbar-thin"
              style={{ maxHeight: 'calc(100vh - 64px - 48px)' }}
            >
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
      <AIChatFAB />
    </div>
  );
}
