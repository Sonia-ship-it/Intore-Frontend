import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Lock, Send, MapPin, Calendar, Users, ChevronDown, ChevronUp, Upload, Download, RefreshCw, Bot, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScoreBar } from '@/components/intore/ScoreBar';
import { ConfidenceBadge } from '@/components/intore/ConfidenceBadge';
import { StrengthChip, GapChip } from '@/components/intore/Chips';
import { BiasWarning } from '@/components/intore/BiasWarning';
import { ChatBubble } from '@/components/intore/ChatBubble';
import { SuggestionChips } from '@/components/intore/SuggestionChips';
import { Avatar } from '@/components/intore/Avatar';
import { Spinner } from '@/components/intore/Spinner';
import { StatusBadge } from '@/components/intore/Badges';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { ScreeningResult } from '@/data/mockData';
import { useScreeningStore } from '@/stores/screeningStore';
import { useIngestionStore } from '@/stores/ingestionStore';
import { runScreeningAndWait, type ApiScreeningResult } from '@/lib/screeningApi';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

type JobDto = { id?: string; _id?: string; title?: string; department?: string; employmentType?: string; location?: string; publishedAt?: string };
type UiResult = ScreeningResult & { _raw?: ApiScreeningResult };

const SUGGESTIONS = [
  'Who is the best overall fit?',
  'Compare the top 3 candidates',
  'What are the biggest skill gaps?',
  'Who almost qualified and why?',
  'Summarize the shortlist',
  'Which candidates have the most relevant experience?',
  'Are there any bias concerns in the ranking?',
];

