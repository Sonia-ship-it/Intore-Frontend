import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Upload, FileText, Download, Check, Link2, Braces, RefreshCw, ChevronDown, ChevronUp, Send, Lock, AlertTriangle, ThumbsUp, ThumbsDown, BarChart2, Trophy, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { IntoreMark } from '@/components/branding/IntoreMark';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { apiUpload, apiFetch } from '@/lib/api';
import { candidatesFromRows, parseCsvFile, parseExcelFile, validateAgainstJsonSchema, type ColumnMapping } from '@/lib/ingestion';
import { useIngestionStore } from '@/stores/ingestionStore';
import { runScreeningAndWait, type ApiScreeningResult } from '@/lib/screeningApi';
import { ScoreBar } from '@/components/intore/ScoreBar';
import { StrengthChip, GapChip } from '@/components/intore/Chips';
import { Avatar } from '@/components/intore/Avatar';
import { Spinner } from '@/components/intore/Spinner';
import { ChatBubble } from '@/components/intore/ChatBubble';
import { SuggestionChips } from '@/components/intore/SuggestionChips';
import { BiasWarning } from '@/components/intore/BiasWarning';

type ScreeningStatus = 'idle' | 'running' | 'complete' | 'error' | 'finalized';
type UiResult = ApiScreeningResult & { confidence: 'High' | 'Medium' | 'Low' };
type ChatMsg = { id: string; role: 'user' | 'ai'; content: string };
type RecruiterDecision = 'approved' | 'rejected' | null;

