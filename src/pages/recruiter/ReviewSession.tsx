'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ThumbsUp, ThumbsDown, Send, Trophy, CheckCircle2, XCircle, Loader2, ArrowLeft, FileDown, RotateCcw } from 'lucide-react';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/intore/Avatar';
import { ScoreBar } from '@/components/intore/ScoreBar';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Signal = 'up' | 'down' | null;
type Candidate = { candidateId: string; name: string; rank: number; overallScore: number; strengths: string[]; gaps: string[]; recommendation: string };
type ChatMsg = { id: string; role: 'recruiter' | 'ai'; content: string; streaming?: boolean };
type Session = { _id: string; status: 'active' | 'finalised'; candidates: Candidate[]; thumbsLog: any[]; messages: any[]; finalDecisions?: any[]; pdfReport?: any };

const QUICK_CHIPS_START = ['Who is the strongest candidate?', 'Summarise the shortlist for me', 'What are the key tradeoffs?'];
const QUICK_CHIPS_AFTER_THUMBS = (name: string) => [`Who else is similar to ${name}?`, 'Show me a summary of decisions so far'];
const QUICK_CHIPS_READY = ['Finalise my decisions', 'Show me a summary of decisions so far'];

function fireCelebration() {
  if (typeof window === 'undefined') return;
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.55 }, colors: ['#4B7BFF', '#10b981', '#f59e0b', '#fff', '#8b5cf6'] });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } }), 300);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } }), 300);
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.4 }, gravity: 0.7, scalar: 1.3 }), 700);
  });
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
    );
    return <p key={i} className="leading-relaxed">{parts}</p>;
  });
}