// ── Download helpers ──────────────────────────────────────────────────────────
function resultsToCSV(results: UiResult[]): string {
  const header = ['Rank', 'Name', 'Score', 'Confidence', 'Top Strength', 'Key Gap', 'Recommendation', 'Reasoning'];
  const rows = results.map((r) => [
    r.rank,
    r._raw?.name || r.candidateId,
    r.matchScore,
    r.confidence,
    r.topStrength,
    r.keyGap,
    r.recommendation,
    `"${(r.reasoning || '').replace(/"/g, "'")}"`,
  ]);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Recommendation badge ──────────────────────────────────────────────────────
function RecBadge({ rec }: { rec: string }) {
  const lower = rec.toLowerCase();
  if (lower.includes('shortlist'))
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Shortlist</span>;
  if (lower.includes('consider'))
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600"><HelpCircle className="h-3 w-3" />Consider</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600"><XCircle className="h-3 w-3" />Not Selected</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function JobDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const ingestion = useIngestionStore((s) => (id ? s.byJobId[id] : undefined));

  const [job, setJob] = useState({ id: id || 'unknown', title: 'Job', department: 'Department', location: 'Location', postedDate: '—', applicantCount: ingestion?.candidates?.length || 0 });
  const [results, setResults] = useState<UiResult[]>([]);
  const [shortlistSize, setShortlistSize] = useState<10 | 20>(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status, progress, biasWarningDismissed, chatMessages, isUnlocked,
    setStatus, setProgress, dismissBiasWarning, addChatMessage, setChatMessages,
    setIsUnlocked, resetScreening } = useScreeningStore();

  useEffect(() => { resetScreening(); }, [id]);

  useEffect(() => {
    if (!id) return;
    apiFetch<JobDto>(`/jobs/${id}`)
      .then((j) => setJob({ id: j.id || j._id || id, title: j.title || 'Job', department: j.department || j.employmentType || 'Department', location: j.location || 'Location', postedDate: j.publishedAt ? new Date(j.publishedAt).toLocaleDateString() : '—', applicantCount: ingestion?.candidates?.length || 0 }))
      .catch(() => {});
  }, [id, ingestion?.candidates?.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Animated progress steps while Gemini is working
  const startProgressAnimation = () => {
    const steps = [
      { pct: 15, label: 'Loading candidate profiles...' },
      { pct: 30, label: 'Parsing resumes with AI...' },
      { pct: 50, label: 'Evaluating skills & experience...' },
      { pct: 70, label: 'Ranking candidates with Gemini...' },
      { pct: 88, label: 'Generating insights & recommendations...' },
    ];
    let i = 0;
    setProgress(steps[0].pct);
    setProgressLabel(steps[0].label);
    progressTimer.current = setInterval(() => {
      i++;
      if (i < steps.length) {
        setProgress(steps[i].pct);
        setProgressLabel(steps[i].label);
      } else {
        if (progressTimer.current) clearInterval(progressTimer.current);
      }
    }, 1800);
  };

  const stopProgressAnimation = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
  };

  const toUiResults = (apiResults: ApiScreeningResult[]): UiResult[] =>
    apiResults.slice(0, shortlistSize).map((r) => ({
      candidateId: r.applicationId || `candidate_${r.rank}`,
      jobId: job.id,
      rank: r.rank,
      matchScore: Math.round(r.score),
      confidence: (r.score >= 75 ? 'High' : r.score >= 50 ? 'Medium' : 'Low') as UiResult['confidence'],
      topStrength: r.strengths?.[0] || '—',
      keyGap: r.gaps?.[0] || '—',
      strengths: r.strengths || [],
      gaps: r.gaps || [],
      reasoning: r.reason || '',
      recommendation: r.recommendation || 'No recommendation',
      _raw: r,
    }));

  const runScreeningClick = async () => {
    const hasExternal = (ingestion?.candidates?.length || 0) > 0;
    const hasUmurava = Boolean(ingestion?.umurava?.profiles);
    if (!hasExternal && !hasUmurava) {
      toast({ title: 'No applicants uploaded', description: 'Upload candidates via CSV/Excel, PDF/links, or Umurava profiles first.', variant: 'destructive' });
      return;
    }
    setStatus('running');
    startProgressAnimation();
    try {
      const { results: apiResults } = await runScreeningAndWait({ jobId: job.id, topK: shortlistSize });
      stopProgressAnimation();
      setProgress(100);
      setProgressLabel('Screening complete');
      const uiResults = toUiResults(apiResults);
      setResults(uiResults);
      setStatus('complete');
      setIsUnlocked(true);
      setChatMessages([]);
      // Auto-send a summary message from AI
      addChatMessage({ id: `ai-intro`, role: 'ai', content: `Screening complete. I ranked **${uiResults.length} candidates** for **${job.title}**.\n\n🏆 Top pick: **${uiResults[0]?._raw?.name || 'Candidate #1'}** with a ${uiResults[0]?.matchScore}% match score.\n\nAsk me anything about the results — comparisons, gaps, or who to interview first.`, timestamp: new Date().toISOString() });
      toast({ title: 'Screening complete', description: `Top ${uiResults.length} candidates ranked by Gemini.` });
    } catch (e) {
      stopProgressAnimation();
      setProgress(0);
      setProgressLabel('');
      setStatus('error');
      toast({ title: 'Screening failed', description: e instanceof Error ? e.message : 'Check backend connectivity and try again.', variant: 'destructive' });
    }
  };

  const runNewAiScreening = async () => {
    const hasExternal = (ingestion?.candidates?.length || 0) > 0;
    const hasUmurava = Boolean(ingestion?.umurava?.profiles);
    if (!hasExternal && !hasUmurava) {
      toast({ title: 'No applicants uploaded', description: 'Upload candidates via CSV/Excel, PDF/links, or Umurava profiles first.', variant: 'destructive' });
      return;
    }

    // Show loading state
    toast({
      title: 'Starting AI Screening',
      description: `AI is evaluating ${ingestion?.candidates?.length || 0} candidates...`,
    });

    try {
      // Get candidate IDs from ingestion data
      const candidateIds = ingestion?.candidates?.map((c: any) => c.id) || [];

      const response = await apiFetch<{ success: boolean; data?: any; error?: string }>('/api/screenings/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          candidateIds,
          shortlistSize
        }),
      });

      if (response.success && response.data) {
        toast({
          title: 'AI Screening Complete',
          description: `Successfully screened ${response.data.totalCandidatesEvaluated} candidates. Redirecting to results...`,
        });
        // Redirect to the new results page
        router.push(`/recruiter/screenings/${job.id}`);
      } else {
        toast({
          title: 'Screening failed',
          description: response.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Screening failed',
        description: error instanceof Error ? error.message : 'Failed to run AI screening',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    addChatMessage({ id: `u${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() });
    setChatInput('');
    setChatLoading(true);
    try {
      const resp = await apiFetch<{ answer: string }>('/screening/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, question: text }),
      });
      addChatMessage({ id: `a${Date.now()}`, role: 'ai', content: resp.answer || 'I could not find enough context. Try rephrasing.', timestamp: new Date().toISOString() });
    } catch (err) {
      addChatMessage({ id: `a${Date.now()}`, role: 'ai', content: err instanceof Error ? err.message : 'Unable to answer right now.', timestamp: new Date().toISOString() });
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    downloadFile(resultsToCSV(results), `screening-${job.title.replace(/\s+/g, '-')}.csv`, 'text/csv');
  };

  const handleDownloadJSON = () => {
    const data = results.map((r) => ({ rank: r.rank, name: r._raw?.name || r.candidateId, score: r.matchScore, confidence: r.confidence, recommendation: r.recommendation, strengths: r.strengths, gaps: r.gaps, reasoning: r.reasoning }));
    downloadFile(JSON.stringify(data, null, 2), `screening-${job.title.replace(/\s+/g, '-')}.json`, 'application/json');
  };

  const completedCount = Math.round((progress / 100) * Math.max(job.applicantCount, 1));

  return (
    <>
      <AppHeader title={job.title} />
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── Left Panel ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Job summary card */}
            <div className="bg-card rounded-xl p-5 shadow-sm border space-y-4">
              <div>
                <h2 className="text-xl font-bold">{job.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <StatusBadge status={job.department} />
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.postedDate}</span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4B7BFF]/10 text-[#4B7BFF] text-xs font-medium">
                    <Users className="h-3.5 w-3.5" /> {job.applicantCount} applicants
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border px-3 py-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {ingestion?.candidates?.length || 0} candidate(s) ingested
                </span>
                {ingestion?.umurava?.profiles && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border px-3 py-1.5">Umurava profiles loaded</span>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push(`/recruiter/jobs/${job.id}/upload`)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload applicants
                </Button>
                <div className="ml-auto flex items-center gap-3">
                  <select value={shortlistSize} onChange={(e) => setShortlistSize((Number(e.target.value) as 10 | 20) || 10)} className="bg-background rounded-lg border px-3 py-2 text-sm outline-none" title="Shortlist size">
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                  <Button variant="outline" onClick={runNewAiScreening} disabled={status === 'running'} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0">
                    <Bot className="h-4 w-4 mr-2" /> Run AI Screening
                  </Button>
                  <Button onClick={runScreeningClick} disabled={status === 'running'} className={cn(status === 'running' && 'opacity-70')}>
                    {status === 'running'
                      ? <><Spinner size="sm" className="mr-2" /> Screening...</>
                      : status === 'complete'
                        ? <><RefreshCw className="h-4 w-4 mr-2" /> Re-run</>
                        : <><Bot className="h-4 w-4 mr-2" /> Screen Candidates</>}
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress */}
            {status === 'running' && (
              <div className="bg-card rounded-xl p-5 shadow-sm border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{progressLabel}</span>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-[#4B7BFF] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Gemini is analyzing {job.applicantCount} candidate{job.applicantCount !== 1 ? 's' : ''}... ({completedCount}/{job.applicantCount})</p>
              </div>
            )}

            {/* Bias Warning */}
            {status === 'complete' && !biasWarningDismissed && (
              <BiasWarning message="Ranking may favour candidates with formal degrees. Consider reviewing candidates with strong project portfolios." onDismiss={dismissBiasWarning} />
            )}

            {/* Results */}
            {status === 'complete' && results.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                {/* Table header + download */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b">
                  <div>
                    <p className="font-semibold text-sm">Ranked Candidates</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{results.length} candidates · powered by Gemini</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> JSON
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left bg-muted/30">
                        {['Rank', 'Candidate', 'Match Score', 'Recommendation', 'Strength', 'Gap', 'Confidence', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const displayName = r._raw?.name || `Applicant ${String(r.candidateId).slice(-6)}`;
                        const isExpanded = expandedRow === r.candidateId;
                        const rankColors = ['text-amber-500', 'text-slate-400', 'text-orange-400'];
                        return (
                          <React.Fragment key={r.candidateId}>
                            <tr className={cn('border-b last:border-0 hover:bg-muted/30 transition-colors', isExpanded && 'bg-muted/20')}>
                              <td className="px-4 py-3">
                                <span className={cn('font-black text-sm', i < 3 ? rankColors[i] : 'text-muted-foreground')}>#{r.rank}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <Avatar name={displayName} color="bg-[#0F1547]" size="sm" />
                                  <p className="text-sm font-semibold">{displayName}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 min-w-[140px]"><ScoreBar score={r.matchScore} /></td>
                              <td className="px-4 py-3"><RecBadge rec={r.recommendation} /></td>
                              <td className="px-4 py-3"><StrengthChip label={r.topStrength} /></td>
                              <td className="px-4 py-3"><GapChip label={r.keyGap} /></td>
                              <td className="px-4 py-3"><ConfidenceBadge level={r.confidence} /></td>
                              <td className="px-4 py-3">
                                <button onClick={() => setExpandedRow(isExpanded ? null : r.candidateId)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b bg-muted/10">
                                <td colSpan={8} className="px-6 py-5">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">AI Reasoning</p>
                                        <p className="text-sm leading-relaxed">{r.reasoning || 'No reasoning provided.'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Recommendation</p>
                                        <p className="text-sm font-semibold">{r.recommendation}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Strengths</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {r.strengths.length > 0 ? r.strengths.map((s) => <StrengthChip key={s} label={s} />) : <span className="text-xs text-muted-foreground">None listed</span>}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Gaps</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {r.gaps.length > 0 ? r.gaps.map((g) => <GapChip key={g} label={g} />) : <span className="text-xs text-muted-foreground">None listed</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 pt-3 border-t flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => sendMessage(`Tell me more about ${displayName} and why they ranked #${r.rank}`)}>
                                      <Bot className="h-3.5 w-3.5 mr-1.5" /> Ask AI about this candidate
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="bg-card rounded-xl border border-rose-200 p-6 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Screening failed</p>
                  <p className="text-sm text-muted-foreground mt-1">Gemini could not complete the screening. Check that candidates are uploaded and the backend is reachable, then try again.</p>
                  <Button size="sm" className="mt-3" onClick={runScreeningClick}>Retry</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Panel — AI Chat ── */}
          <div className="w-full xl:w-[400px] shrink-0">
            <div className="bg-card rounded-xl shadow-sm border flex flex-col h-[calc(100vh-8rem)] sticky top-24">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#4B7BFF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">AI Recruiter Assistant</h3>
                    <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
                  </div>
                </div>
                {isUnlocked && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Live</span>
                )}
              </div>

              {!isUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="font-semibold text-sm">Run screening to unlock</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Once screening completes, ask Gemini anything about the candidates.</p>
                  <Button size="sm" onClick={runScreeningClick} disabled={status === 'running'}>
                    {status === 'running' ? 'Screening...' : 'Start Screening'}
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg) => (
                      <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Spinner size="sm" /> Gemini is thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t space-y-3">
                    <SuggestionChips suggestions={SUGGESTIONS.slice(0, 4)} onSelect={(s) => sendMessage(s)} />
                    <div className="flex gap-2">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                        placeholder="Ask about candidates, gaps, comparisons..."
                        rows={2}
                        className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                      />
                      <Button size="icon" onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || chatLoading} className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
