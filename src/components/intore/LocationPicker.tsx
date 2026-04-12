import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function formatLocation(r: NominatimResult): string {
  const a = r.address;
  const city = a.city || a.town || a.village || a.county || '';
  const country = a.country || '';
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  // Fallback: first two parts of display_name
  return r.display_name.split(',').slice(0, 2).join(',').trim();
}

export function LocationPicker({ value, onChange, placeholder = 'e.g. Kigali, Rwanda', className }: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [validated, setValidated] = useState(!!value);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync external value
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
      setValidated(!!value);
    }
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=city`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setValidated(false);
    onChange(q); // allow free typing but mark unvalidated
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  const select = (r: NominatimResult) => {
    const formatted = formatLocation(r);
    setQuery(formatted);
    onChange(formatted);
    setValidated(true);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setValidated(false);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 transition-all',
        'focus-within:ring-2 focus-within:ring-[#4B7BFF]/20 focus-within:border-[#4B7BFF]',
        validated ? 'border-emerald-400/60' : 'border-input'
      )}>
        {loading
          ? <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          : validated
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            : <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        }
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Hint */}
      {!validated && query.length > 0 && !loading && (
        <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Select a location from the suggestions to validate it
        </p>
      )}
      {validated && (
        <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Location verified
        </p>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-30 top-full mt-1.5 w-full bg-card border rounded-xl shadow-xl overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
            Suggested locations
          </p>
          <ul className="max-h-56 overflow-y-auto">
            {results.map((r) => {
              const formatted = formatLocation(r);
              const flag = r.address.country_code
                ? String.fromCodePoint(...[...r.address.country_code.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65))
                : '📍';
              return (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(r); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-base shrink-0">{flag}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{formatted}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.display_name.split(',').slice(0, 3).join(',')}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
