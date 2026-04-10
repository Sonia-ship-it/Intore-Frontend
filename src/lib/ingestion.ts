import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Ajv, { type ErrorObject } from 'ajv';
import { z } from 'zod';

// Internal normalized candidate type used by the UI.
export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  currentRole: z.string().optional(),
  skills: z.array(z.string()).default([]),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
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

// Automatic column mapping - no user intervention needed
function autoMapColumns(headers: string[]): ColumnMapping {
  const find = (cands: string[]) => {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    return cands.find(cand => lowerHeaders.some(h => h.includes(cand.toLowerCase())));
  };
  
  return {
    name: find(['name', 'full name', 'candidate name', 'applicant']) || headers[0],
    email: find(['email', 'email address', 'mail']),
    phone: find(['phone', 'phone number', 'mobile', 'tel']),
    currentRole: find(['current role', 'role', 'title', 'job title', 'position']),
    skills: find(['skills', 'skill', 'tech stack', 'stack', 'technologies']),
    linkedin: find(['linkedin', 'linkedin url', 'linkedin profile']),
    portfolio: find(['portfolio', 'portfolio url', 'github', 'github url', 'website'])
  };
}

export function candidatesFromRows(
  rows: Record<string, unknown>[]
): { candidates: IngestedCandidate[]; errors: string[] } {
  const errors: string[] = [];
  const candidates: IngestedCandidate[] = [];

  // Automatic column mapping
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const mapping = autoMapColumns(headers);

  rows.forEach((row, i) => {
    const name = String(row[mapping.name] || '').trim();
    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      return;
    }

    // Clean and process the data automatically
    const rawEmail = String(row[mapping.email] || '');
    const rawPhone = String(row[mapping.phone] || '');
    const rawCurrentRole = String(row[mapping.currentRole] || '');
    const rawSkills = splitSkills(row[mapping.skills] || '');
    const rawLinkedin = String(row[mapping.linkedin] || '');
    const rawPortfolio = String(row[mapping.portfolio] || '');

    // Validate email format if provided
    const cleanEmail = rawEmail.trim();
    const email = cleanEmail && cleanEmail.includes('@') ? cleanEmail : undefined;

    const candidate: IngestedCandidate = {
      id: stableIdFromRow(i, name),
      name,
      email,
      phone: rawPhone.trim() || undefined,
      currentRole: rawCurrentRole.trim() || undefined,
      skills: rawSkills,
      linkedin: (rawLinkedin.trim() && rawLinkedin.trim().startsWith('http')) ? rawLinkedin.trim() : undefined,
      portfolio: (rawPortfolio.trim() && rawPortfolio.trim().startsWith('http')) ? rawPortfolio.trim() : undefined,
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

