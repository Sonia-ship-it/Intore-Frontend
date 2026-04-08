import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Briefcase, Users, Sparkles, Settings, Menu, X, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/intore/Avatar';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { label: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/recruiter/jobs', icon: Briefcase },
  { label: 'Candidates', path: '/recruiter/candidates', icon: Users },
  { label: 'Screenings', path: '/recruiter/screenings', icon: Sparkles },
  { label: 'Settings', path: '/recruiter/settings', icon: Settings },
];

export function AppSidebar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => router.asPath.startsWith(path);

  const nav = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/recruiter/dashboard" className="flex items-center gap-2">
          <div className="bg-[#0F1547] p-1 rounded-md flex items-center justify-center shadow-sm border border-[rgba(75,123,255,0.3)]">
            <Diamond className="h-5 w-5 text-[#4B7BFF] fill-[#4B7BFF]" />
          </div>
          <span className="text-xl font-bold text-white">Intore</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'sidebar-nav-link',
              isActive(item.path) && 'active'
            )}
          >
            <item.icon className="nav-icon h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/8">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
        </div>
        <Link href="/" className="sidebar-back-link mt-4 block text-center">
          Back to home
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-sm border md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-60 bg-[#0A0E2E]">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-16 lg:w-60 bg-[#0A0E2E] border-r border-white/8 z-40">
        {nav}
      </aside>
    </>
  );
}
