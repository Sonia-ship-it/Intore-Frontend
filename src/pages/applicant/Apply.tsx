import { useState } from 'react';
import { useRouter } from 'next/router';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { mockJobs } from '@/data/mockData';
import { TagInput } from '@/components/intore/TagInput';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export default function ApplyPage() {
  const router = useRouter();

  const jobId =
    typeof router.query.jobId === 'string'
      ? router.query.jobId
      : undefined;

  const job = mockJobs.find((j) => j.id === jobId);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    province: '',
    linkedin: '',
    portfolio: '',
    skills: [] as string[],
    certifications: [] as string[],
    coverNote: '',
  });

  const rwandaProvinces = [
    'Kigali City',
    'Eastern Province',
    'Western Province',
    'Northern Province',
    'Southern Province',
  ];

  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    {
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  ]);

  const [educations, setEducations] = useState<EducationEntry[]>([
    {
      institution: '',
      degree: '',
      field: '',
      year: '',
    },
  ]);

  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const filledFields = [
    form.name,
    form.email,
    form.skills.length > 0,
    experiences[0]?.company,
  ].filter(Boolean).length;

  const totalFields = 4;
  const progress = Math.round((filledFields / totalFields) * 100);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-xl p-8 shadow-sm border text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Application Submitted!
          </h2>
          <p className="text-muted-foreground mb-6">
            Thank you for applying. We&apos;ll review your application and get
            back to you soon.
          </p>
          <Button onClick={() => router.push('/applicant/dashboard')}>
            Track My Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Profile completion
            </span>
            <span className="font-medium">{progress}%</span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Job Summary */}
        {job && (
          <div className="bg-brand-50 dark:bg-[rgba(75,123,255,0.1)] rounded-xl p-5 mb-6 border border-brand-200 dark:border-[rgba(75,123,255,0.2)]">
            <h2 className="font-semibold text-lg">{job.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {job.department} · {job.location}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h3 className="font-semibold">Personal Information</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium col-span-2">
                Full Name
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block text-sm font-medium">
                Phone
                <div className="mt-1 w-full rounded-lg border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <PhoneInput
                    international
                    defaultCountry="RW"
                    value={form.phone}
                    onChange={(value) => update('phone', value || '')}
                    placeholder="Enter phone number"
                    className="phone-input-apply"
                  />
                </div>
              </label>

              <label className="block text-sm font-medium">
                Province
                <select
                  value={form.province}
                  onChange={(e) => update('province', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select province...</option>
                  {rwandaProvinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                LinkedIn URL
                <input
                  value={form.linkedin}
                  onChange={(e) => update('linkedin', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block text-sm font-medium">
                Portfolio/GitHub URL
                <input
                  value={form.portfolio}
                  onChange={(e) => update('portfolio', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
          </section>

          {/* Skills */}
          <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h3 className="font-semibold">Skills</h3>
            <TagInput
              tags={form.skills}
              onChange={(t) => update('skills', t)}
              variant="primary"
            />
          </section>

          {/* Experience */}
          <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h3 className="font-semibold">Experience</h3>

            {experiences.map((exp, i) => (
              <div
                key={i}
                className="space-y-3 p-4 rounded-lg bg-muted/30 relative"
              >
                {experiences.length > 1 && (
                  <button
                    onClick={() =>
                      setExperiences(
                        experiences.filter((_, j) => j !== i)
                      )
                    }
                    className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => {
                      const n = [...experiences];
                      n[i].company = e.target.value;
                      setExperiences(n);
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <input
                    placeholder="Job Title"
                    value={exp.role}
                    onChange={(e) => {
                      const n = [...experiences];
                      n[i].role = e.target.value;
                      setExperiences(n);
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => {
                      const n = [...experiences];
                      n[i].startDate = e.target.value;
                      setExperiences(n);
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <input
                    type="month"
                    value={exp.endDate}
                    onChange={(e) => {
                      const n = [...experiences];
                      n[i].endDate = e.target.value;
                      setExperiences(n);
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <textarea
                  placeholder="Key responsibilities"
                  value={exp.description}
                  onChange={(e) => {
                    const n = [...experiences];
                    n[i].description = e.target.value;
                    setExperiences(n);
                  }}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setExperiences([
                  ...experiences,
                  {
                    company: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Experience
            </Button>
          </section>

          {/* Education */}
          <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h3 className="font-semibold">Education</h3>

            {educations.map((edu, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30 relative"
              >
                {educations.length > 1 && (
                  <button
                    onClick={() =>
                      setEducations(
                        educations.filter((_, j) => j !== i)
                      )
                    }
                    className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                )}

                <input
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const n = [...educations];
                    n[i].institution = e.target.value;
                    setEducations(n);
                  }}
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <input
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => {
                    const n = [...educations];
                    n[i].degree = e.target.value;
                    setEducations(n);
                  }}
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <input
                  placeholder="Field of Study"
                  value={edu.field}
                  onChange={(e) => {
                    const n = [...educations];
                    n[i].field = e.target.value;
                    setEducations(n);
                  }}
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <input
                  placeholder="Year"
                  type="number"
                  value={edu.year}
                  onChange={(e) => {
                    const n = [...educations];
                    n[i].year = e.target.value;
                    setEducations(n);
                  }}
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEducations([
                  ...educations,
                  {
                    institution: '',
                    degree: '',
                    field: '',
                    year: '',
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Education
            </Button>
          </section>

          {/* Cover Note */}
          <section className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h3 className="font-semibold">
              Cover Note{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </h3>

            <textarea
              value={form.coverNote}
              onChange={(e) =>
                e.target.value.length <= 250 &&
                update('coverNote', e.target.value)
              }
              rows={3}
              placeholder="Why are you interested in this role?"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ring"
            />

            <p className="text-xs text-muted-foreground">
              {form.coverNote.length}/250
            </p>
          </section>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setSubmitted(true)}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}