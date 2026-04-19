import { Search, Bell, Moon, Sun, ChevronDown, LogOut, User, Settings, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function AppHeader({ title }: { title: string }) {
  const { t } = useTranslation('common');
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="app-header fixed top-0 right-0 left-0 md:left-16 lg:left-60 h-16 z-30 flex items-center justify-between px-6 overflow-visible">
      <h1 className="text-xl font-semibold ml-10 md:ml-0" style={{ color: 'white' }}>{title}</h1>

      <div className="flex items-center gap-4">
        <Link href="/recruiter/jobs/new" className="post-job-btn hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: '#4B7BFF', color: 'white' }}>
          <Plus className="h-4 w-4" /> {t('header.postJob', 'Post a job')}
        </Link>
        <div className="header-search hidden lg:flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Search className="search-icon h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input placeholder={t('header.searchPlaceholder', 'Search jobs...')} className="bg-transparent text-sm outline-none w-48" style={{ color: 'white' }} />
        </div>

        <button onClick={toggle} className="theme-toggle p-2 rounded-lg transition-colors" style={{ color: 'white', opacity: 0.7 }} aria-label="Toggle theme">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <LanguageSwitcher />

        <button className="notification-btn p-2 rounded-lg transition-colors relative" style={{ color: 'white', opacity: 0.7 }} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: '#4B7BFF' }} />
        </button>

        <div className="relative" ref={ref}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors">
            <div className="avatar-circle w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <span style={{ color: 'white', fontWeight: 600 }}>{initials}</span>
            </div>
            <ChevronDown className="chevron-icon h-4 w-4 hidden sm:block" style={{ color: 'white', opacity: 0.6 }} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border py-1.5 animate-fade-in z-[200] bg-white dark:bg-[#0A0E2E] border-slate-200 dark:border-white/10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-white/40 truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/recruiter/settings'); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80"
              >
                <User className="h-4 w-4 text-slate-500 dark:text-white/50" /> {t('header.profile', 'Profile')}
              </button>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/recruiter/settings'); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80"
              >
                <Settings className="h-4 w-4 text-slate-500 dark:text-white/50" /> {t('nav.settings', 'Settings')}
              </button>
              <hr className="my-1 border-slate-100 dark:border-white/10" />
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" /> {t('header.logout', 'Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
