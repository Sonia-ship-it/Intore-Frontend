import { create } from 'zustand';
import type { IngestedCandidate } from '@/lib/ingestion';

export type IngestionSource =
  | { type: 'umurava'; count: number }
  | { type: 'csv'; filename: string; count: number }
  | { type: 'excel'; filename: string; count: number }
  | { type: 'pdf'; filenames: string[]; count?: number }
  | { type: 'links'; count: number };

type JobIngestionState = {
  candidates: IngestedCandidate[];
  // For Scenario 1: keep the schema + profiles exactly as provided (we only validate on the frontend).
  umurava?: {
    schema?: unknown;
    profiles?: unknown;
  };
  // For Scenario 2: keep raw sources that may be sent to backend for parsing (PDFs/links).
  external?: {
    resumeLinks?: string[];
    pdfFilenames?: string[];
  };
  sources: IngestionSource[];
  lastUpdatedAt?: string;
};

interface IngestionStore {
  byJobId: Record<string, JobIngestionState>;
  setCandidates: (jobId: string, candidates: IngestedCandidate[], source: IngestionSource) => void;
  setUmuravaPayload: (jobId: string, schema: unknown, profiles: unknown, source?: IngestionSource) => void;
  setResumeLinks: (jobId: string, links: string[], source?: IngestionSource) => void;
  setPdfFilenames: (jobId: string, filenames: string[], source?: IngestionSource) => void;
  clearJob: (jobId: string) => void;
}

export const useIngestionStore = create<IngestionStore>((set) => ({
  byJobId: {},
  setCandidates: (jobId, candidates, source) =>
    set((state) => ({
      byJobId: {
        ...state.byJobId,
        [jobId]: {
          candidates,
          umurava: state.byJobId[jobId]?.umurava,
          external: state.byJobId[jobId]?.external,
          sources: [...(state.byJobId[jobId]?.sources || []), source],
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    })),
  setUmuravaPayload: (jobId, schema, profiles, source = { type: 'umurava', count: Array.isArray(profiles) ? profiles.length : 0 }) =>
    set((state) => ({
      byJobId: {
        ...state.byJobId,
        [jobId]: {
          candidates: state.byJobId[jobId]?.candidates || [],
          external: state.byJobId[jobId]?.external,
          umurava: { schema, profiles },
          sources: [...(state.byJobId[jobId]?.sources || []), source],
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    })),
  setResumeLinks: (jobId, links, source = { type: 'links', count: links.length }) =>
    set((state) => ({
      byJobId: {
        ...state.byJobId,
        [jobId]: {
          candidates: state.byJobId[jobId]?.candidates || [],
          umurava: state.byJobId[jobId]?.umurava,
          external: { ...(state.byJobId[jobId]?.external || {}), resumeLinks: links },
          sources: [...(state.byJobId[jobId]?.sources || []), source],
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    })),
  setPdfFilenames: (jobId, filenames, source = { type: 'pdf', filenames }) =>
    set((state) => ({
      byJobId: {
        ...state.byJobId,
        [jobId]: {
          candidates: state.byJobId[jobId]?.candidates || [],
          umurava: state.byJobId[jobId]?.umurava,
          external: { ...(state.byJobId[jobId]?.external || {}), pdfFilenames: filenames },
          sources: [...(state.byJobId[jobId]?.sources || []), source],
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    })),
  clearJob: (jobId) =>
    set((state) => {
      const next = { ...state.byJobId };
      delete next[jobId];
      return { byJobId: next };
    }),
}));

