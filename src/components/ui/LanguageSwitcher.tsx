import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next/pages';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Provide robust fallback to ensure it never crashes if `locale` isn't ready
  const current = LANGUAGES.find((l) => l.code === (router.locale || 'en')) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (code: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: code });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 group",
          open
            ? "bg-white/15 border border-white/20 shadow-inner"
            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15"
        )}
        aria-label="Switch language"
        title="Change language"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{current.flag}</span>
          <span className="uppercase font-bold tracking-widest text-[11px] text-white/90 group-hover:text-white transition-colors">{current.code}</span>
        </div>
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 mt-3 w-52 p-1.5 rounded-2xl border shadow-2xl z-[9999] bg-[#0A0E2E]/95 backdrop-blur-xl border-white/10"
            style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
          >
            <div className="px-3 pt-2 pb-1.5 mb-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {t('common.filter', 'Language') === 'common.filter' ? 'Language' : t('common.filter', 'Language')}
              </span>
            </div>

            <div className="space-y-0.5">
              {LANGUAGES.map((lang) => {
                const isActive = (router.locale || 'en') === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => switchLocale(lang.code)}
                    className={cn(
                      'flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                      isActive
                        ? 'bg-[#4B7BFF]/20 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none shadow-sm rounded-sm group-hover:scale-110 transition-transform duration-300">{lang.flag}</span>
                      <span className="tracking-tight">{lang.label}</span>
                    </div>

                    {isActive && (
                      <Check className="h-4 w-4 ml-auto text-[#4B7BFF] animate-fade-in" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
