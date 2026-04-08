import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMsg {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

const suggestions = [
  'Who is the top candidate?',
  'Compare top 3 applicants',
  'Show gaps in my shortlist',
  'Summarise screening results',
];

const autoResponses: Record<string, string> = {
  'Who is the top candidate?':
    'Based on the latest screening for **Senior Software Engineer**, Amara Uwimana leads with a **94% match score**. She has 5+ years of React & TypeScript experience and strong portfolio work from Kigali-based startups.',
  'Compare top 3 applicants':
    '**#1 Amara Uwimana (94%)** — React expert, TypeScript, Kigali. Gap: No AWS.\n\n**#2 Jean Nshimiyimana (88%)** — Full-stack, system design. Gap: Limited leadership.\n\n**#3 Marie Hakizimana (85%)** — Clean code advocate, testing. Gap: No GraphQL.\n\nAll three are interview-ready. Amara stands out for React depth.',
  'Show gaps in my shortlist':
    'Across your top 7 candidates:\n\n• **4 of 7** lack AWS / cloud experience\n• **3 of 7** have no formal leadership background\n• **2 of 7** are missing GraphQL skills\n\nConsider adding a cloud-skills question to your next screening criteria.',
  'Summarise screening results':
    'Screening for **Senior Software Engineer** (Kigali, Rwanda):\n\n• **18 candidates** screened\n• **7** meet the 70% threshold\n• **Top score:** 94% (Amara Uwimana)\n• **Average score:** 62%\n• **Key trend:** Strongest candidates combine React + TypeScript expertise',
};

export function AIChatFAB() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '1',
      role: 'ai',
      content: "Hi! I'm your Intore AI assistant. Ask me about your candidates, screening results, or hiring pipeline. 🇷🇼",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response =
        autoResponses[text.trim()] ||
        `Great question! Based on your current screening data for Kigali-based roles, I'd recommend reviewing the top candidates in the **Screenings** tab. Would you like me to compare specific applicants?`;
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', content: response },
      ]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Overlay backdrop when chat is open on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[998] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed z-[999] transition-all duration-300 ease-out',
          'bottom-24 right-6 w-[360px] max-h-[480px]',
          'bg-white dark:bg-[#0A0E2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-brand-900 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F1547] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Intore AI</div>
              <div className="text-[10px] text-white/50">Always ready to help</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/50 dark:bg-white/[0.04]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4B7BFF]" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[260px] px-3 py-2 rounded-xl text-[13px] leading-relaxed',
                  msg.role === 'ai'
                    ? 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/85 rounded-tl-sm'
                    : 'bg-[#0F1547] text-white rounded-tr-sm shadow-sm'
                )}
              >
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={j} className="font-semibold">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              </div>
              <div className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-slate-400 dark:text-white/50">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-3 py-2 bg-white dark:bg-[#0A0E2E] border-t border-slate-100 dark:border-white/10 flex gap-1.5 flex-wrap shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-[10px] text-slate-600 dark:text-white/70 bg-slate-100 dark:bg-white/[0.06] hover:bg-brand-50 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-brand-200 px-2 py-1 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-1 bg-white dark:bg-[#0A0E2E] shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask anything about your candidates..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400 dark:placeholder:text-white/35 text-slate-900 dark:text-white/85"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="p-1 rounded-md hover:bg-brand-50 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4 text-[#4B7BFF]" />
            </button>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl',
          open
            ? 'bg-slate-700 rotate-0'
            : 'bg-[#0F1547] hover:bg-[#1E2A8A]'
        )}
        style={
          !open
            ? { animation: 'fabPulse 3s infinite ease-in-out' }
            : undefined
        }
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Tooltip badge when closed */}
      {!open && (
        <div className="fixed bottom-[84px] right-6 z-[999] bg-brand-900 text-white text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-md pointer-events-none animate-fade-in">
          AI Assistant
          <div className="absolute bottom-[-4px] right-5 w-2 h-2 bg-brand-900 rotate-45" />
        </div>
      )}

      {/* Inject pulse keyframe */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(45,61,181,0.4); }
          50% { box-shadow: 0 4px 28px rgba(45,61,181,0.7); }
        }
      `}} />
    </>
  );
}
