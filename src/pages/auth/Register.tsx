import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Diamond, Briefcase, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'recruiter' | 'applicant'>('recruiter');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (role === 'recruiter' && !companyName.trim()) {
      toast({ title: 'Company name required', description: 'Recruiter accounts require a company name.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    register({ name, email, password, role, phoneNumber, companyName: role === 'recruiter' ? companyName : undefined })
      .then(({ verificationRequired, devCode }) => {
        if (verificationRequired) {
          router.push(`/verify?email=${encodeURIComponent(email)}${devCode ? `&devCode=${encodeURIComponent(devCode)}` : ''}`);
          return;
        }
        toast({ title: 'Registered', description: 'Account created.' });
        router.push('/login');
      })
      .catch((err) => {
        toast({
          title: 'Registration failed',
          description: err instanceof Error ? err.message : 'Unable to register',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card rounded-xl shadow-md border p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Diamond className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Intore</span>
        </div>
        <h2 className="text-xl font-semibold text-center mb-6">Create your account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Full Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">Phone Number
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="+250..." />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">Confirm Password
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>

          <div>
            <p className="text-sm font-medium mb-3">I am a...</p>
            <div className="grid grid-cols-2 gap-3">
              {([['recruiter', Briefcase, "I'm a Recruiter"], ['applicant', User, "I'm an Applicant"]] as const).map(([r, Icon, label]) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={cn('relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors', role === r ? 'border-primary bg-brand-50 dark:bg-[rgba(75,123,255,0.1)]' : 'border-border hover:border-muted-foreground/30')}>
                  {role === r && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {role === 'recruiter' && (
            <label className="block text-sm font-medium">Company Name
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </label>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !name || !email || !phoneNumber || !password}>
            {isLoading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