export default function ReviewPage() {
  const router = useRouter();
  const jobId = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [finalising, setFinalising] = useState(false);
  const [finalisedView, setFinalisedView] = useState(false);
  const [summaryCard, setSummaryCard] = useState<{ summaryMessage: string; finalDecisions: any[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const hasFiredConfetti = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiTyping]);

  // Load or create session
  useEffect(() => {
    if (!jobId) return;
    const init = async () => {
      setLoading(true);
      try {
        // Get job title
        const job = await apiFetch<any>(`/jobs/${jobId}`).catch(() => null);
        if (job?.title) setJobTitle(job.title);

        // Try to get existing session
        let sess: Session | null = null;
        try { sess = await apiFetch<Session>(`/api/jobs/${jobId}/session`); } catch { }

        if (!sess) {
          // Create new session
          sess = await apiFetch<Session>('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
        }

        if (!sess) { toast({ title: 'No screening found', description: 'Run a screening first.', variant: 'destructive' }); return; }

        setSession(sess);

        // Restore state
        const sigMap: Record<string, Signal> = {};
        (sess.thumbsLog || []).forEach((t: any) => { sigMap[t.candidateId] = t.signal === 'up' ? 'up' : t.signal === 'down' ? 'down' : null; });
        setSignals(sigMap);

        if (sess.status === 'finalised') {
          setFinalisedView(true);
          setMessages((sess.messages || []).map((m: any) => ({ id: m._id, role: m.role, content: m.content })));
          return;
        }

        // Restore messages
        if (sess.messages?.length) {
          setMessages(sess.messages.map((m: any) => ({ id: m._id, role: m.role, content: m.content })));
        } else {
          // First time — trigger opening message
          streamAiResponse(`/api/sessions/${sess._id}/message`, { content: '__session_start__' }, sess._id);
        }
      } catch (err) {
        toast({ title: 'Failed to load session', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
      } finally { setLoading(false); }
    };
    init();
  }, [jobId]);

  const streamAiResponse = useCallback(async (url: string, body: any, sessionId: string) => {
    setAiTyping(true);
    const tempId = `ai-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: 'ai', content: '', streaming: true }]);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('intore_token') : null;
      const resp = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) throw new Error('Stream failed');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, content: m.content + data.token } : m));
            }
            if (data.done) {
              setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, streaming: false } : m));
            }
          } catch { }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, content: 'I had trouble responding. Please try again.', streaming: false } : m));
    } finally { setAiTyping(false); }
  }, []);

  const handleThumb = async (candidateId: string, signal: 'up' | 'down') => {
    if (!session || finalising || finalisedView) return;
    const newSignal = signals[candidateId] === signal ? null : signal;
    setSignals((prev) => ({ ...prev, [candidateId]: newSignal }));

    const candidate = session.candidates.find((c) => c.candidateId === candidateId);
    const emoji = newSignal === 'up' ? '👍' : newSignal === 'down' ? '👎' : '↩️';
    setMessages((prev) => [...prev, { id: `r-${Date.now()}`, role: 'recruiter', content: `${emoji} ${candidate?.name}` }]);

    await streamAiResponse(`/api/sessions/${session._id}/thumbs`, { candidateId, signal: newSignal || 'neutral' }, session._id);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !session || aiTyping) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `r-${Date.now()}`, role: 'recruiter', content: text }]);

    // Check for finalise intent
    if (/finalise|finalize|i'm done|let's finish|done reviewing/i.test(text)) {
      handleFinalise();
      return;
    }

    await streamAiResponse(`/api/sessions/${session._id}/message`, { content: text }, session._id);
  };

  const handleFinalise = async () => {
    if (!session || finalising) return;
    setFinalising(true);
    setMessages((prev) => [...prev, { id: `r-fin-${Date.now()}`, role: 'recruiter', content: 'Finalise my decisions' }]);
    try {
      const result = await apiFetch<{ summaryMessage: string; finalDecisions: any[] }>(`/api/sessions/${session._id}/finalise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setSummaryCard(result);
      setMessages((prev) => [...prev, { id: `ai-sum-${Date.now()}`, role: 'ai', content: result.summaryMessage }]);
    } catch (err) {
      toast({ title: 'Finalisation failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally { setFinalising(false); }
  };

  const confirmDecisions = async () => {
    if (!session || !summaryCard || confirming) return;
    setConfirming(true);
    try {
      await apiFetch(`/api/sessions/${session._id}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ finalDecisions: summaryCard.finalDecisions, summaryMessage: summaryCard.summaryMessage, recruiterName: 'Recruiter' }) });
      setSummaryCard(null);
      if (!hasFiredConfetti.current) { fireCelebration(); hasFiredConfetti.current = true; }
      setTimeout(() => setFinalisedView(true), 2000);
    } catch (err) {
      toast({ title: 'Failed to save', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally { setConfirming(false); }
  };

  const approved = session?.candidates.filter((c) => signals[c.candidateId] === 'up') || [];
  const rejected = session?.candidates.filter((c) => signals[c.candidateId] === 'down') || [];
  const pending = session?.candidates.filter((c) => !signals[c.candidateId]) || [];
  const allDecided = session ? pending.length === 0 : false;

  const chips = allDecided ? QUICK_CHIPS_READY
    : approved.length > 0 ? QUICK_CHIPS_AFTER_THUMBS(approved[approved.length - 1]?.name || '')
    : QUICK_CHIPS_START;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B7BFF] mx-auto" />
        <p className="text-sm text-muted-foreground">Loading review session...</p>
      </div>
    </div>
  );

  // ── Post-finalisation view ────────────────────────────────────────────────
  if (finalisedView && session) {
    const finalApproved = session.finalDecisions?.filter((d: any) => d.decision === 'approved') || approved.map((c) => ({ candidateId: c.candidateId, decision: 'approved' }));
    const finalRejected = session.finalDecisions?.filter((d: any) => d.decision === 'rejected') || rejected.map((c) => ({ candidateId: c.candidateId, decision: 'rejected' }));
    return (
      <>
        <AppHeader title="Review Complete" />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <div className="space-y-2">
            <div className="text-5xl">🎉</div>
            <h1 className="text-3xl font-black">Decisions Finalised</h1>
            <p className="text-muted-foreground">{finalApproved.length} candidates approved for <strong>{jobTitle}</strong></p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-emerald-600">{finalApproved.length}</p>
              <p className="text-sm font-semibold text-emerald-700 mt-1">✓ Approved</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-rose-600">{finalRejected.length}</p>
              <p className="text-sm font-semibold text-rose-700 mt-1">✗ Rejected</p>
            </div>
          </div>
          {finalApproved.length > 0 && (
            <div className="bg-card rounded-xl border p-5 text-left space-y-3">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Approved Candidates</p>
              {finalApproved.map((d: any) => {
                const c = session.candidates.find((x) => x.candidateId === d.candidateId);
                return c ? (
                  <div key={d.candidateId} className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <div><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.overallScore}% match</p></div>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div className="space-y-3">
            <Button className="w-full gap-2 bg-[#4B7BFF] hover:bg-[#3461DF] h-12 text-base" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sessions/${session._id}/report`, '_blank')}>
              <FileDown className="h-5 w-5" /> Download Final Report (PDF)
            </Button>
            <div className="flex items-center justify-center gap-6 text-sm">
              <button onClick={() => router.push(`/recruiter/jobs/${jobId}`)} className="text-muted-foreground hover:text-foreground transition-colors">← Back to Job</button>
              <button onClick={() => router.push('/recruiter/dashboard')} className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</button>
              <button onClick={() => { setFinalisedView(false); hasFiredConfetti.current = false; }} className="text-[#4B7BFF] hover:underline flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> View Conversation</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Main two-column review layout ─────────────────────────────────────────
  return (
    <>
      <AppHeader title={`Review — ${jobTitle}`} />
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* LEFT: Candidate panel (40%) */}
        <div className="w-[40%] border-r overflow-y-auto bg-muted/10 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => router.push(`/recruiter/jobs/${jobId}`)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to job
            </button>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-600 font-semibold">{approved.length} approved</span>
              <span className="text-rose-600 font-semibold">{rejected.length} rejected</span>
              <span className="text-muted-foreground">{pending.length} pending</span>
            </div>
          </div>

          {session?.candidates.map((c) => {
            const sig = signals[c.candidateId];
            const borderColor = sig === 'up' ? 'border-l-emerald-500' : sig === 'down' ? 'border-l-rose-500' : 'border-l-slate-200 dark:border-l-white/10';
            return (
              <div key={c.candidateId} className={cn('bg-card rounded-xl border border-l-4 p-4 space-y-3 transition-all duration-200', borderColor)}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0', c.rank === 1 ? 'bg-amber-500' : c.rank === 2 ? 'bg-slate-400' : c.rank === 3 ? 'bg-orange-400' : 'bg-[#0F1547]')}>
                    #{c.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.recommendation}</p>
                  </div>
                </div>
                <ScoreBar score={c.overallScore} />
                <div className="flex flex-wrap gap-1">
                  {c.strengths.slice(0, 2).map((s) => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-medium">{s}</span>)}
                  {c.gaps[0] && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-medium">{c.gaps[0]}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleThumb(c.candidateId, 'up')}
                    disabled={finalisedView}
                    aria-label={`Thumbs up for ${c.name}`}
                    className={cn('flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all active:scale-95', sig === 'up' ? 'bg-emerald-500 border-emerald-500 text-white scale-105' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10')}
                  >👍</button>
                  <button
                    onClick={() => handleThumb(c.candidateId, 'down')}
                    disabled={finalisedView}
                    aria-label={`Thumbs down for ${c.name}`}
                    className={cn('flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all active:scale-95', sig === 'down' ? 'bg-rose-500 border-rose-500 text-white scale-105' : 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10')}
                  >👎</button>
                </div>
                <div className="text-center">
                  {sig === 'up' && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Approved</span>}
                  {sig === 'down' && <span className="text-[11px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">✗ Rejected</span>}
                  {!sig && <span className="text-[11px] text-muted-foreground">Pending review</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: AI Conversation (60%) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sticky header */}
          <div className="px-5 py-3 border-b bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 flex items-center justify-center"><IntoreMark className="h-4 w-4 text-[#4B7BFF]" /></div>
              <div>
                <p className="text-sm font-semibold">AI-Assisted Review — {jobTitle}</p>
                <p className="text-[10px] text-muted-foreground">{approved.length} approved · {rejected.length} rejected · {pending.length} pending</p>
              </div>
            </div>
            <Button
              onClick={handleFinalise}
              disabled={finalising || aiTyping || finalisedView}
              className={cn('gap-2 transition-all', allDecided && !finalising ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 animate-pulse' : 'bg-[#4B7BFF] hover:bg-[#3461DF]')}
            >
              {finalising ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
              {finalising ? 'Generating summary...' : 'Finalise Decisions'}
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'recruiter' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-1">
                    <IntoreMark className="w-3.5 h-3.5 text-[#4B7BFF]" />
                  </div>
                )}
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-3 text-sm', msg.role === 'ai' ? 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-tl-sm' : 'bg-[#4B7BFF] text-white rounded-tr-sm')}>
                  {msg.role === 'ai' ? <div className="space-y-1">{renderMarkdown(msg.content)}</div> : msg.content}
                  {msg.streaming && <span className="inline-block w-1.5 h-4 bg-[#4B7BFF] ml-1 animate-pulse" />}
                </div>
              </div>
            ))}

            {/* Finalisation summary card */}
            {summaryCard && (
              <div className="bg-white dark:bg-white/[0.06] border-l-4 border-[#4B7BFF] rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <IntoreMark className="h-4 w-4 text-[#4B7BFF]" />
                  <span className="text-xs font-bold text-[#4B7BFF] uppercase tracking-wide">Gemini AI · Final Summary</span>
                </div>
                <div className="text-sm leading-relaxed space-y-1">{renderMarkdown(summaryCard.summaryMessage)}</div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={confirmDecisions} disabled={confirming} className="flex-1 bg-emerald-500 hover:bg-emerald-600 gap-2">
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {confirming ? 'Saving...' : '✓ Confirm & Save Decisions'}
                  </Button>
                  <Button variant="outline" onClick={() => setSummaryCard(null)} className="flex-1 gap-2">
                    <XCircle className="h-4 w-4" /> Go back and revise
                  </Button>
                </div>
              </div>
            )}

            {aiTyping && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-1">
                  <IntoreMark className="w-3.5 h-3.5 text-[#4B7BFF]" />
                </div>
                <div className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sticky input */}
          <div className="p-4 border-t bg-muted/10 space-y-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button key={chip} onClick={() => sendMessage(chip)} className="text-[11px] px-3 py-1.5 rounded-full bg-[#4B7BFF]/10 text-[#4B7BFF] border border-[#4B7BFF]/20 hover:bg-[#4B7BFF]/20 transition-colors font-medium">
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask Gemini anything about these candidates..."
                aria-label="Message to AI advisor"
                rows={2}
                className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
              />
              <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || aiTyping} className="shrink-0 h-10 w-10 self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
