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
    const { login } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            const userRole = useAuthStore.getState().role;
            router.push(userRole === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
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
    };

    const handleResendOtp = async () => {
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
                </div>
            </div>
        </div>
    );
}