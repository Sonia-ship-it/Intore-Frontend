import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, FileText, Download, Check, AlertCircle, Link2, Braces } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { apiUpload } from '@/lib/api';
import { apiFetch } from '@/lib/api';
import {
  candidatesFromRows,
  parseCsvFile,
  parseExcelFile,
  validateAgainstJsonSchema,
  type ColumnMapping,
} from '@/lib/ingestion';
import { useIngestionStore } from '@/stores/ingestionStore';

export default function BulkUpload() {
  const router = useRouter();
  const jobId = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { toast } = useToast();
  const { setCandidates, setUmuravaPayload, setResumeLinks, setPdfFilenames } = useIngestionStore();

  const [tab, setTab] = useState<'sheet' | 'pdf' | 'links' | 'umurava'>('sheet');

  // CSV/Excel parsing state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetFileName, setSheetFileName] = useState<string | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [sheetErrors, setSheetErrors] = useState<string[]>([]);
  const [isBackendUploading, setIsBackendUploading] = useState(false);

  // PDFs
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfFiles, setPdfFilesState] = useState<File[]>([]);

  // Resume links
  const [linksText, setLinksText] = useState('');

  // Umurava schema + profiles
  const schemaInputRef = useRef<HTMLInputElement | null>(null);
  const profilesInputRef = useRef<HTMLInputElement | null>(null);
  const [umuravaSchema, setUmuravaSchema] = useState<unknown | null>(null);
  const [umuravaProfiles, setUmuravaProfiles] = useState<unknown | null>(null);
  const [umuravaValidation, setUmuravaValidation] = useState<{ ok: boolean; errors?: string[] } | null>(null);

  const headers = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0] || {});
  }, [rows]);

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const ensureJob = () => {
    if (!jobId) {
      toast({
        title: 'Missing job id',
        description: 'Open this page from a specific job (e.g. Jobs → View → Upload).',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const guessMapping = (hdrs: string[]): ColumnMapping => {
    const find = (cands: string[]) => hdrs.find((h) => cands.includes(h.toLowerCase().trim()));
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
      setSheetErrors([]);
      setRows([]);
      setMapping({});
      setSheetFileName(file.name);
      setSheetFile(file);

      const ext = file.name.toLowerCase();
      const parsedRows =
        ext.endsWith('.csv') ? await parseCsvFile(file) : await parseExcelFile(file);
      setRows(parsedRows);
      const hdrs = parsedRows.length ? Object.keys(parsedRows[0] || {}) : [];
      setMapping(guessMapping(hdrs));

      toast({
        title: 'File loaded',
        description: `${parsedRows.length} row(s) detected.`,
      });
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

    const { candidates, errors } = candidatesFromRows(rows, mapping);
    setSheetErrors(errors);
    if (errors.length) {
      toast({ title: 'Some rows are invalid', description: `Fix mapping or data. ${errors.length} issue(s).`, variant: 'destructive' });
      return;
    }

    const filename = sheetFileName || 'upload';
    const isCsv = filename.toLowerCase().endsWith('.csv');
    setCandidates(jobId!, candidates, {
      type: isCsv ? 'csv' : 'excel',
      filename,
      count: candidates.length,
    });
    toast({ title: 'Candidates ingested', description: `${candidates.length} candidate(s) saved for this job.` });
  };

  const uploadSheetToBackend = async () => {
    if (!ensureJob()) return;
    if (!sheetFile) {
      toast({ title: 'No file selected', description: 'Upload a CSV/Excel file first.', variant: 'destructive' });
      return;
    }
    setIsBackendUploading(true);
    try {
      const form = new FormData();
      form.append('jobId', jobId!);
      form.append('file', sheetFile, sheetFile.name);
      // Backend endpoint (openapi.yaml): POST /ingestion/csv (multipart)
      const resp = await apiUpload<{ jobId?: string; acceptedRows?: number; rejectedRows?: number; message?: string }>('/ingestion/csv', form);
      toast({
        title: 'Sent to backend ingestion',
        description:
          typeof resp?.acceptedRows === 'number'
            ? `Accepted ${resp.acceptedRows}, rejected ${resp.rejectedRows ?? 0}`
            : resp?.message || 'Ingestion accepted (202).',
      });
    } catch (err) {
      toast({
        title: 'Backend ingestion failed',
        description: err instanceof Error ? err.message : 'Unable to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsBackendUploading(false);
    }
  };

  const confirmLinks = () => {
    if (!ensureJob()) return;
    const links = linksText
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!links.length) {
      toast({ title: 'No links', description: 'Paste one resume URL per line.', variant: 'destructive' });
      return;
    }
    setResumeLinks(jobId!, links);
    toast({ title: 'Links saved', description: `${links.length} link(s) saved for this job.` });
  };

  const confirmPdfs = () => {
    if (!ensureJob()) return;
    if (!pdfFiles.length) {
      toast({ title: 'No PDFs selected', description: 'Select one or more PDF files.', variant: 'destructive' });
      return;
    }
    setPdfFilenames(jobId!, pdfFiles.map((f) => f.name));
    toast({ title: 'PDFs saved', description: `${pdfFiles.length} file(s) attached for this job.` });
  };

  const validateUmurava = (schema: unknown, profiles: unknown) => {
    const res = validateAgainstJsonSchema(schema, profiles);
    if (res.ok) setUmuravaValidation({ ok: true });
    else setUmuravaValidation({ ok: false, errors: ['Schema validation failed'] });
    return res.ok;
  };

  const confirmUmurava = async () => {
    if (!ensureJob()) return;
    if (!umuravaSchema || !umuravaProfiles) {
      toast({ title: 'Missing files', description: 'Upload both schema.json and profiles.json', variant: 'destructive' });
      return;
    }
    const ok = validateUmurava(umuravaSchema, umuravaProfiles);
    if (!ok) {
      toast({ title: 'Schema validation failed', description: 'Profiles do not match the Umurava schema.', variant: 'destructive' });
      return;
    }
    try {
      const payloadProfiles = Array.isArray(umuravaProfiles) ? umuravaProfiles : [];
      const resp = await apiFetch<{ acceptedRows?: number; rejectedRows?: number }>('/ingestion/umurava', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, profiles: payloadProfiles }),
      });
      setUmuravaPayload(jobId!, umuravaSchema, umuravaProfiles);
      toast({
        title: 'Umurava data ingested',
        description: `Accepted ${resp.acceptedRows ?? 0}, rejected ${resp.rejectedRows ?? 0}.`,
      });
    } catch (err) {
      toast({
        title: 'Umurava ingestion failed',
        description: err instanceof Error ? err.message : 'Unable to ingest Umurava profiles',
        variant: 'destructive',
      });
    }
  };

  const readJsonFile = async (file: File): Promise<unknown> => {
    const text = await file.text();
    return JSON.parse(text);
  };

  return (
    <>
      <AppHeader title="Bulk Upload" />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex border-b mb-6">
          {(['sheet', 'pdf', 'links', 'umurava'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t === 'sheet' ? 'CSV / Excel' : t === 'pdf' ? 'PDF Resumes' : t === 'links' ? 'Resume Links' : 'Umurava Schema'}
            </button>
          ))}
        </div>

        {tab === 'sheet' && (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = input.files?.[0];
                if (f) await handleSheetFile(f);
                input.value = '';
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-brand-50/50 dark:hover:bg-[rgba(75,123,255,0.05)] transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Upload CSV or Excel</p>
              <p className="text-xs text-muted-foreground mt-1">Click to browse (.csv, .xlsx)</p>
              {sheetFileName && <p className="text-xs mt-2 text-muted-foreground">Selected: {sheetFileName}</p>}
            </div>

            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Template', description: 'Template download not implemented yet.' })}>
              <Download className="h-4 w-4 mr-2" /> Download Template
            </Button>

            {rows.length > 0 && (
              <div className="bg-card rounded-xl p-5 shadow-sm border space-y-4">
                <h3 className="font-semibold text-sm">Column Mapping</h3>
                <div className="space-y-2">
                  {([
                    ['Name (required)', 'name'],
                    ['Email', 'email'],
                    ['Phone', 'phone'],
                    ['Current Role', 'currentRole'],
                    ['Skills', 'skills'],
                    ['LinkedIn', 'linkedin'],
                    ['Portfolio', 'portfolio'],
                  ] as const).map(([label, key]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-32 text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">→</span>
                      <select
                        value={(mapping as Record<string, string | undefined>)[key] || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))}
                        className="bg-background rounded-lg border px-3 py-1.5 text-sm outline-none flex-1"
                      >
                        <option value="">(not mapped)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {sheetErrors.length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive">Issues</p>
                    <ul className="text-xs text-destructive mt-1 list-disc pl-4 space-y-1">
                      {sheetErrors.slice(0, 8).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {sheetErrors.length > 8 && <li>…and {sheetErrors.length - 8} more</li>}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {headers.slice(0, 8).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} className="border-b">
                          {headers.slice(0, 8).map((h) => (
                            <td key={h} className="px-3 py-2 whitespace-nowrap">
                              {String((r as Record<string, unknown>)[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{rows.length} total row(s)</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={uploadSheetToBackend} disabled={isBackendUploading}>
                      {isBackendUploading ? 'Uploading...' : 'Send to Backend'}
                    </Button>
                    <Button onClick={confirmSheetIngestion}>Confirm Ingest (Frontend)</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'pdf' && (
          <div className="space-y-6">
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setPdfFilesState(files);
                e.currentTarget.value = '';
              }}
            />

            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-brand-50/50 dark:hover:bg-[rgba(75,123,255,0.05)] transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Select resume PDFs</p>
              <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
            </div>

            {pdfFiles.length > 0 && (
              <div className="space-y-2">
                {pdfFiles.map((f) => (
                  <div key={f.name} className="flex items-center gap-3 bg-card rounded-lg p-3 border">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(f.size / 1024)} KB</p>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                ))}
                <Button className="mt-4" onClick={confirmPdfs}>Attach PDFs to Job</Button>
                <p className="text-xs text-muted-foreground">
                  Note: PDF parsing is expected to happen on the backend. The frontend stores filenames and can upload files once backend endpoints are added.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'links' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-5 shadow-sm border space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Resume Links</h3>
              </div>
              <p className="text-xs text-muted-foreground">Paste one URL per line (PDF links, LinkedIn, Drive links, etc.).</p>
              <textarea
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                rows={8}
                placeholder="https://...\nhttps://...\n"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {linksText.split(/\r?\n/g).map((l) => l.trim()).filter(Boolean).length} link(s)
                </p>
                <Button onClick={confirmLinks}>Save Links</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'umurava' && (
          <div className="space-y-6">
            <input
              ref={schemaInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const json = await readJsonFile(f);
                  setUmuravaSchema(json);
                  setUmuravaValidation(null);
                  toast({ title: 'Schema loaded', description: f.name });
                } catch (err) {
                  toast({ title: 'Invalid JSON', description: 'Schema file is not valid JSON.', variant: 'destructive' });
                } finally {
                  input.value = '';
                }
              }}
            />
            <input
              ref={profilesInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const json = await readJsonFile(f);
                  setUmuravaProfiles(json);
                  setUmuravaValidation(null);
                  toast({ title: 'Profiles loaded', description: f.name });
                } catch (err) {
                  toast({ title: 'Invalid JSON', description: 'Profiles file is not valid JSON.', variant: 'destructive' });
                } finally {
                  input.value = '';
                }
              }}
            />

            <div className="bg-card rounded-xl p-5 shadow-sm border space-y-4">
              <div className="flex items-center gap-2">
                <Braces className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Umurava Talent Profile Schema</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload the JSON Schema provided by Umurava and the dummy profiles JSON. The frontend validates that the profiles strictly match the schema.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => schemaInputRef.current?.click()}>
                  Upload schema.json
                </Button>
                <Button variant="outline" onClick={() => profilesInputRef.current?.click()}>
                  Upload profiles.json
                </Button>
                <Button onClick={confirmUmurava} disabled={!umuravaSchema || !umuravaProfiles}>
                  Validate & Save
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Schema: {umuravaSchema ? 'loaded' : 'not loaded'}</p>
                <p>Profiles: {umuravaProfiles ? 'loaded' : 'not loaded'}</p>
              </div>

              {umuravaValidation && (
                <div className={cn('rounded-lg border p-3', umuravaValidation.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-destructive/30 bg-destructive/5')}>
                  {umuravaValidation.ok ? (
                    <p className="text-sm font-medium text-emerald-700">Validation passed ✅</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-destructive">Validation failed</p>
                      <ul className="text-xs text-destructive mt-1 list-disc pl-4 space-y-1">
                        {(umuravaValidation.errors || []).slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                        {(umuravaValidation.errors || []).length > 10 && <li>…and more</li>}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
