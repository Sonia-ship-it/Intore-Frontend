'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { RevealOnScroll, RevealChild } from '@/components/animations/RevealOnScroll';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { login, verifyLoginOtp } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // OTP step
    const [otpStep, setOtpStep] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [devCode, setDevCode] = useState<string | undefined>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.otpRequired) {
                setOtpEmail(result.email || email);
                setDevCode(result.devCode);
                setOtpStep(true);
                toast({ title: 'OTP sent', description: `A 6-digit code was sent to ${result.email || email}.` });
            } else {
                const userRole = useAuthStore.getState().role;
                router.push(userRole === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
            }
        } catch (err) {
            toast({
                title: 'Login failed',
                description: err instanceof Error ? err.message : 'Invalid credentials.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyLoginOtp(otpEmail, otp);
            const userRole = useAuthStore.getState().role;
            router.push(userRole === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
        } catch (err) {
            toast({
                title: 'Invalid OTP',
                description: err instanceof Error ? err.message : 'The code is incorrect or expired.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await login(email, password);
            toast({ title: 'OTP resent', description: 'A new code was sent to your email.' });
        } catch {
            toast({ title: 'Could not resend', variant: 'destructive' });
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f7f9fc] animate-page-in">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-[45%] bg-[#05071A] text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4B7BFF]/10 via-transparent to-[#1E2A8A]/10"></div>
                <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 text-[200px] font-black text-white/[0.02] leading-none tracking-tighter italic select-none whitespace-nowrap">
                    INTORE
                </div>

                <div className="relative z-10 transition-transform">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <IntoreMark className="w-8 h-8 text-[#4B7BFF] animate-brand-spin" />
                        <span className="text-xl font-bold tracking-tight">Intore</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <RevealOnScroll preset="fadeUp" delay={0.1}>
                        <h2 className="text-4xl font-black tracking-tight leading-tight">
                            Hire Rwanda's<br />best talent.
                        </h2>
                    </RevealOnScroll>
                    <RevealOnScroll preset="fadeUp" delay={0.2}>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            Everything Rwandan hiring teams need to screen, rank, and hire smarter as powered by AI.
                        </p>
                    </RevealOnScroll>
                    <RevealOnScroll preset="fadeUp" delay={0.3} className="flex gap-6 pt-4">
                        {[
                            { value: '500+', label: 'Companies' },
                            { value: '10K+', label: 'Candidates' },
                            { value: '98%', label: 'Satisfaction' },
                        ].map(stat => (
                            <div key={stat.label}>
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </RevealOnScroll>
                </div>

                <div className="relative z-10">
                    <p className="text-[11px] text-slate-600 font-medium">© 2026 Intore. Built for a smarter workforce.</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md animate-auth-panel-in">
                    <div className="lg:hidden flex items-center gap-2.5 mb-12">
                        <IntoreMark className="w-8 h-8 text-[#4B7BFF] animate-brand-spin" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">Intore</span>
                    </div>

                    {otpStep ? (
                        /* ── OTP Step ── */
                        <div className="space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 rounded-2xl bg-[#4B7BFF]/10 flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-[#4B7BFF]" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900">Check your email</h2>
                                <p className="text-sm text-slate-500 font-medium max-w-xs">
                                    We sent a 6-digit code to <span className="font-semibold text-slate-700">{otpEmail}</span>. Enter it below to complete sign in.
                                </p>
                                {devCode && (
                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-mono">
                                        Dev code: <strong>{devCode}</strong>
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 font-bold text-2xl text-center tracking-[0.5em] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4B7BFF] hover:bg-[#3461DF] focus:outline-none focus:ring-4 focus:ring-[#4B7BFF]/20 transition-all shadow-lg shadow-[#4B7BFF]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : <><ShieldCheck className="w-4 h-4" />Verify & Sign In</>}
                                </button>
                            </form>

                            <div className="text-center space-y-3">
                                <p className="text-sm text-slate-500">
                                    Didn't receive the code?{' '}
                                    <button onClick={handleResendOtp} className="font-semibold text-[#4B7BFF] hover:text-[#3461DF] transition-colors">
                                        Resend
                                    </button>
                                </p>
                                <button
                                    onClick={() => { setOtpStep(false); setOtp(''); }}
                                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    ← Back to sign in
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Credentials Step ── */
                        <RevealOnScroll staggerChildren={0.1} preset="fadeIn">
                            <RevealChild preset="fadeUp">
                                <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome back</h2>
                                <p className="mt-2 text-sm text-slate-500 font-medium">Sign in to your account to continue</p>
                            </RevealChild>

                            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                                <RevealChild preset="fadeUp">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Email</label>
                                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
                                    </div>
                                </RevealChild>

                                <RevealChild preset="fadeUp">
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Password</label>
                                        <div className="relative">
                                            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </RevealChild>

                                <RevealChild preset="fadeUp">
                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#4B7BFF] focus:ring-[#4B7BFF]" />
                                            <span className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Remember me</span>
                                        </label>
                                        <a href="#" className="text-sm font-bold text-[#4B7BFF] hover:text-[#3461DF] transition-colors">Forgot password?</a>
                                    </div>
                                </RevealChild>

                                <RevealChild preset="fadeUp">
                                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4B7BFF] hover:bg-[#3461DF] focus:outline-none focus:ring-4 focus:ring-[#4B7BFF]/20 transition-all shadow-lg shadow-[#4B7BFF]/20 disabled:opacity-80 disabled:cursor-not-allowed mt-8">
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : <>Sign In<ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </RevealChild>
                            </form>

                            <RevealChild preset="fadeIn">
                                <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                                    Don't have an account?{' '}
                                    <Link href="/register" className="font-semibold text-[#2D3DB5] hover:text-[#1E2A8A] transition-colors">Register →</Link>
                                </p>
                            </RevealChild>
                        </RevealOnScroll>
                    )}
                </div>
            </div>
        </div>
    );
}