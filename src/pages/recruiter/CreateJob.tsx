import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppHeader } from '@/components/layout/AppHeader';
import { TagInput } from '@/components/intore/TagInput';
import { StatusBadge, TypeBadge } from '@/components/intore/Badges';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

const jobTypes = ['Remote', 'Hybrid', 'Onsite'] as const;
const employmentTypes = ['Full-time', 'Part-time', 'Contract'] as const;
const educationLevels = ['Any', 'High School', "Bachelor's", "Master's", 'PhD'];
type CreatedJobResponse = { id?: string; _id?: string };

export default function CreateJob() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'Remote' as string,
    employmentType: 'Full-time' as string, description: '',
    requiredSkills: [] as string[], niceToHaveSkills: [] as string[],
    minExperience: 0, educationLevel: 'Any',
    weights: { skills: 40, experience: 30, education: 15, portfolio: 15 },
  });
  const [showWeights, setShowWeights] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);

  const weightTotal = Object.values(form.weights).reduce((a, b) => a + b, 0);
  const update = (key: string, value: string | number | string[]) => setForm((f) => ({ ...f, [key]: value }));
  const updateWeight = (key: string, value: number) => setForm((f) => ({ ...f, weights: { ...f.weights, [key]: value } }));

  const submitJob = async (mode: 'draft' | 'publish') => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide at least a job title and description.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(mode);
    try {
      const created = await apiFetch<CreatedJobResponse>('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          requiredSkills: form.requiredSkills,
          niceToHaveSkills: form.niceToHaveSkills,
          minYearsExperience: form.minExperience > 0 ? form.minExperience : undefined,
          requiresDegree: form.educationLevel !== 'Any',
          degreeDetails: form.educationLevel !== 'Any' ? form.educationLevel : undefined,
          location: form.location || undefined,
          isRemote: form.type === 'Remote',
          employmentType: form.employmentType,
          requirements: [form.department, ...form.requiredSkills].filter(Boolean).join(', ') || undefined,
          screeningBatchSize: 20,
          aiAssisted: true,
          status: 'draft',
        }),
      });

      const jobId = created?.id || created?._id;
      if (mode === 'publish' && jobId) {
        try {
          await apiFetch(`/jobs/${jobId}/activate`, { method: 'POST' });
        } catch {
          // Keep created draft if activate fails, but inform user.
          toast({
            title: 'Job saved as draft',
            description: 'Publishing failed, but your draft was created successfully.',
          });
          router.push('/recruiter/jobs');
          return;
        }
      }

      toast({
        title: mode === 'publish' ? 'Job posted' : 'Draft saved',
        description: mode === 'publish' ? 'Your job is now active.' : 'Your job draft has been saved.',
      });
      router.push('/recruiter/jobs');
    } catch (err) {
      toast({
        title: 'Could not create job',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <AppHeader title="Post New Job" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info */}
            <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Job Title
                  <input value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Senior Frontend Developer" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Department
                    <select value={form.department} onChange={(e) => update('department', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      <option value="">Select</option>
                      {['Engineering', 'Design', 'Data', 'Infrastructure', 'Marketing'].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Location
                    <input value={form.location} onChange={(e) => update('location', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. San Francisco, CA" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Job Type</p>
                  <div className="flex rounded-lg border overflow-hidden">
                    {jobTypes.map((t) => (
                      <button key={t} onClick={() => update('type', t)} className={cn('flex-1 px-4 py-2 text-sm font-medium transition-colors', form.type === t ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Employment Type</p>
                  <div className="flex rounded-lg border overflow-hidden">
                    {employmentTypes.map((t) => (
                      <button key={t} onClick={() => update('employmentType', t)} className={cn('flex-1 px-4 py-2 text-sm font-medium transition-colors', form.employmentType === t ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
              <h3 className="font-semibold">Job Description</h3>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={6} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ring" placeholder="Describe the role, responsibilities, and what makes it exciting..." />
              <p className={cn('text-xs', form.description.length < 200 ? 'text-muted-foreground' : 'text-emerald-600')}>{form.description.length}/200 min characters</p>
            </section>

            {/* Requirements */}
            <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
              <h3 className="font-semibold">Requirements</h3>
              <div>
                <p className="text-sm font-medium mb-2">Required Skills</p>
                <TagInput tags={form.requiredSkills} onChange={(t) => update('requiredSkills', t)} variant="primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Nice-to-Have Skills</p>
                <TagInput tags={form.niceToHaveSkills} onChange={(t) => update('niceToHaveSkills', t)} variant="neutral" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">Min Experience (years)
                  <input type="number" min={0} max={20} value={form.minExperience} onChange={(e) => update('minExperience', +e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="block text-sm font-medium">Education Level
                  <select value={form.educationLevel} onChange={(e) => update('educationLevel', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                    {educationLevels.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {/* Weights */}
            <section className="bg-card rounded-xl shadow-sm border overflow-hidden">
              <button onClick={() => setShowWeights(!showWeights)} className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold hover:bg-muted/50 transition-colors">
                Screening Weights
                <span className={cn('text-xs font-normal', weightTotal !== 100 ? 'text-destructive' : 'text-muted-foreground')}>Total: {weightTotal}/100</span>
              </button>
              {showWeights && (
                <div className="px-6 pb-6 space-y-4">
                  <p className="text-xs text-muted-foreground">These weights influence how the AI scores candidates</p>
                  {Object.entries(form.weights).map(([key, val]) => (
                    <label key={key} className="block text-sm">
                      <span className="capitalize">{key}: {val}</span>
                      <input type="range" min={0} max={100} value={val} onChange={(e) => updateWeight(key, +e.target.value)} className="w-full mt-1 accent-primary" />
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-card rounded-xl shadow-sm border p-6 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
              <h3 className="text-lg font-semibold">{form.title || 'Job Title'}</h3>
              <div className="flex flex-wrap gap-2">
                {form.type && <TypeBadge type={form.type} />}
                {form.employmentType && <StatusBadge status={form.employmentType} />}
              </div>
              {form.location && <p className="text-sm text-muted-foreground">{form.location}</p>}
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.requiredSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-700 dark:bg-[rgba(75,123,255,0.1)] dark:text-[#4B7BFF]">{s}</span>
                  ))}
                </div>
              )}
              {form.minExperience > 0 && <p className="text-sm text-muted-foreground">{form.minExperience}+ years experience</p>}
              {form.educationLevel !== 'Any' && <p className="text-sm text-muted-foreground">{form.educationLevel} required</p>}

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => submitJob('draft')} disabled={saving !== null}>
                  {saving === 'draft' ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button className="flex-1" onClick={() => submitJob('publish')} disabled={saving !== null}>
                  {saving === 'publish' ? 'Posting...' : 'Post Job'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
