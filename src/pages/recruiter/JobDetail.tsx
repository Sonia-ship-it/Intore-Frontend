import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Lock, Send, MapPin, Calendar, Users, ChevronDown, ChevronUp, Upload, Download, RefreshCw, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ThumbsUp, ThumbsDown, Trophy, FileDown, Loader2 } from 'lucide-react';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScoreBar } from '@/components/intore/ScoreBar';
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

const SUGGESTIONS = ['Who is the best overall fit?', 'Compare the top 3 candidates', 'What are the biggest skill gaps?', 'Who almost qualified and why?', 'Summarize the shortlist'];

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function RecBadge({ rec }: { rec: string }) {
  const l = rec.toLowerCase();
  if (l.includes('shortlist')) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Shortlist</span>;
  if (l.includes('consider')) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600"><HelpCircle className="h-3 w-3" />Consider</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600"><XCircle className="h-3 w-3" />Not Selected</span>;
}

function ConfettiExplosion({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 60 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 0.8, color: ['#4B7BFF','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i % 6], size: 6 + Math.random() * 8, duration: 1.5 + Math.random() * 1 }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => <div key={p.id} className="absolute rounded-sm" style={{ left: `${p.x}%`, top: '-10px', width: p.size, height: p.size, background: p.color, animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards` }} />)}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ── JSON → prose converter (safety net for Gemini) ───────────────────────────
function formatAiAnswer(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return t;
  try {
    const parsed = JSON.parse(t);
    return jsonToProse(parsed);
  } catch { return t; }
}
function jsonToProse(obj: unknown): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return obj.map((x) => `- ${jsonToProse(x)}`).join('\n');
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 1) return jsonToProse(entries[0][1]);
    const r = obj as Record<string, unknown>;
    const parts: string[] = [];
    if (r.name) parts.push(`**${r.name}**`);
    if (r.score !== undefined) parts.push(`with a **${Math.round(Number(r.score))}% match score**`);
    if (r.recommendation) parts.push(`— **${r.recommendation}**`);
    if (r.reason || r.reasoning) parts.push(`\n\n${r.reason || r.reasoning}`);
    if (Array.isArray(r.strengths) && r.strengths.length) parts.push(`\n\n**Strengths:**\n${(r.strengths as string[]).map(s => `- ${s}`).join('\n')}`);
    if (Array.isArray(r.gaps) && r.gaps.length) parts.push(`\n\n**Gaps:**\n${(r.gaps as string[]).map(g => `- ${g}`).join('\n')}`);
    if (parts.length) return parts.join(' ');
    return entries.map(([k, v]) => `**${k.replace(/_/g, ' ')}:** ${jsonToProse(v)}`).join('\n');
  }
  return String(obj);
}

