import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Diamond, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    login(email, password)
      .then(() => router.push('/recruiter/dashboard'))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Unable to login';
        if (typeof msg === 'string' && msg.toLowerCase().includes('not verified')) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        toast({
          title: 'Login failed',
          description: msg,
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
        <h2 className="text-xl font-semibold text-center mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="you@gmail.com" />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
          </label>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Remember me</label>
            <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-border" /><span className="text-xs text-muted-foreground">or</span><hr className="flex-1 border-border" />
        </div>

        <Button variant="outline" className="w-full">Sign in with Google</Button>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
