import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Ajv, { type ErrorObject } from 'ajv';
import { z } from 'zod';

// Internal normalized candidate type used by the UI.
export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  phone: z.string().optional(),
  currentRole: z.string().optional(),
  skills: z.array(z.string()).default([]),
  // URL fields: only validate as URL when non-empty, otherwise treat as absent
  linkedin: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined))
    .pipe(z.string().url().optional()),
  portfolio: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined))
    .pipe(z.string().url().optional()),
});
export type IngestedCandidate = z.infer<typeof CandidateSchema>;

export type ColumnMapping = {
  name?: string;
  email?: string;
  phone?: string;
  currentRole?: string;
  skills?: string;
  linkedin?: string;
  portfolio?: string;
};

function splitSkills(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  const str = String(v ?? '').trim();
  if (!str) return [];
  return str
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stableIdFromRow(rowIndex: number, name: string) {
  return `row_${rowIndex + 1}_${name.toLowerCase().replace(/\s+/g, '_').slice(0, 24) || 'candidate'}`;
}

export function candidatesFromRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping
): { candidates: IngestedCandidate[]; errors: string[] } {
  const errors: string[] = [];
  const candidates: IngestedCandidate[] = [];

  rows.forEach((row, i) => {
    const name = String(mapping.name ? row[mapping.name] : row['name'] ?? row['Name'] ?? '').trim();
    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      return;
    }

    const candidate: IngestedCandidate = {
      id: stableIdFromRow(i, name),
      name,
      email: mapping.email ? String(row[mapping.email] ?? '') : String(row['email'] ?? row['Email'] ?? ''),
      phone: mapping.phone ? String(row[mapping.phone] ?? '') : String(row['phone'] ?? row['Phone'] ?? ''),
      currentRole: mapping.currentRole ? String(row[mapping.currentRole] ?? '') : String(row['currentRole'] ?? row['Current Role'] ?? ''),
      skills: splitSkills(mapping.skills ? row[mapping.skills] : row['skills'] ?? row['Skills']),
      linkedin: mapping.linkedin ? String(row[mapping.linkedin] ?? '') : String(row['linkedin'] ?? row['LinkedIn'] ?? ''),
      portfolio: mapping.portfolio ? String(row[mapping.portfolio] ?? '') : String(row['portfolio'] ?? row['Portfolio'] ?? ''),
    };

    const parsed = CandidateSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push(`Row ${i + 1}: ${parsed.error.issues.map((x) => x.message).join(', ')}`);
      return;
    }
    candidates.push(parsed.data);
  });

  return { candidates, errors };
}

export async function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((e) => e.message).join('; '));
  }
  return (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheet];
  // defval keeps empty cells as empty strings so mapping works.
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
}

export type UmuravaValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validateAgainstJsonSchema(schema: unknown, data: unknown): UmuravaValidationResult {
  const ajv = new Ajv({ allErrors: true });
  // Some partner schemas include custom annotation keywords such as `role`.
  // Register them as no-op keywords so strict schema compilation does not fail.
  if (!ajv.getKeyword('role')) {
    ajv.addKeyword('role');
  }
  const validate = ajv.compile(schema as object);
  const ok = validate(data);
  if (ok) return { ok: true };
  const errs = (validate.errors || []) as ErrorObject[];
  return {
    ok: false,
    errors: errs.map((e) => {
      const e2 = e as unknown as { instancePath?: string; dataPath?: string };
      const instancePath = e2.instancePath || e2.dataPath || '';
      return `${instancePath || '(root)'} ${e.message || 'invalid'}`;
    }),
  };
}