// ── Confetti particle ─────────────────────────────────────────────────────────
function ConfettiExplosion({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ['#4B7BFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
    size: 6 + Math.random() * 8,
    duration: 1.5 + Math.random() * 1,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── PDF generator ─────────────────────────────────────────────────────────────
function generatePDF(results: UiResult[], decisions: Record<string, RecruiterDecision>, finalSummary: string, jobTitle: string) {
  const approved = results.filter((r) => decisions[r.applicationId || String(r.rank)] === 'approved');
  const rejected = results.filter((r) => decisions[r.applicationId || String(r.rank)] === 'rejected');
  const pending = results.filter((r) => !decisions[r.applicationId || String(r.rank)]);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Screening Report — ${jobTitle}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
  h1 { color: #0f172a; border-bottom: 3px solid #4B7BFF; padding-bottom: 12px; }
  h2 { color: #1e40af; margin-top: 32px; }
  .summary { background: #f0f9ff; border-left: 4px solid #4B7BFF; padding: 16px; border-radius: 4px; margin: 20px 0; }
  .candidate { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .approved { border-left: 4px solid #10b981; }
  .rejected { border-left: 4px solid #ef4444; }
  .pending { border-left: 4px solid #94a3b8; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-approved { background: #d1fae5; color: #065f46; }
  .badge-rejected { background: #fee2e2; color: #991b1b; }
  .badge-pending { background: #f1f5f9; color: #475569; }
  .score { font-size: 24px; font-weight: 800; color: #4B7BFF; }
  .meta { color: #64748b; font-size: 13px; margin: 4px 0; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
</style></head><body>
<h1>🎯 Final Screening Report</h1>
<p class="meta">Job: <strong>${jobTitle}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
<div class="summary">
  <strong>AI Summary</strong><br/><br/>
  ${finalSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}
</div>
<p><strong>Total screened:</strong> ${results.length} &nbsp;|&nbsp; 
   <strong style="color:#10b981">✓ Approved: ${approved.length}</strong> &nbsp;|&nbsp; 
   <strong style="color:#ef4444">✗ Rejected: ${rejected.length}</strong> &nbsp;|&nbsp; 
   <strong style="color:#94a3b8">⏳ Pending: ${pending.length}</strong></p>

<h2>✅ Approved Candidates (${approved.length})</h2>
${approved.map((r) => `
<div class="candidate approved">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div><strong style="font-size:16px">#${r.rank} ${r.name}</strong> <span class="badge badge-approved">Approved</span></div>
    <span class="score">${Math.round(r.score)}%</span>
  </div>
  <p class="meta">Recommendation: ${r.recommendation}</p>
  <p class="meta"><strong>Strengths:</strong> ${r.strengths.join(' · ')}</p>
  <p class="meta"><strong>Gaps:</strong> ${r.gaps.join(' · ')}</p>
  <p style="font-size:13px;color:#374151;margin-top:8px">${r.reason}</p>
</div>`).join('')}

<h2>❌ Rejected Candidates (${rejected.length})</h2>
${rejected.map((r) => `
<div class="candidate rejected">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div><strong style="font-size:16px">#${r.rank} ${r.name}</strong> <span class="badge badge-rejected">Rejected</span></div>
    <span class="score" style="color:#ef4444">${Math.round(r.score)}%</span>
  </div>
  <p class="meta"><strong>Key gaps:</strong> ${r.gaps.join(' · ')}</p>
</div>`).join('')}

${pending.length > 0 ? `<h2>⏳ Pending Review (${pending.length})</h2>
${pending.map((r) => `<div class="candidate pending"><strong>#${r.rank} ${r.name}</strong> — ${Math.round(r.score)}%</div>`).join('')}` : ''}

<div class="footer">Generated by Intore AI · Built for Rwanda's growing workforce · ${new Date().getFullYear()}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `screening-report-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

const SUGGESTIONS = ['Who is the best fit?', 'Compare top 3', 'What are the biggest gaps?', 'Who should I interview first?'];

const PROGRESS_STEPS = [
  { pct: 15, label: 'Loading candidate profiles...' },
  { pct: 30, label: 'Parsing resumes with AI...' },
  { pct: 50, label: 'Evaluating skills & experience...' },
  { pct: 70, label: 'Ranking candidates with Gemini...' },
  { pct: 88, label: 'Generating insights & recommendations...' },
];

function RecBadge({ rec }: { rec: string }) {
  const l = rec.toLowerCase();
  if (l.includes('shortlist')) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Shortlist</span>;
  if (l.includes('consider')) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Consider</span>;
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">Not Selected</span>;
}

// Converts a JSON response from Gemini into human-readable prose
function formatAiAnswer(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    return jsonToProse(parsed);
  } catch {
    return trimmed;
  }
}

function jsonToProse(obj: unknown): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return obj.map((item) => `- ${jsonToProse(item)}`).join('\n');
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 1) return jsonToProse(entries[0][1]);
    const r = obj as Record<string, unknown>;
    const parts: string[] = [];
    if (r.name) parts.push(`**${r.name}**`);
    if (r.score !== undefined) parts.push(`with a **${Math.round(Number(r.score))}% match score**`);
    if (r.recommendation) parts.push(`— **${r.recommendation}**`);
    if (r.reason || r.reasoning) parts.push(`\n\n${r.reason || r.reasoning}`);
    if (Array.isArray(r.strengths) && r.strengths.length)
      parts.push(`\n\n**Strengths:**\n${(r.strengths as string[]).map((s) => `- ${s}`).join('\n')}`);
    if (Array.isArray(r.gaps) && r.gaps.length)
      parts.push(`\n\n**Gaps:**\n${(r.gaps as string[]).map((g) => `- ${g}`).join('\n')}`);
    if (parts.length) return parts.join(' ');
    return entries.map(([k, v]) => `**${k.replace(/_/g, ' ')}:** ${jsonToProse(v)}`).join('\n');
  }
  return String(obj);
}

export default function BulkUpload() {
  const router = useRouter();
  const jobId = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { toast } = useToast();
  const { setCandidates, setUmuravaPayload, setResumeLinks, setPdfFilenames } = useIngestionStore();
  const ingestion = useIngestionStore((s) => (jobId ? s.byJobId[jobId] : undefined));

  // Upload state
  const [tab, setTab] = useState<'sheet' | 'pdf' | 'links' | 'umurava'>('sheet');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetFileName, setSheetFileName] = useState<string | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [sheetErrors, setSheetErrors] = useState<string[]>([]);
  const [isBackendUploading, setIsBackendUploading] = useState(false);
  const [ingested, setIngested] = useState(false);
  const [ingestedCount, setIngestedCount] = useState(0);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfFiles, setPdfFilesState] = useState<File[]>([]);
  const [linksText, setLinksText] = useState('');
  const schemaInputRef = useRef<HTMLInputElement | null>(null);
  const profilesInputRef = useRef<HTMLInputElement | null>(null);
  const [umuravaSchema, setUmuravaSchema] = useState<unknown | null>(null);
  const [umuravaProfiles, setUmuravaProfiles] = useState<unknown | null>(null);
  const [umuravaValidation, setUmuravaValidation] = useState<{ ok: boolean; errors?: string[] } | null>(null);

  // Screening state
  const [screeningStatus, setScreeningStatus] = useState<ScreeningStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [shortlistSize, setShortlistSize] = useState<10 | 20>(10);
  const [results, setResults] = useState<UiResult[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [biasWarningDismissed, setBiasWarningDismissed] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recruiter decisions — thumbs up/down per candidate
  const [decisions, setDecisions] = useState<Record<string, RecruiterDecision>>({});
  const [showCharts, setShowCharts] = useState(false);
  const [aiComments, setAiComments] = useState<Record<string, string>>({});
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalSummary, setFinalSummary] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const headers = useMemo(() => rows.length ? Object.keys(rows[0] || {}) : [], [rows]);
  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);
  const candidateCount = ingestion?.candidates?.length || ingestedCount;

  const ensureJob = () => {
    if (!jobId) { toast({ title: 'Missing job id', description: 'Open from a specific job.', variant: 'destructive' }); return false; }
    return true;
  };

  const guessMapping = (hdrs: string[]): ColumnMapping => {
    const lower = hdrs.map((h) => ({ h, l: h.toLowerCase().trim() }));
    const pick = (cands: string[]) => lower.find((x) => cands.includes(x.l))?.h;
    return {
      name: pick(['name', 'full name', 'candidate name']),
      email: pick(['email', 'email address']),
      phone: pick(['phone', 'phone number', 'mobile']),
      currentRole: pick(['current role', 'role', 'title', 'job title']),
      skills: pick(['skills', 'skill', 'tech stack', 'stack']),
      linkedin: pick(['linkedin', 'linkedin url']),
      portfolio: pick(['portfolio', 'portfolio url', 'github', 'github url']),
    };
  };

  const handleSheetFile = async (file: File) => {
    try {
      setSheetErrors([]); setRows([]); setMapping({});
      setSheetFileName(file.name); setSheetFile(file);
      const parsedRows = file.name.toLowerCase().endsWith('.csv') ? await parseCsvFile(file) : await parseExcelFile(file);
      setRows(parsedRows);
      setMapping(guessMapping(parsedRows.length ? Object.keys(parsedRows[0] || {}) : []));
      toast({ title: 'File loaded', description: `${parsedRows.length} row(s) detected.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to parse file';
      setSheetErrors([msg]);
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    }
  };

  const confirmSheetIngestion = () => {
    if (!ensureJob()) return;
    if (!rows.length) {
      toast({ title: 'No data to ingest', description: 'Upload a CSV/Excel first.', variant: 'destructive' });
      return;
    }

    const { candidates, errors } = candidatesFromRows(rows);
    setSheetErrors(errors);
    if (errors.length) {
      toast({ title: 'Some rows are invalid', description: `Fix data format. ${errors.length} issue(s).`, variant: 'destructive' });
      return;
    }

    const filename = sheetFileName || 'upload';
    const isCsv = filename.toLowerCase().endsWith('.csv');
    setCandidates(jobId!, candidates, {
      type: isCsv ? 'csv' : 'excel',
      filename,
      count: candidates.length,
    });
    toast({ title: 'Candidates ingested successfully!', description: `${candidates.length} candidate(s) saved for this job.` });
    
    // Redirect back to job detail page to show AI screening button
    setTimeout(() => {
      router.push(`/recruiter/jobs/${jobId}`);
    }, 1500);
  };

  const uploadSheetToBackend = async () => {
    if (!ensureJob() || !sheetFile) { toast({ title: 'No file', description: 'Upload a file first.', variant: 'destructive' }); return; }
    setIsBackendUploading(true);
    try {
      const form = new FormData();
      form.append('jobId', jobId!);
      form.append('file', sheetFile, sheetFile.name);
      const resp = await apiUpload<{ acceptedRows?: number; rejectedRows?: number; message?: string }>('/ingestion/csv', form);
      toast({ title: 'Uploaded!', description: typeof resp?.acceptedRows === 'number' ? `Accepted ${resp.acceptedRows}, rejected ${resp.rejectedRows ?? 0}` : resp?.message || 'Done.' });
      setIngested(true); setIngestedCount(resp?.acceptedRows ?? rows.length);
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally { setIsBackendUploading(false); }
  };

  const confirmLinks = () => {
    if (!ensureJob()) return;
    const links = linksText.split(/\r?\n/g).map((l) => l.trim()).filter(Boolean);
    if (!links.length) { toast({ title: 'No links', description: 'Paste one URL per line.', variant: 'destructive' }); return; }
    setResumeLinks(jobId!, links);
    toast({ title: 'Links saved', description: `${links.length} link(s) ready.` });
    setIngested(true); setIngestedCount(links.length);
  };

  const confirmPdfs = () => {
    if (!ensureJob() || !pdfFiles.length) { toast({ title: 'No PDFs', description: 'Select PDFs first.', variant: 'destructive' }); return; }
    setPdfFilenames(jobId!, pdfFiles.map((f) => f.name));
    toast({ title: 'PDFs attached', description: `${pdfFiles.length} PDF(s) ready.` });
    setIngested(true); setIngestedCount(pdfFiles.length);
  };

  const confirmUmurava = async () => {
    if (!ensureJob() || !umuravaSchema || !umuravaProfiles) { toast({ title: 'Missing files', description: 'Upload both JSON files.', variant: 'destructive' }); return; }
    const res = validateAgainstJsonSchema(umuravaSchema, umuravaProfiles);
    setUmuravaValidation(res.ok ? { ok: true } : { ok: false, errors: ['Schema validation failed'] });
    if (!res.ok) { toast({ title: 'Validation failed', variant: 'destructive' }); return; }
    try {
      const payloadProfiles = Array.isArray(umuravaProfiles) ? umuravaProfiles : [];
      const resp = await apiFetch<{ acceptedRows?: number; rejectedRows?: number }>('/ingestion/umurava', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId, profiles: payloadProfiles }) });
      setUmuravaPayload(jobId!, umuravaSchema, umuravaProfiles);
      toast({ title: 'Umurava ingested', description: `Accepted ${resp.acceptedRows ?? 0}.` });
      setIngested(true); setIngestedCount(resp.acceptedRows ?? 0);
    } catch (err) { toast({ title: 'Umurava failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }); }
  };

  const readJsonFile = async (file: File): Promise<unknown> => JSON.parse(await file.text());

  // ── Load saved snapshot on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!jobId || results.length > 0) return;
    apiFetch<any>(`/screening/snapshot/${jobId}`)
      .then((snap) => {
        if (!snap || !snap.results?.length) return;
        const uiResults: UiResult[] = snap.results.map((r: any) => ({ ...r, confidence: r.score >= 75 ? 'High' : r.score >= 50 ? 'Medium' : 'Low' }));
        setResults(uiResults);
        setScreeningStatus(snap.finalized ? 'finalized' : 'complete');
        setChatUnlocked(true);
        if (snap.decisions) setDecisions(snap.decisions as Record<string, RecruiterDecision>);
        if (snap.finalized) { setFinalized(true); setFinalSummary(snap.finalSummary || ''); }
      })
      .catch(() => {});
  }, [jobId]);

  // ── Save a decision to backend + get AI comment ───────────────────────────
  const saveDecision = useCallback(async (key: string, decision: RecruiterDecision) => {
    if (!jobId) return;
    const newDecision = decisions[key] === decision ? null : decision;
    setDecisions((prev) => ({ ...prev, [key]: newDecision }));
    if (!newDecision) return;
    setDecisionLoading(key);
    try {
      const resp = await apiFetch<{ ok: boolean; aiComment?: string }>('/screening/decision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, applicationId: key, decision: newDecision }),
      });
      if (resp.aiComment) {
        setAiComments((prev) => ({ ...prev, [key]: resp.aiComment! }));
        // Also add to chat
        setChatMessages((prev) => [...prev, { id: `ai-dec-${Date.now()}`, role: 'ai', content: resp.aiComment! }]);
      }
    } catch { /* silent */ } finally {
      setDecisionLoading(null);
    }
  }, [jobId, decisions]);

  // ── Finalize screening ────────────────────────────────────────────────────
  const finalizeScreening = async () => {
    if (!jobId) return;
    setFinalizing(true);
    try {
      const resp = await apiFetch<{ ok: boolean; finalSummary: string; approved: number; rejected: number }>('/screening/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setFinalized(true);
      setScreeningStatus('finalized');
      setFinalSummary(resp.finalSummary);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      setChatMessages((prev) => [...prev, {
        id: `final-${Date.now()}`, role: 'ai',
        content: `🎉 **Screening finalized!**\n\n${resp.finalSummary}\n\n**${resp.approved} approved**, ${resp.rejected} rejected. The full report is ready to download.`
      }]);
      toast({ title: '🎉 Screening finalized!', description: `${resp.approved} candidates approved.` });
    } catch (err) {
      toast({ title: 'Finalization failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setFinalizing(false);
    }
  };

  const downloadXLSX = () => {
    if (!results.length) return;
    const rows = results.map((r) => ({
      Rank: r.rank,
      Name: r.name,
      'Match Score (%)': Math.round(r.score),
      Confidence: r.confidence,
      Recommendation: r.recommendation,
      'Top Strength': r.strengths?.[0] || '—',
      'Key Gap': r.gaps?.[0] || '—',
      'All Strengths': r.strengths.join(', '),
      'All Gaps': r.gaps.join(', '),
      'AI Reasoning': r.reason,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const colWidths = Object.keys(rows[0]).map((k) => ({ wch: Math.max(k.length, 18) }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shortlist');
    XLSX.writeFile(wb, `screening-shortlist.xlsx`);
  };

  // ── Screening ──────────────────────────────────────────────────────────────
  const startProgressAnimation = () => {
    let i = 0;
    setProgress(PROGRESS_STEPS[0].pct); setProgressLabel(PROGRESS_STEPS[0].label);
    progressTimer.current = setInterval(() => {
      i++;
      if (i < PROGRESS_STEPS.length) { setProgress(PROGRESS_STEPS[i].pct); setProgressLabel(PROGRESS_STEPS[i].label); }
      else { if (progressTimer.current) clearInterval(progressTimer.current); }
    }, 1800);
  };

  const stopProgressAnimation = () => { if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; } };

  const runScreening = async () => {
    if (!jobId) return;
    if (candidateCount === 0) { toast({ title: 'No candidates', description: 'Ingest candidates first using the upload panel.', variant: 'destructive' }); return; }
    setScreeningStatus('running'); setBiasWarningDismissed(false); startProgressAnimation();
    try {
      const { results: apiResults } = await runScreeningAndWait({ jobId, topK: shortlistSize });
      stopProgressAnimation(); setProgress(100); setProgressLabel('Screening complete');
      const uiResults: UiResult[] = apiResults.slice(0, shortlistSize).map((r) => ({ ...r, confidence: r.score >= 75 ? 'High' : r.score >= 50 ? 'Medium' : 'Low' }));
      setResults(uiResults); setScreeningStatus('complete'); setChatUnlocked(true);
      setChatMessages([{ id: 'intro', role: 'ai', content: `Screening complete. I ranked **${uiResults.length} candidates**.\n\n🏆 Top pick: **${uiResults[0]?.name || 'Candidate #1'}** with a ${uiResults[0]?.score}% match score.\n\nAsk me anything about the results.` }]);
      toast({ title: 'Screening complete', description: `Top ${uiResults.length} candidates ranked by Gemini.` });
    } catch (e) {
      stopProgressAnimation(); setProgress(0); setProgressLabel(''); setScreeningStatus('error');
      toast({ title: 'Screening failed', description: e instanceof Error ? e.message : 'Check backend and try again.', variant: 'destructive' });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    setChatMessages((prev) => [...prev, { id: `u${Date.now()}`, role: 'user', content: text }]);
    setChatInput(''); setChatLoading(true);
    try {
      const resp = await apiFetch<{ answer: string }>('/screening/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId, question: text }) });
      const raw = resp.answer || 'No answer available.';
      // Safety net: if Gemini still returns JSON, convert it to readable prose
      const answer = formatAiAnswer(raw);
      setChatMessages((prev) => [...prev, { id: `a${Date.now()}`, role: 'ai', content: answer }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { id: `e${Date.now()}`, role: 'ai', content: err instanceof Error ? err.message : 'Unable to answer.' }]);
    } finally { setChatLoading(false); }
  };

  return (
    <>
      <ConfettiExplosion active={showConfetti} />
      <AppHeader title="Upload & Screen" />
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── LEFT: Upload panel ── */}
          <div className="xl:w-[520px] shrink-0 space-y-5">
            {/* Ingestion status */}
            {ingested && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{candidateCount} candidate{candidateCount !== 1 ? 's' : ''} ready</p>
                  <p className="text-xs text-emerald-600/70">Use the screening panel on the right to run AI analysis.</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b">
              {(['sheet', 'pdf', 'links', 'umurava'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors', tab === t ? 'border-[#4B7BFF] text-[#4B7BFF]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  {t === 'sheet' ? 'CSV / Excel' : t === 'pdf' ? 'PDFs' : t === 'links' ? 'Links' : 'Umurava'}
                </button>
              ))}
            </div>

            {/* CSV/Excel tab */}
            {tab === 'sheet' && (
              <div className="space-y-4">
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={async (e) => { const input = e.currentTarget; const f = input.files?.[0]; if (f) await handleSheetFile(f); if (input) input.value = ''; }} />
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-[#4B7BFF] hover:bg-[#4B7BFF]/5 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload CSV or Excel</p>
                  <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx supported</p>
                  {sheetFileName && <p className="text-xs mt-2 text-[#4B7BFF] font-medium">{sheetFileName}</p>}
                </div>
                {rows.length > 0 && (
                  <div className="bg-card rounded-xl p-4 border space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-semibold text-green-700">File Loaded Successfully</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total Candidates:</span>
                        <span className="text-sm font-semibold">{rows.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Columns Detected:</span>
                        <span className="text-sm font-semibold">{headers.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Automatic Mapping:</span>
                        <span className="text-sm font-semibold text-green-600">Complete</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Automatic column mapping completed!</strong> The system has automatically detected and mapped your columns. No manual configuration needed.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={uploadSheetToBackend} 
                        disabled={isBackendUploading}
                        className="flex-1"
                        size="sm"
                      >
                        {isBackendUploading ? 'Uploading...' : 'Upload to System'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={confirmSheetIngestion}
                        className="flex-1"
                        size="sm"
                      >
                        Confirm Ingest
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PDFs tab */}
            {tab === 'pdf' && (
              <div className="space-y-4">
                <input ref={pdfInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => { setPdfFilesState(Array.from(e.target.files || [])); e.currentTarget.value = ''; }} />
                <div onClick={() => pdfInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-[#4B7BFF] hover:bg-[#4B7BFF]/5 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Select PDF resumes</p>
                  <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
                </div>
                {pdfFiles.length > 0 && (
                  <div className="space-y-2">
                    {pdfFiles.map((f) => <div key={f.name} className="flex items-center gap-3 bg-card rounded-lg p-3 border"><FileText className="h-4 w-4 text-muted-foreground" /><p className="text-sm flex-1 truncate">{f.name}</p><Check className="h-4 w-4 text-emerald-500" /></div>)}
                    <Button size="sm" onClick={confirmPdfs}>Attach PDFs to Job</Button>
                  </div>
                )}
              </div>
            )}

            {/* Links tab */}
            {tab === 'links' && (
              <div className="bg-card rounded-xl p-4 border space-y-3">
                <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">Resume Links</p></div>
                <p className="text-xs text-muted-foreground">One URL per line (PDF, LinkedIn, Drive, etc.)</p>
                <textarea value={linksText} onChange={(e) => setLinksText(e.target.value)} rows={6} placeholder="https://..." className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-[#4B7BFF]/20" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{linksText.split(/\r?\n/g).filter((l) => l.trim()).length} link(s)</p>
                  <Button size="sm" onClick={confirmLinks}>Save Links</Button>
                </div>
              </div>
            )}

            {/* Umurava tab */}
            {tab === 'umurava' && (
              <div className="bg-card rounded-xl p-4 border space-y-4">
                <input ref={schemaInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setUmuravaSchema(await readJsonFile(f)); toast({ title: 'Schema loaded' }); } catch { toast({ title: 'Invalid JSON', variant: 'destructive' }); } e.currentTarget.value = ''; }} />
                <input ref={profilesInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setUmuravaProfiles(await readJsonFile(f)); toast({ title: 'Profiles loaded' }); } catch { toast({ title: 'Invalid JSON', variant: 'destructive' }); } e.currentTarget.value = ''; }} />
                <div className="flex items-center gap-2"><Braces className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">Umurava Schema</p></div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => schemaInputRef.current?.click()}>Upload schema.json</Button>
                  <Button variant="outline" size="sm" onClick={() => profilesInputRef.current?.click()}>Upload profiles.json</Button>
                  <Button size="sm" onClick={confirmUmurava} disabled={!umuravaSchema || !umuravaProfiles}>Validate & Save</Button>
                </div>
                <div className="text-xs text-muted-foreground">Schema: {umuravaSchema ? '✓ loaded' : 'not loaded'} · Profiles: {umuravaProfiles ? '✓ loaded' : 'not loaded'}</div>
                {umuravaValidation && (
                  <div className={cn('rounded-lg p-2 text-xs', umuravaValidation.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-destructive/5 text-destructive')}>
                    {umuravaValidation.ok ? 'Validation passed ✅' : 'Validation failed'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Screening + Chat ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Screening control card */}
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-base">AI Screening</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {candidateCount > 0 ? `${candidateCount} candidate${candidateCount !== 1 ? 's' : ''} ready to screen` : 'Upload candidates on the left to begin'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={shortlistSize} onChange={(e) => setShortlistSize(Number(e.target.value) as 10 | 20)} className="bg-background rounded-lg border px-3 py-2 text-sm outline-none">
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                  <Button onClick={runScreening} disabled={screeningStatus === 'running' || candidateCount === 0} className={cn(screeningStatus === 'running' && 'opacity-70')}>
                    {screeningStatus === 'running' ? <><Spinner size="sm" className="mr-2" />Screening...</> : screeningStatus === 'complete' ? <><RefreshCw className="h-4 w-4 mr-2" />Re-run</> : <><IntoreMark className="h-4 w-4 mr-2 text-[#4B7BFF]" />Screen Candidates</>}
                  </Button>
                </div>
              </div>

              {/* Progress */}
              {screeningStatus === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{progressLabel}</span><span>{progress}%</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-[#4B7BFF] transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {/* Error */}
              {screeningStatus === 'error' && (
                <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div><p className="text-sm font-semibold">Screening failed</p><p className="text-xs text-muted-foreground mt-0.5">Check backend connectivity and try again.</p></div>
                  <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={runScreening}>Retry</Button>
                </div>
              )}
            </div>

            {/* Bias warning */}
            {screeningStatus === 'complete' && !biasWarningDismissed && (
              <BiasWarning message="Ranking may favour candidates with formal degrees. Consider reviewing candidates with strong project portfolios." onDismiss={() => setBiasWarningDismissed(true)} />
            )}

            {/* Results */}
            {screeningStatus === 'complete' && results.length > 0 && (() => {
              const approved = Object.values(decisions).filter(d => d === 'approved').length;
              const rejected = Object.values(decisions).filter(d => d === 'rejected').length;
              const pending = results.length - approved - rejected;
              const verdictData = [
                { name: 'Shortlist', value: results.filter(r => r.recommendation.toLowerCase().includes('shortlist')).length, color: '#10b981' },
                { name: 'Consider', value: results.filter(r => r.recommendation.toLowerCase().includes('consider')).length, color: '#f59e0b' },
                { name: 'Not Selected', value: results.filter(r => !r.recommendation.toLowerCase().includes('shortlist') && !r.recommendation.toLowerCase().includes('consider')).length, color: '#ef4444' },
              ].filter(d => d.value > 0);
              const decisionData = [
                { name: 'Approved', value: approved, color: '#10b981' },
                { name: 'Rejected', value: rejected, color: '#ef4444' },
                { name: 'Pending', value: pending, color: '#94a3b8' },
              ].filter(d => d.value > 0);
              const scoreData = results.map(r => ({ name: r.name.split(' ')[0], score: Math.round(r.score) }));

              return (
                <div className="space-y-5">
                  {/* Header */}
                  <div className="bg-card rounded-xl border shadow-sm">
                    <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-bold text-base">Ranked Candidates</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{results.length} candidates · Powered by Gemini · Your final decision matters</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setShowCharts(!showCharts)} className="gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5" /> {showCharts ? 'Hide' : 'Show'} Charts
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setResults([]); setScreeningStatus('idle'); setDecisions({}); }} className="gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5" /> Re-screen
                        </Button>
                        <Button size="sm" onClick={downloadXLSX} className="gap-1.5">
                          <Download className="h-3.5 w-3.5" /> Download XLSX
                        </Button>
                      </div>
                    </div>

                    {/* Decision summary pills */}
                    <div className="px-6 py-3 flex items-center gap-4 flex-wrap border-b bg-muted/5">
                      <span className="text-xs text-muted-foreground font-medium">Your decisions:</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><ThumbsUp className="h-3.5 w-3.5" /> {approved} Approved</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><ThumbsDown className="h-3.5 w-3.5" /> {rejected} Rejected</span>
                      <span className="text-xs text-muted-foreground">{pending} pending review</span>
                      {!finalized && pending === 0 && results.length > 0 && (
                        <button onClick={finalizeScreening} disabled={finalizing}
                          className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60">
                          {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                          {finalizing ? 'Finalizing...' : 'Finalize & Generate Report'}
                        </button>
                      )}
                      {finalized && (
                        <div className="ml-auto flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Finalized
                          </span>
                          <button onClick={() => generatePDF(results, decisions, finalSummary, 'Screening')}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4B7BFF] text-white text-xs font-bold hover:bg-[#3461DF] transition-colors">
                            <FileDown className="h-3.5 w-3.5" /> Download Report
                          </button>
                        </div>
                      )}
                      {!finalized && pending > 0 && (
                        <span className="ml-auto text-[10px] text-muted-foreground italic">Review all {pending} remaining candidates to finalize</span>
                      )}
                    </div>

                    {/* Charts */}
                    {showCharts && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b">
                        {/* Pie: AI Verdicts */}
                        <div className="p-5 border-r">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">AI Verdicts</p>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={verdictData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                {verdictData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {verdictData.map(d => <span key={d.name} className="flex items-center gap-1 text-[10px]"><span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />{d.name} ({d.value})</span>)}
                          </div>
                        </div>
                        {/* Pie: Your Decisions */}
                        <div className="p-5 border-r">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Your Decisions</p>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={decisionData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                {decisionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {decisionData.map(d => <span key={d.name} className="flex items-center gap-1 text-[10px]"><span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />{d.name} ({d.value})</span>)}
                          </div>
                        </div>
                        {/* Bar: Score distribution */}
                        <div className="p-5">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Match Scores</p>
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                {scoreData.map((entry, i) => <Cell key={i} fill={entry.score >= 70 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="border-b bg-muted/10 text-left">
                            {['Rank', 'Candidate', 'Match Score', 'AI Verdict', 'Top Strength', 'Key Gap', 'Your Decision', ''].map((h) => (
                              <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r, i) => {
                            const key = r.applicationId || String(r.rank);
                            const isExp = expandedRow === key;
                            const decision = decisions[key] || null;
                            const rankColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-muted-foreground';
                            const rowBg = decision === 'approved' ? 'bg-emerald-500/5' : decision === 'rejected' ? 'bg-rose-500/5' : '';
                            return (
                              <>
                                <tr key={key} className={cn('border-b hover:bg-muted/20 transition-colors', isExp && 'bg-muted/10', rowBg)}>
                                  <td className="px-4 py-3.5 w-14">
                                    <span className={cn('font-black text-sm', rankColor)}>#{r.rank}</span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <Avatar name={r.name} color="bg-[#0F1547]" size="sm" />
                                      <p className="text-sm font-semibold whitespace-nowrap">{r.name}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 w-40"><ScoreBar score={Math.round(r.score)} /></td>
                                  <td className="px-4 py-3.5 w-28"><RecBadge rec={r.recommendation} /></td>
                                  <td className="px-4 py-3.5 max-w-[160px]">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 block truncate">{r.strengths?.[0] || '—'}</span>
                                  </td>
                                  <td className="px-4 py-3.5 max-w-[160px]">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 block truncate">{r.gaps?.[0] || '—'}</span>
                                  </td>
                                  <td className="px-4 py-3.5 w-32">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => saveDecision(key, 'approved')}
                                        disabled={!!decisionLoading || finalized}
                                        className={cn('p-1.5 rounded-lg transition-all', decision === 'approved' ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600', 'disabled:opacity-40')}
                                        title="Approve"
                                      >
                                        {decisionLoading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                      </button>
                                      <button
                                        onClick={() => saveDecision(key, 'rejected')}
                                        disabled={!!decisionLoading || finalized}
                                        className={cn('p-1.5 rounded-lg transition-all', decision === 'rejected' ? 'bg-rose-500 text-white shadow-sm' : 'hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600', 'disabled:opacity-40')}
                                        title="Reject"
                                      >
                                        <ThumbsDown className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {/* AI comment on decision */}
                                    {aiComments[key] && (
                                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[120px] leading-tight">{aiComments[key].slice(0, 60)}…</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 w-10">
                                    <button onClick={() => setExpandedRow(isExp ? null : key)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                      {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                  </td>
                                </tr>
                                {isExp && (
                                  <tr key={`${key}-exp`} className="border-b bg-[#4B7BFF]/5">
                                    <td colSpan={8} className="px-6 py-5">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">AI Reasoning</p>
                                          <p className="text-sm leading-relaxed">{r.reason}</p>
                                          {aiComments[key] && (
                                            <div className="mt-3 p-3 rounded-lg bg-[#4B7BFF]/5 border border-[#4B7BFF]/20">
                                              <p className="text-[10px] font-bold text-[#4B7BFF] uppercase mb-1">AI on your decision</p>
                                              <p className="text-xs text-slate-700 dark:text-white/80">{aiComments[key]}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Strengths</p>
                                          <div className="flex flex-wrap gap-1.5">{r.strengths.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-medium">{s}</span>)}</div>
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Gaps</p>
                                          <div className="flex flex-wrap gap-1.5">{r.gaps.map((g) => <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 font-medium">{g}</span>)}</div>
                                        </div>
                                      </div>
                                      <div className="mt-4 pt-3 border-t flex items-center gap-3 flex-wrap">
                                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => sendMessage(`Tell me more about ${r.name} and why they ranked #${r.rank}`)}>
                                          <IntoreMark className="h-3.5 w-3.5 text-[#4B7BFF]" /> Ask AI about this candidate
                                        </Button>
                                        {!finalized && (
                                          <div className="flex items-center gap-2 ml-auto">
                                            <span className="text-xs text-muted-foreground">Your decision:</span>
                                            <button onClick={() => saveDecision(key, 'approved')} disabled={!!decisionLoading} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', decisions[key] === 'approved' ? 'bg-emerald-500 text-white' : 'border hover:bg-emerald-500/10 hover:text-emerald-700')}>
                                              <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                            </button>
                                            <button onClick={() => saveDecision(key, 'rejected')} disabled={!!decisionLoading} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', decisions[key] === 'rejected' ? 'bg-rose-500 text-white' : 'border hover:bg-rose-500/10 hover:text-rose-700')}>
                                              <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI Chat */}
            <div className="bg-card rounded-xl border flex flex-col" style={{ minHeight: 480 }}>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center"><IntoreMark className="h-4 w-4 text-[#4B7BFF]" /></div>
                  <div>
                    <p className="font-semibold text-sm">Intore Assistant</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full', chatUnlocked ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300')} />
                      <p className="text-[10px] text-muted-foreground">{chatUnlocked ? 'Live · Powered by Gemini' : 'Locked until screening runs'}</p>
                    </div>
                  </div>
                </div>
              </div>
              {!chatUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Lock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="font-semibold text-sm">Run screening to unlock</p>
                  <p className="text-xs text-muted-foreground">Once screening completes, ask Gemini anything about the candidates.</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 280, maxHeight: 420 }}>
                    {chatMessages.map((msg) => <ChatBubble key={msg.id} role={msg.role} content={msg.content} />)}
                    {chatLoading && (
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-md bg-[#4B7BFF]/10 border border-[#4B7BFF]/20 flex items-center justify-center shrink-0 mt-1">
                          <IntoreMark className="w-3.5 h-3.5 text-[#4B7BFF]" />
                        </div>
                        <div className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4B7BFF] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t space-y-3 bg-muted/20">
                    <SuggestionChips suggestions={SUGGESTIONS} onSelect={(s) => sendMessage(s)} />
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                        placeholder="Ask anything about the candidates, rankings, or gaps... (Enter to send)"
                        rows={2}
                        className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                      />
                      <Button size="icon" onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || chatLoading} className="shrink-0 h-10 w-10">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Shift+Enter for new line · Powered by Gemini 1.5 Pro</p>
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

