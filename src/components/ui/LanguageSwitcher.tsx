import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === router.locale) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (code: string) => {
    router.push(router.pathname, router.asPath, { locale: code });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
        style={{ color: 'white', opacity: 0.7 }}
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-medium hidden sm:block">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl shadow-2xl border bg-white dark:bg-[#0A0E2E] border-slate-200 dark:border-white/10 py-1.5 z-[200]" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/10',
                router.locale === lang.code
                  ? 'text-[#4B7BFF] dark:text-[#4B7BFF]'
                  : 'text-slate-700 dark:text-white/80'
              )}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
              {router.locale === lang.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4B7BFF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
