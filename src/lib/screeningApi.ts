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
  rank: number;
  name: string;
  score: number;
  strengths: string[];
  gaps: string[];
  reason: string;
  recommendation: string;
  applicationId?: string;
};

export async function runScreeningAndWait(opts: {
  jobId: string;
  topK: number;
}) {
  return apiFetch<{ screeningRunId: string; results: ApiScreeningResult[] }>('/screening/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: opts.jobId, topK: opts.topK }),
  });
}

