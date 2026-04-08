import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { verify, resendCode } = useAuthStore();
  const email = typeof router.query.email === 'string' ? router.query.email : '';

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Missing email', description: 'Return to register and try again.', variant: 'destructive' });
      return;
    }
    setIsVerifying(true);
    try {
      await verify(email, code);
      toast({ title: 'Verified', description: 'Your account is verified.' });
      router.push('/recruiter/dashboard');
    } catch (err) {
      toast({ title: 'Verification failed', description: err instanceof Error ? err.message : 'Invalid code', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await resendCode(email, 'register');
      toast({
        title: 'Code resent',
        description: 'Check your email/SMS for the new code.',
      });
    } catch (err) {
      toast({ title: 'Resend failed', description: err instanceof Error ? err.message : 'Unable to resend', variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card rounded-xl shadow-md border p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Diamond className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Intore</span>
        </div>
        <h2 className="text-xl font-semibold text-center mb-1">Verify your email</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email || '(missing email)'}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-sm font-medium">Verification Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring tracking-widest"
              placeholder="123456"
            />
          </label>

          <Button type="submit" className="w-full" disabled={isVerifying || !email || code.length < 4}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={isResending || !email}>
            {isResending ? 'Resending...' : 'Resend code'}
          </Button>
        </form>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Already verified? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

