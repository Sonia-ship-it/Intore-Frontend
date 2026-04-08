import Link from 'next/link';
import { useRouter } from 'next/router';
import { Diamond, Briefcase, LayoutDashboard, User, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Footer } from '@/components/layout/Footer';

const navItems = [
  { label: 'Browse Jobs', path: '/jobs', icon: Briefcase },
  { label: 'My Applications', path: '/applicant/dashboard', icon: LayoutDashboard },
  { label: 'Profile', path: '/applicant/profile', icon: User },
];

export function ApplicantShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => router.pathname === path || router.asPath.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-brand-900 z-50 shadow-md">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          {/* Logo */}
          <Link href="/jobs" className="flex items-center gap-2.5">
            <div className="bg-[#0F1547] p-1 rounded-md flex items-center justify-center border border-[rgba(75,123,255,0.3)]">
              <Diamond className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-white">Intore</span>
            <span className="text-[10px] text-white/40 font-medium border border-white/15 rounded px-1.5 py-0.5 ml-1">JOBS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
          </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggle} className="text-white/40 hover:text-white/80 transition-colors p-2" aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="text-sm text-white/50">{user?.name}</span>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="text-white/40 hover:text-white/80 transition-colors p-2"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-brand-900 border-t border-white/10 px-6 py-4 space-y-1 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <button onClick={toggle} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white w-full text-left">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 w-full"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="pt-16 min-h-screen">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
