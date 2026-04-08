import { apiFetch } from '@/lib/api';

// Matches backend `ScreeningRunCreateRequest` (openapi.yaml)
export type ScreeningRunCreateRequest = {
  jobId: string;
  batchSize?: number;
  // backend supports these extra fields (see routes/index.ts)
  topK?: number;
  useCache?: boolean;
  weightConfig?: Record<string, number>;
};

export type ScreeningRun = {
  _id?: string;
  id?: string;
  job: string;
  triggeredBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  batchSize: number;
  totalCandidates: number;
  processedCount: number;
  modelVersion: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
};

// Matches backend ScreeningResult model (subset)
export type ApiScreeningResult = {
  _id?: string;
  id?: string;
  screeningRun: string;
  application: string;
  rankPosition?: number;
  fitScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  aiReasoning: string;
  strengths: string[];
  gaps: string[];
  biasWarning?: string | null;
  biasCategory?: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getId(obj: { id?: string; _id?: string } | undefined) {
  return obj?.id || obj?._id;
}

export async function createScreeningRun(body: ScreeningRunCreateRequest) {
  return apiFetch<ScreeningRun>('/screening-runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getScreeningRun(screeningRunId: string) {
  return apiFetch<ScreeningRun>(`/screening-runs/${screeningRunId}`);
}

export async function getScreeningResults(screeningRunId: string) {
  return apiFetch<ApiScreeningResult[]>(`/screening-runs/${screeningRunId}/results`);
}

export async function runScreeningAndWait(opts: {
  jobId: string;
  topK: number;
  pollIntervalMs?: number;
  timeoutMs?: number;
}) {
  const run = await createScreeningRun({ jobId: opts.jobId, topK: opts.topK });
  const runId = getId(run);
  if (!runId) throw new Error('Screening run id missing from response');

  const pollIntervalMs = opts.pollIntervalMs ?? 1000;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const latest = await getScreeningRun(runId);
    if (latest.status === 'completed') {
      const results = await getScreeningResults(runId);
      return { run: latest, results };
    }
    if (latest.status === 'failed') {
      throw new Error(latest.errorMessage || 'Screening failed');
    }
    await sleep(pollIntervalMs);
  }
  throw new Error('Timed out waiting for screening results');
}

