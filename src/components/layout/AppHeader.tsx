import { Search, Bell, Moon, Sun, ChevronDown, LogOut, User, Settings, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute right-0 mt-3 w-64 p-1.5 rounded-2xl border shadow-2xl z-[9999] bg-[#0A0E2E]/95 backdrop-blur-xl border-white/10"
                style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
              >
                <div className="px-4 py-3 border-b border-white/10 mb-1.5">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-white/40 font-medium truncate">{user?.email || ''}</p>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/recruiter/settings'); }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#4B7BFF]/20 group-hover:text-[#4B7BFF] transition-all">
                      <User className="h-4 w-4" />
                    </div>
                    <span>{t('header.profile', 'Profile')}</span>
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/recruiter/settings'); }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#4B7BFF]/20 group-hover:text-[#4B7BFF] transition-all">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span>{t('nav.settings', 'Settings')}</span>
                  </button>

                  <div className="my-1.5 h-px bg-white/10 mx-2" />

                  <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/5 group-hover:bg-rose-500/20 transition-all">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span>{t('header.logout', 'Logout')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
