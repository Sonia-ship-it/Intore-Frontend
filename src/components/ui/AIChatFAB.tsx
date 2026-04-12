import { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronDown, Loader2 } from 'lucide-react';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/router';

interface ChatMsg {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

// Context-aware suggestions based on current page
function useSuggestions(pathname: string): string[] {
  if (pathname.includes('/jobs/') && pathname.includes('/[id]') === false && /\/jobs\/[a-f0-9]+/.test(pathname)) {
    return ['Who is the best fit?', 'Compare top 3 candidates', 'What are the biggest gaps?', 'Who should I interview first?'];
  }
  if (pathname.includes('/candidates')) {
    return ['Which candidate has the most experience?', 'Who has the strongest skills?', 'Show me candidates with Python skills'];
  }
  if (pathname.includes('/screenings')) {
    return ['Summarise the latest screening', 'Who scored above 80%?', 'What skills are most candidates missing?'];
  }
  return ['Who is the top candidate?', 'Compare top 3 applicants', 'Show gaps in my shortlist', 'Summarise screening results'];
}

// Extract jobId from URL if on a job detail page
function useJobIdFromRoute(): string | null {
  const router = useRouter();
  const id = router.query.id;
  return typeof id === 'string' ? id : null;
}

export function AIChatFAB() {
  const router = useRouter();
  const jobId = useJobIdFromRoute();
  const suggestions = useSuggestions(router.pathname);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Hi! I'm your Intore AI assistant powered by Gemini.\n\nAsk me anything about your candidates, screening results, or recruiting pipeline.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // If we're on a job detail page, use the job-specific screening/ask endpoint
      // Otherwise use a general context endpoint
      const endpoint = '/screening/ask';
      const body: Record<string, string> = { question: trimmed };

      // Pass jobId if available so Gemini has screening context
      if (jobId) {
        body.jobId = jobId;
      } else {
        // No specific job — ask Gemini with a general recruiter context
        body.jobId = 'general';
      }

      const resp = await apiFetch<{ answer: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'ai', content: resp.answer || "I couldn't find enough context to answer that. Try running a screening first, or ask about a specific job." },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      // Friendly fallback for "no screening results" error
      const friendly = msg.includes('No screening results')
        ? "There are no screening results yet for this job. Run a screening first, then I can answer questions about the candidates."
        : msg.includes('jobId')
          ? "I need a job context to answer that. Open a specific job and run screening, then ask me here."
          : msg;
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'ai', content: friendly },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-[998] md:hidden" onClick={() => setOpen(false)} />}

      {/* Chat Panel */}
      <div
        data-lenis-prevent
        className={cn(
          'fixed z-[999] transition-all duration-300 ease-out',
          'bottom-24 right-6 w-[360px] max-h-[520px]',
          'bg-white dark:bg-[#0A0E2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-[#0F1547] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4B7BFF]/20 border border-[#4B7BFF]/30 flex items-center justify-center">
              <IntoreMark className="w-4 h-4 text-[#4B7BFF]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Intore AI</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/50">Powered by Gemini</span>
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronDown className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Messages */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/50 dark:bg-white/[0.03]">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : '')}>
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-md bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <IntoreMark className="w-3.5 h-3.5 text-[#4B7BFF]" />
                </div>
              )}
              <div className={cn(
                'max-w-[260px] px-3 py-2.5 rounded-xl text-[13px] leading-relaxed',
                msg.role === 'ai'
                  ? 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/85 rounded-tl-sm'
                  : 'bg-[#0F1547] text-white rounded-tr-sm shadow-sm'
              )}>
                {renderContent(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-md bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-0.5">
                <IntoreMark className="w-3.5 h-3.5 text-[#4B7BFF]" />
              </div>
              <div className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[#4B7BFF] animate-spin" />
                <span className="text-[12px] text-slate-400 dark:text-white/40">Intore is thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        <div className="px-3 py-2 bg-white dark:bg-[#0A0E2E] border-t border-slate-100 dark:border-white/10 flex gap-1.5 flex-wrap shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="text-[10px] text-slate-600 dark:text-white/70 bg-slate-100 dark:bg-white/[0.06] hover:bg-[#4B7BFF]/10 hover:text-[#4B7BFF] border border-slate-200 dark:border-white/10 hover:border-[#4B7BFF]/30 px-2 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-1 bg-white dark:bg-[#0A0E2E] shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 focus-within:border-[#4B7BFF]/40 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about candidates, gaps, rankings..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400 dark:placeholder:text-white/35 text-slate-900 dark:text-white/85"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-1 rounded-md hover:bg-[#4B7BFF]/10 transition-colors disabled:opacity-30"
            >
              {loading ? <Loader2 className="w-4 h-4 text-[#4B7BFF] animate-spin" /> : <Send className="w-4 h-4 text-[#4B7BFF]" />}
            </button>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl',
          open ? 'bg-slate-700' : 'bg-[#0F1547] hover:bg-[#1E2A8A]'
        )}
        style={!open ? { animation: 'fabPulse 3s infinite ease-in-out' } : undefined}
        aria-label="Open AI assistant"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <IntoreMark className="w-5 h-5 text-white" />}
      </button>

      {/* Tooltip */}
      {!open && (
        <div className="fixed bottom-[84px] right-6 z-[999] bg-[#0F1547] text-white text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-md pointer-events-none animate-fade-in">
          AI Assistant
          <div className="absolute bottom-[-4px] right-5 w-2 h-2 bg-[#0F1547] rotate-45" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes fabPulse { 0%,100%{box-shadow:0 4px 14px rgba(45,61,181,0.4)} 50%{box-shadow:0 4px 28px rgba(45,61,181,0.7)} }` }} />
    </>
  );
}

