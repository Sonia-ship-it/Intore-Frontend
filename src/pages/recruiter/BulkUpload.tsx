import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Upload, FileText, Download, Check, Link2, Braces, Bot, RefreshCw, ChevronDown, ChevronUp, Send, Lock, AlertTriangle } from 'lucide-react';
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

type ScreeningStatus = 'idle' | 'running' | 'complete' | 'error';
type UiResult = ApiScreeningResult & { confidence: 'High' | 'Medium' | 'Low' };
type ChatMsg = { id: string; role: 'user' | 'ai'; content: string };

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
    if (!ensureJob() || !rows.length) { toast({ title: 'No data', description: 'Upload a file first.', variant: 'destructive' }); return; }
    const { candidates, errors } = candidatesFromRows(rows, mapping);
    setSheetErrors(errors);
    if (errors.length) { toast({ title: 'Mapping issues', description: `${errors.length} issue(s) found.`, variant: 'destructive' }); return; }
    const isCsv = (sheetFileName || '').toLowerCase().endsWith('.csv');
    setCandidates(jobId!, candidates, { type: isCsv ? 'csv' : 'excel', filename: sheetFileName || 'upload', count: candidates.length });
    toast({ title: 'Candidates ingested', description: `${candidates.length} candidate(s) ready.` });
    setIngested(true); setIngestedCount(candidates.length);
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
      setChatMessages((prev) => [...prev, { id: `a${Date.now()}`, role: 'ai', content: resp.answer || 'No answer available.' }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { id: `e${Date.now()}`, role: 'ai', content: err instanceof Error ? err.message : 'Unable to answer.' }]);
    } finally { setChatLoading(false); }
  };

  return (
    <>
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
                    <p className="text-sm font-semibold">Column Mapping</p>
                    {(['name', 'email', 'phone', 'currentRole', 'skills', 'linkedin', 'portfolio'] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs w-24 text-muted-foreground capitalize">{key}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <select value={(mapping as Record<string, string | undefined>)[key] || ''} onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))} className="flex-1 bg-background rounded-lg border px-2 py-1 text-xs outline-none">
                          <option value="">(not mapped)</option>
                          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                    {sheetErrors.length > 0 && <div className="text-xs text-destructive bg-destructive/5 rounded-lg p-2">{sheetErrors.slice(0, 3).join(' · ')}</div>}
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-xs"><thead><tr className="border-b">{headers.slice(0, 6).map((h) => <th key={h} className="px-2 py-1 text-left text-muted-foreground">{h}</th>)}</tr></thead>
                        <tbody>{previewRows.map((r, i) => <tr key={i} className="border-b">{headers.slice(0, 6).map((h) => <td key={h} className="px-2 py-1 whitespace-nowrap">{String((r as Record<string, unknown>)[h] ?? '')}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">{rows.length} total row(s)</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={uploadSheetToBackend} disabled={isBackendUploading}>{isBackendUploading ? 'Uploading...' : 'Send to Backend'}</Button>
                      <Button size="sm" onClick={confirmSheetIngestion}>Confirm Ingest</Button>
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
                    {screeningStatus === 'running' ? <><Spinner size="sm" className="mr-2" />Screening...</> : screeningStatus === 'complete' ? <><RefreshCw className="h-4 w-4 mr-2" />Re-run</> : <><Bot className="h-4 w-4 mr-2" />Screen Candidates</>}
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
            {screeningStatus === 'complete' && results.length > 0 && (
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="px-5 py-3.5 border-b flex items-center justify-between">
                  <div><p className="font-semibold text-sm">Ranked Candidates</p><p className="text-xs text-muted-foreground">{results.length} candidates · Gemini</p></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/30 text-left">{['Rank', 'Candidate', 'Score', 'Verdict', 'Strength', 'Gap', ''].map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
                    <tbody>
                      {results.map((r, i) => {
                        const isExpanded = expandedRow === r.applicationId;
                        return (
                          <>
                            <tr key={r.applicationId} className={cn('border-b hover:bg-muted/30 transition-colors', isExpanded && 'bg-muted/20')}>
                              <td className="px-4 py-3"><span className={cn('font-black text-sm', i < 3 ? 'text-[#4B7BFF]' : 'text-muted-foreground')}>#{r.rank}</span></td>
                              <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={r.name} color="bg-[#0F1547]" size="sm" /><p className="text-sm font-semibold">{r.name}</p></div></td>
                              <td className="px-4 py-3 min-w-[120px]"><ScoreBar score={Math.round(r.score)} /></td>
                              <td className="px-4 py-3"><RecBadge rec={r.recommendation} /></td>
                              <td className="px-4 py-3"><StrengthChip label={r.strengths?.[0] || '—'} /></td>
                              <td className="px-4 py-3"><GapChip label={r.gaps?.[0] || '—'} /></td>
                              <td className="px-4 py-3"><button onClick={() => setExpandedRow(isExpanded ? null : (r.applicationId || String(r.rank)))} className="p-1 rounded hover:bg-muted">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${r.applicationId}-exp`} className="border-b bg-muted/10">
                                <td colSpan={7} className="px-6 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">AI Reasoning</p><p className="text-sm">{r.reason}</p></div>
                                    <div className="space-y-2">
                                      <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Strengths</p><div className="flex flex-wrap gap-1">{r.strengths.map((s) => <StrengthChip key={s} label={s} />)}</div></div>
                                      <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Gaps</p><div className="flex flex-wrap gap-1">{r.gaps.map((g) => <GapChip key={g} label={g} />)}</div></div>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => sendMessage(`Tell me more about ${r.name} and why they ranked #${r.rank}`)}>
                                    <Bot className="h-3.5 w-3.5" /> Ask AI about this candidate
                                  </Button>
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
            )}

            {/* AI Chat */}
            <div className="bg-card rounded-xl border flex flex-col" style={{ minHeight: 320 }}>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4B7BFF]/10 flex items-center justify-center"><Bot className="h-4 w-4 text-[#4B7BFF]" /></div>
                  <div><p className="font-semibold text-sm">AI Recruiter Assistant</p><p className="text-[10px] text-muted-foreground">Powered by Gemini</p></div>
                </div>
                {chatUnlocked && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Live</span>}
              </div>
              {!chatUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Lock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="font-semibold text-sm">Run screening to unlock</p>
                  <p className="text-xs text-muted-foreground">Once screening completes, ask Gemini anything about the candidates.</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
                    {chatMessages.map((msg) => <ChatBubble key={msg.id} role={msg.role} content={msg.content} />)}
                    {chatLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner size="sm" /> Gemini is thinking...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t space-y-2">
                    <SuggestionChips suggestions={SUGGESTIONS} onSelect={(s) => sendMessage(s)} />
                    <div className="flex gap-2">
                      <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(chatInput); } }} placeholder="Ask about candidates..." className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20" />
                      <Button size="icon" onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || chatLoading}><Send className="h-4 w-4" /></Button>
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
