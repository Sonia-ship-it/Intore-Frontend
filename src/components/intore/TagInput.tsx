import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: 'primary' | 'neutral';
  suggestions?: string[];
  className?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Type and press Enter...',
  variant = 'primary',
  suggestions = [],
  className,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pillClass =
    variant === 'primary'
      ? 'bg-[#4B7BFF]/10 text-[#4B7BFF] border border-[#4B7BFF]/20'
      : 'bg-muted text-muted-foreground border border-border';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex flex-wrap gap-2 p-2.5 rounded-xl border bg-background min-h-[46px] cursor-text transition-all',
          'focus-within:ring-2 focus-within:ring-[#4B7BFF]/20 focus-within:border-[#4B7BFF]',
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0',
              pillClass
            )}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
              className="hover:opacity-60 transition-opacity"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground py-0.5"
        />
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1.5 w-full bg-card border rounded-xl shadow-lg overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
            Suggestions
          </p>
          <div className="max-h-48 overflow-y-auto p-1.5 flex flex-wrap gap-1.5">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted hover:bg-[#4B7BFF]/10 hover:text-[#4B7BFF] transition-colors border border-transparent hover:border-[#4B7BFF]/20"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