function generatePDF(results: UiResult[], decisions: Record<string, 'approved'|'rejected'|null>, finalSummary: string, jobTitle: string) {
  const approved = results.filter((r) => decisions[r.candidateId] === 'approved');
  const rejected = results.filter((r) => decisions[r.candidateId] === 'rejected');
  const pending = results.filter((r) => !decisions[r.candidateId]);
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const candidateCard = (r: UiResult, badge: string, badgeColor: string) => `
    <div class="card">
      <div class="card-header">
        <div class="rank-badge">#${r.rank}</div>
        <div class="candidate-info">
          <div class="candidate-name">${r._raw?.name || r.candidateId}</div>
          <div class="candidate-meta">Match Score: <strong>${r.matchScore}%</strong> &nbsp;·&nbsp; AI Verdict: <strong>${r.recommendation}</strong></div>
        </div>
        <div class="decision-badge" style="background:${badgeColor}20;color:${badgeColor};border:1.5px solid ${badgeColor}40">${badge}</div>
        <div class="score-circle" style="border-color:${r.matchScore >= 70 ? '#10b981' : r.matchScore >= 50 ? '#f59e0b' : '#ef4444'}">${r.matchScore}%</div>
      </div>
      <div class="card-body">
        <div class="section">
          <div class="section-title">AI Analysis</div>
          <p class="reasoning">${r.reasoning || 'No detailed reasoning provided.'}</p>
        </div>
        <div class="two-col">
          <div class="section">
            <div class="section-title strengths-title">Key Strengths</div>
            <ul class="tag-list">${r.strengths.map(s => `<li class="tag strength-tag">${s}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <div class="section-title gaps-title">Areas for Development</div>
            <ul class="tag-list">${r.gaps.map(g => `<li class="tag gap-tag">${g}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Screening Report — ${jobTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
  .page { max-width: 860px; margin: 0 auto; padding: 48px 40px; }

  /* Header */
  .report-header { background: linear-gradient(135deg, #0F1547 0%, #1a2060 100%); border-radius: 16px; padding: 36px 40px; margin-bottom: 32px; color: white; display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-diamond { width: 40px; height: 40px; }
  .logo-name { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .report-title { font-size: 28px; font-weight: 800; margin-top: 20px; }
  .report-meta { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 6px; }
  .header-right { text-align: right; }
  .stat-box { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 24px; text-align: center; }
  .stat-number { font-size: 36px; font-weight: 800; color: #4B7BFF; }
  .stat-label { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }

  /* Summary */
  .summary-box { background: white; border-radius: 12px; border-left: 4px solid #4B7BFF; padding: 24px 28px; margin-bottom: 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
  .summary-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4B7BFF; margin-bottom: 10px; }
  .summary-text { font-size: 14px; color: #374151; line-height: 1.7; }

  /* Stats row */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: white; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); text-align: center; }
  .stat-card .number { font-size: 32px; font-weight: 800; }
  .stat-card .label { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
  .approved-stat .number { color: #10b981; }
  .rejected-stat .number { color: #ef4444; }
  .pending-stat .number { color: #94a3b8; }

  /* Section heading */
  .section-heading { font-size: 18px; font-weight: 700; color: #0f172a; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }

  /* Candidate card */
  .card { background: white; border-radius: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); margin-bottom: 16px; overflow: hidden; }
  .card-header { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
  .rank-badge { width: 36px; height: 36px; border-radius: 10px; background: #0F1547; color: white; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .candidate-info { flex: 1; }
  .candidate-name { font-size: 16px; font-weight: 700; color: #0f172a; }
  .candidate-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
  .decision-badge { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .score-circle { width: 52px; height: 52px; border-radius: 50%; border: 3px solid; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
  .card-body { padding: 20px 24px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; }
  .strengths-title { color: #059669; }
  .gaps-title { color: #dc2626; }
  .reasoning { font-size: 13px; color: #374151; line-height: 1.65; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .tag-list { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .strength-tag { background: #d1fae5; color: #065f46; }
  .gap-tag { background: #fee2e2; color: #991b1b; }

  /* Footer */
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 13px; font-weight: 700; color: #4B7BFF; }
  .footer-meta { font-size: 12px; color: #94a3b8; }

  @media print { body { background: white; } .page { padding: 20px; } }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div>
      <div class="logo">
        <svg class="logo-diamond" viewBox="0 0 64 64" fill="none">
          <path d="M32 5.5 54.5 32 32 58.5 9.5 32 32 5.5Z" stroke="#4B7BFF" stroke-width="4.5" stroke-linejoin="round"/>
          <circle cx="32" cy="32" r="6.5" fill="#4B7BFF"/>
        </svg>
        <span class="logo-name">Intore</span>
      </div>
      <div class="report-title">Final Screening Report</div>
      <div class="report-meta">Position: <strong style="color:white">${jobTitle}</strong> &nbsp;·&nbsp; ${date}</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${results.length}</div>
      <div class="stat-label">Candidates Screened</div>
    </div>
  </div>

  <!-- AI Summary -->
  <div class="summary-box">
    <div class="summary-title">AI Screening Summary</div>
    <div class="summary-text">${finalSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</div>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card approved-stat"><div class="number">${approved.length}</div><div class="label">Approved by Recruiter</div></div>
    <div class="stat-card rejected-stat"><div class="number">${rejected.length}</div><div class="label">Rejected by Recruiter</div></div>
    <div class="stat-card pending-stat"><div class="number">${pending.length}</div><div class="label">Pending Review</div></div>
  </div>

  ${approved.length > 0 ? `
  <div class="section-heading">✅ Approved Candidates (${approved.length})</div>
  ${approved.map(r => candidateCard(r, 'Approved', '#10b981')).join('')}` : ''}

  ${rejected.length > 0 ? `
  <div class="section-heading">❌ Rejected Candidates (${rejected.length})</div>
  ${rejected.map(r => candidateCard(r, 'Rejected', '#ef4444')).join('')}` : ''}

  ${pending.length > 0 ? `
  <div class="section-heading">⏳ Pending Review (${pending.length})</div>
  ${pending.map(r => candidateCard(r, 'Pending', '#94a3b8')).join('')}` : ''}

  <!-- Footer -->
  <div class="footer">
    <span class="footer-brand">Intore AI · Built for Rwanda's growing workforce</span>
    <span class="footer-meta">Generated ${date} · Confidential</span>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `screening-report-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.html`; a.click();
  URL.revokeObjectURL(url);
}

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

  const [decisions, setDecisions] = useState<Record<string, 'approved'|'rejected'|null>>({});
  const [aiComments, setAiComments] = useState<Record<string, string>>({});
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalSummary, setFinalSummary] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const { status, progress, biasWarningDismissed, chatMessages, isUnlocked,
    setStatus, setProgress, dismissBiasWarning, addChatMessage, setChatMessages,
    setIsUnlocked, resetScreening } = useScreeningStore();

  useEffect(() => { resetScreening(); }, [id]);

  useEffect(() => {
    if (!id) return;
    apiFetch<any>(`/screening/snapshot/${id}`)
      .then((snap) => {
        if (!snap?.results?.length) return;
        const uiResults = snap.results.map((r: any) => ({
          candidateId: r.applicationId || `candidate_${r.rank}`, jobId: id, rank: r.rank,
          matchScore: Math.round(r.score), confidence: (r.score >= 75 ? 'High' : r.score >= 50 ? 'Medium' : 'Low') as UiResult['confidence'],
          topStrength: r.strengths?.[0] || '—', keyGap: r.gaps?.[0] || '—',
          strengths: r.strengths || [], gaps: r.gaps || [], reasoning: r.reason || '',
          recommendation: r.recommendation || 'No recommendation', _raw: r,
        }));
        setResults(uiResults); setStatus('complete'); setIsUnlocked(true);
        if (snap.decisions) setDecisions(snap.decisions);
        if (snap.finalized) { setFinalized(true); setFinalSummary(snap.finalSummary || ''); }
        setChatMessages([{ id: 'restored', role: 'ai', content: `Welcome back! Restored screening for **${snap.results.length} candidates**. ${snap.finalized ? '✅ Finalized.' : 'Continue reviewing.'}`, timestamp: new Date().toISOString() }]);
      }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    apiFetch<JobDto>(`/jobs/${id}`)
      .then((j) => setJob({ id: j.id || j._id || id, title: j.title || 'Job', department: j.department || j.employmentType || 'Department', location: j.location || 'Location', postedDate: j.publishedAt ? new Date(j.publishedAt).toLocaleDateString() : '—', applicantCount: ingestion?.candidates?.length || 0 }))
      .catch(() => {});
  }, [id, ingestion?.candidates?.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const startProgressAnimation = () => {
    const steps = [{ pct: 15, label: 'Loading candidate profiles...' }, { pct: 30, label: 'Parsing resumes with AI...' }, { pct: 50, label: 'Evaluating skills & experience...' }, { pct: 70, label: 'Ranking candidates...' }, { pct: 88, label: 'Generating insights...' }];
    let i = 0; setProgress(steps[0].pct); setProgressLabel(steps[0].label);
    progressTimer.current = setInterval(() => { i++; if (i < steps.length) { setProgress(steps[i].pct); setProgressLabel(steps[i].label); } else if (progressTimer.current) clearInterval(progressTimer.current); }, 1800);
  };
  const stopProgressAnimation = () => { if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; } };

  const toUiResults = (apiResults: ApiScreeningResult[]): UiResult[] =>
    apiResults.slice(0, shortlistSize).map((r) => ({
      candidateId: r.applicationId || `candidate_${r.rank}`, jobId: job.id, rank: r.rank,
      matchScore: Math.round(r.score), confidence: (r.score >= 75 ? 'High' : r.score >= 50 ? 'Medium' : 'Low') as UiResult['confidence'],
      topStrength: r.strengths?.[0] || '—', keyGap: r.gaps?.[0] || '—',
      strengths: r.strengths || [], gaps: r.gaps || [], reasoning: r.reason || '',
      recommendation: r.recommendation || 'No recommendation', _raw: r,
    }));

  const saveDecision = useCallback(async (candidateId: string, decision: 'approved'|'rejected') => {
    if (!id) return;
    const newDecision = decisions[candidateId] === decision ? null : decision;
    setDecisions((prev) => ({ ...prev, [candidateId]: newDecision }));
    if (!newDecision) return;
    setDecisionLoading(candidateId);
    try {
      const resp = await apiFetch<{ ok: boolean; aiComment?: string }>('/screening/decision', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: id, applicationId: candidateId, decision: newDecision }) });
      if (resp.aiComment) { setAiComments((prev) => ({ ...prev, [candidateId]: resp.aiComment! })); addChatMessage({ id: `dec-${Date.now()}`, role: 'ai', content: resp.aiComment!, timestamp: new Date().toISOString() }); }
    } catch { } finally { setDecisionLoading(null); }
  }, [id, decisions]);

  const finalizeScreening = async () => {
    if (!id) return; setFinalizing(true);
    try {
      const resp = await apiFetch<{ ok: boolean; finalSummary: string; approved: number; rejected: number }>('/screening/finalize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: id }) });
      setFinalized(true); setFinalSummary(resp.finalSummary); setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      addChatMessage({ id: `final-${Date.now()}`, role: 'ai', content: `🎉 **Screening finalized!**\n\n${resp.finalSummary}\n\n**${resp.approved} approved**, ${resp.rejected} rejected.`, timestamp: new Date().toISOString() });
      toast({ title: '🎉 Screening finalized!', description: `${resp.approved} candidates approved.` });
    } catch (err) { toast({ title: 'Finalization failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' }); }
    finally { setFinalizing(false); }
  };

  const runScreeningClick = async () => {
    const hasExternal = (ingestion?.candidates?.length || 0) > 0;
    const hasUmurava = Boolean(ingestion?.umurava?.profiles);
    if (!hasExternal && !hasUmurava) { toast({ title: 'No applicants uploaded', description: 'Upload candidates first.', variant: 'destructive' }); return; }
    setStatus('running'); startProgressAnimation();
    try {
      const { results: apiResults } = await runScreeningAndWait({ jobId: job.id, topK: shortlistSize });
      stopProgressAnimation(); setProgress(100); setProgressLabel('Screening complete');
      const uiResults = toUiResults(apiResults);
      setResults(uiResults); setStatus('complete'); setIsUnlocked(true); setChatMessages([]);
      addChatMessage({ id: 'ai-intro', role: 'ai', content: `Screening complete. I ranked **${uiResults.length} candidates** for **${job.title}**.\n\n🏆 Top pick: **${uiResults[0]?._raw?.name || 'Candidate #1'}** with a ${uiResults[0]?.matchScore}% match score.\n\nNow review each candidate with Approve or Reject  your final decision matters.`, timestamp: new Date().toISOString() });
      toast({ title: 'Screening complete', description: `Top ${uiResults.length} candidates ranked.` });
    } catch (e) {
      stopProgressAnimation(); setProgress(0); setProgressLabel(''); setStatus('error');
      toast({ title: 'Screening failed', description: e instanceof Error ? e.message : 'Check backend.', variant: 'destructive' });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    addChatMessage({ id: `u${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() });
    setChatInput(''); setChatLoading(true);
    try {
      const resp = await apiFetch<{ answer: string }>('/screening/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id, question: text }) });
      const raw = resp.answer || 'I could not find enough context.';
      const answer = formatAiAnswer(raw);
      addChatMessage({ id: `a${Date.now()}`, role: 'ai', content: answer, timestamp: new Date().toISOString() });
    } catch (err) { addChatMessage({ id: `a${Date.now()}`, role: 'ai', content: err instanceof Error ? err.message : 'Unable to answer.', timestamp: new Date().toISOString() }); }
    finally { setChatLoading(false); }
  };

  const completedCount = Math.round((progress / 100) * Math.max(job.applicantCount, 1));
  const decisionCount = Object.values(decisions).filter(Boolean).length;

  return (
    <>
      <ConfettiExplosion active={showConfetti} />
      <AppHeader title={job.title} />
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Left Panel */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Job summary */}
            <div className="bg-card rounded-xl p-5 shadow-sm border space-y-4">
              <div>
                <h2 className="text-xl font-bold">{job.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <StatusBadge status={job.department} />
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.postedDate}</span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4B7BFF]/10 text-[#4B7BFF] text-xs font-medium"><Users className="h-3.5 w-3.5" /> {job.applicantCount} applicants</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border px-3 py-1.5"><Upload className="h-3.5 w-3.5" />{ingestion?.candidates?.length || 0} candidate(s) ingested</span>
                <Button variant="outline" size="sm" onClick={() => router.push(`/recruiter/jobs/${job.id}/upload`)}><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload applicants</Button>
                <div className="ml-auto flex items-center gap-3">
                  {(status === 'complete' || finalized) && (
                    <Button onClick={() => router.push(`/recruiter/jobs/${job.id}/review`)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                      <Trophy className="h-4 w-4" /> Start AI-Assisted Review
                    </Button>
                  )}
                  <select value={shortlistSize} onChange={(e) => setShortlistSize((Number(e.target.value) as 10 | 20) || 10)} className="bg-background rounded-lg border px-3 py-2 text-sm outline-none">
                    <option value={10}>Top 10</option><option value={20}>Top 20</option>
                  </select>
                  <Button onClick={runScreeningClick} disabled={status === 'running'} className={cn(status === 'running' && 'opacity-70')}>
                    {status === 'running' ? <><Spinner size="sm" className="mr-2" />Screening...</> : (status === 'complete' || finalized) ? <><RefreshCw className="h-4 w-4 mr-2" />Re-run</> : <><IntoreMark className="h-4 w-4 mr-2 text-[#4B7BFF]" />Screen Candidates</>}
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress */}
            {status === 'running' && (
              <div className="bg-card rounded-xl p-5 shadow-sm border space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground font-medium">{progressLabel}</span><span className="text-xs text-muted-foreground">{progress}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-[#4B7BFF] transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-muted-foreground">Analyzing {job.applicantCount} candidates... ({completedCount}/{job.applicantCount})</p>
              </div>
            )}

            {/* AI-Assisted Review CTA — shown after screening */}
            {(status === 'complete' || finalized) && results.length > 0 && !finalized && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#4B7BFF]/10 to-violet-500/10 border border-emerald-500/20 p-6 flex items-center justify-between gap-4">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ready for Review</span>
                  </div>
                  <h3 className="font-bold text-base">Start AI-Assisted Decision Session</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Review each candidate with Gemini AI — thumbs up/down, ask questions, finalise decisions, generate PDF report.</p>
                </div>
                <Button
                  onClick={() => router.push(`/recruiter/jobs/${job.id}/review`)}
                  className="shrink-0 gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-base px-6 py-3 h-auto"
                >
                  <Trophy className="h-5 w-5" /> Start AI Review
                </Button>
              </div>
            )}

            {finalized && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Screening Finalized</p>
                    <p className="text-xs text-emerald-600/70">All decisions saved. Download the report or view the AI conversation.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push(`/recruiter/jobs/${job.id}/review`)} className="gap-1.5">
                  View Session
                </Button>
              </div>
            )}
            {/* Bias Warning */}
            {status === 'complete' && !biasWarningDismissed && (
              <BiasWarning message="Ranking may favour candidates with formal degrees. Consider reviewing candidates with strong project portfolios." onDismiss={dismissBiasWarning} />
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="bg-card rounded-xl border border-rose-200 p-6 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div><p className="font-semibold text-sm">Screening failed</p><p className="text-sm text-muted-foreground mt-1">Check that candidates are uploaded and the backend is reachable.</p></div>
                <Button size="sm" variant="outline" className="ml-auto" onClick={runScreeningClick}>Retry</Button>
              </div>
            )}

            {/* Results table */}
            {(status === 'complete' || finalized) && results.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-sm">Ranked Candidates</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{results.length} candidates · Gemini</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{Object.values(decisions).filter(d => d === 'approved').length}</span>
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5" />{Object.values(decisions).filter(d => d === 'rejected').length}</span>
                    <span className="text-xs text-muted-foreground">{results.length - decisionCount} pending</span>
                    <div className="w-px h-4 bg-border" />
                    <Button variant="outline" size="sm" onClick={() => downloadFile(results.map((r) => [r.rank, r._raw?.name||r.candidateId, r.matchScore, r.recommendation].join(',')).join('\n'), `screening-${job.title}.csv`, 'text/csv')} className="gap-1.5"><Download className="h-3.5 w-3.5" />CSV</Button>
                    {finalized && <Button size="sm" onClick={() => generatePDF(results, decisions, finalSummary, job.title)} className="gap-1.5 bg-[#4B7BFF] hover:bg-[#3461DF]"><FileDown className="h-3.5 w-3.5" />Download Report</Button>}
                    {!finalized && decisionCount === results.length && results.length > 0 && (
                      <Button size="sm" onClick={finalizeScreening} disabled={finalizing} className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                        {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                        {finalizing ? 'Finalizing...' : 'Finalize & Generate Report'}
                      </Button>
                    )}
                    {finalized && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full"><CheckCircle2 className="h-3.5 w-3.5" />Finalized</span>}
                  </div>
                </div>
                {/* Hint */}
                {!finalized && decisionCount < results.length && (
                  <div className="px-5 py-2 bg-amber-500/5 border-b text-xs text-amber-600 flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5" /> Review all {results.length - decisionCount} remaining candidates with 👍 or 👎 to unlock Finalize
                  </div>
                )}
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left bg-muted/30">
                        {['Rank','Candidate','Match Score','Recommendation','Strength','Gap','Your Decision',''].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const displayName = r._raw?.name || `Applicant ${String(r.candidateId).slice(-6)}`;
                        const isExpanded = expandedRow === r.candidateId;
                        const decision = decisions[r.candidateId] || null;
                        const rankColors = ['text-amber-500','text-slate-400','text-orange-400'];
                        const rowBg = decision === 'approved' ? 'bg-emerald-500/5' : decision === 'rejected' ? 'bg-rose-500/5' : '';
                        return (
                          <React.Fragment key={r.candidateId}>
                            <tr className={cn('border-b last:border-0 hover:bg-muted/20 transition-colors', isExpanded && 'bg-muted/10', rowBg)}>
                              <td className="px-4 py-3"><span className={cn('font-black text-sm', i < 3 ? rankColors[i] : 'text-muted-foreground')}>#{r.rank}</span></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <Avatar name={displayName} color="bg-[#0F1547]" size="sm" />
                                  <p className="text-sm font-semibold whitespace-nowrap">{displayName}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 min-w-[140px]"><ScoreBar score={r.matchScore} /></td>
                              <td className="px-4 py-3"><RecBadge rec={r.recommendation} /></td>
                              <td className="px-4 py-3 max-w-[150px]"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 block truncate">{r.topStrength}</span></td>
                              <td className="px-4 py-3 max-w-[150px]"><span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 block truncate">{r.keyGap}</span></td>
                              <td className="px-4 py-3 w-28">
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => saveDecision(r.candidateId, 'approved')} disabled={!!decisionLoading || finalized} title="Approve"
                                    className={cn('p-1.5 rounded-lg transition-all disabled:opacity-40', decision === 'approved' ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600')}>
                                    {decisionLoading === r.candidateId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                  </button>
                                  <button onClick={() => saveDecision(r.candidateId, 'rejected')} disabled={!!decisionLoading || finalized} title="Reject"
                                    className={cn('p-1.5 rounded-lg transition-all disabled:opacity-40', decision === 'rejected' ? 'bg-rose-500 text-white shadow-sm' : 'hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600')}>
                                    <ThumbsDown className="h-4 w-4" />
                                  </button>
                                </div>
                                {aiComments[r.candidateId] && <p className="text-[10px] text-muted-foreground mt-1 max-w-[110px] leading-tight line-clamp-2">{aiComments[r.candidateId]}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => setExpandedRow(isExpanded ? null : r.candidateId)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b bg-[#4B7BFF]/5">
                                <td colSpan={8} className="px-6 py-5">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">AI Reasoning</p>
                                        <p className="text-sm leading-relaxed">{r.reasoning || 'No reasoning provided.'}</p>
                                      </div>
                                      {aiComments[r.candidateId] && (
                                        <div className="p-3 rounded-lg bg-[#4B7BFF]/5 border border-[#4B7BFF]/20">
                                          <p className="text-[10px] font-bold text-[#4B7BFF] uppercase mb-1">AI on your decision</p>
                                          <p className="text-xs">{aiComments[r.candidateId]}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Strengths</p>
                                        <div className="flex flex-wrap gap-1.5">{r.strengths.length > 0 ? r.strengths.map((s) => <StrengthChip key={s} label={s} />) : <span className="text-xs text-muted-foreground">None listed</span>}</div>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Gaps</p>
                                        <div className="flex flex-wrap gap-1.5">{r.gaps.length > 0 ? r.gaps.map((g) => <GapChip key={g} label={g} />) : <span className="text-xs text-muted-foreground">None listed</span>}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 pt-3 border-t flex items-center gap-3 flex-wrap">
                                    <Button size="sm" variant="outline" onClick={() => sendMessage(`Tell me more about ${displayName} and why they ranked #${r.rank}`)}>
                                      <IntoreMark className="h-3.5 w-3.5 mr-1.5 text-[#4B7BFF]" /> Ask AI about this candidate
                                    </Button>
                                    {!finalized && (
                                      <div className="flex items-center gap-2 ml-auto">
                                        <button onClick={() => saveDecision(r.candidateId, 'approved')} disabled={!!decisionLoading} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', decision === 'approved' ? 'bg-emerald-500 text-white' : 'border hover:bg-emerald-500/10 hover:text-emerald-700')}>
                                          <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button onClick={() => saveDecision(r.candidateId, 'rejected')} disabled={!!decisionLoading} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', decision === 'rejected' ? 'bg-rose-500 text-white' : 'border hover:bg-rose-500/10 hover:text-rose-700')}>
                                          <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                        </button>
                                      </div>
                                    )}
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
          </div>

          {/* Right Panel — AI Chat */}
          <div className="w-full xl:w-[400px] shrink-0">
            <div className="bg-card rounded-xl shadow-sm border flex flex-col h-[calc(100vh-8rem)] sticky top-24">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 flex items-center justify-center"><IntoreMark className="h-4 w-4 text-[#4B7BFF]" /></div>
                  <div><h3 className="font-semibold text-sm">AI Recruiter Assistant</h3><p className="text-[10px] text-muted-foreground">Powered by Gemini</p></div>
                </div>
                {isUnlocked && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Live</span>}
              </div>
              {!isUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Lock className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="font-semibold text-sm">Run screening to unlock</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Once screening completes, ask Gemini anything about the candidates.</p>
                  <Button size="sm" onClick={runScreeningClick} disabled={status === 'running'}>{status === 'running' ? 'Screening...' : 'Start Screening'}</Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg) => <ChatBubble key={msg.id} role={msg.role} content={msg.content} />)}
                    {chatLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner size="sm" /> Gemini is thinking...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t space-y-3">
                    <SuggestionChips suggestions={SUGGESTIONS.slice(0, 4)} onSelect={(s) => sendMessage(s)} />
                    <div className="flex gap-2">
                      <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }} placeholder="Ask about candidates..." rows={2} className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
                      <Button size="icon" onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || chatLoading} className="self-end"><Send className="h-4 w-4" /></Button>
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
