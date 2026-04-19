'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { RevealOnScroll, RevealChild } from '@/components/animations/RevealOnScroll';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { login, verifyLogin, resendOtp, googleSignIn } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // OTP verification state
    const [showOtpForm, setShowOtpForm] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setGoogleLoading(true);
        try {
            const response = await googleSignIn(credentialResponse.credential);
            toast({
                title: 'Welcome back!',
                description: 'You have been signed in successfully.',
            });
            const userRole = useAuthStore.getState().role;
            router.push(userRole === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
        } catch (err: any) {
            // Check if account doesn't exist
            if (err.message?.includes('No account found') || err.message?.includes('register')) {
                toast({
                    title: 'Account not found',
                    description: 'Please register first to create an account.',
                    variant: 'destructive',
                });
                // Optionally redirect to register page
                setTimeout(() => router.push('/register'), 2000);
            } else {
                toast({
                    title: 'Google Sign-In failed',
                    description: err instanceof Error ? err.message : 'Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => {
            toast({
                title: 'Google Sign-In failed',
                description: 'Could not connect to Google. Please try again.',
                variant: 'destructive',
            });
        },
        flow: 'implicit',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await login(email, password);
            
            if (response?.requiresVerification) {
                setShowOtpForm(true);
                setCountdown(60);
                toast({
                    title: 'OTP Sent',
                    description: `A verification code has been sent to ${email}`,
                });
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

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            toast({
                title: 'Invalid OTP',
                description: 'Please enter all 6 digits',
                variant: 'destructive',
            });
            return;
        }
        
        setLoading(true);
        try {
            await verifyLogin(email, code);
            toast({
                title: 'Login successful!',
                description: 'Welcome back to Intore.',
            });
            const userRole = useAuthStore.getState().role;
            router.push(userRole === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
        } catch (err) {
            toast({
                title: 'Verification failed',
                description: err instanceof Error ? err.message : 'Invalid or expired code.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) return;
        
        setResendLoading(true);
        try {
            await resendOtp(email, 'login_otp');
            setCountdown(60);
            setOtp(['', '', '', '', '', '']);
            toast({
                title: 'OTP Resent',
                description: 'A new verification code has been sent to your email.',
            });
        } catch (err) {
            toast({
                title: 'Failed to resend',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        } finally {
            setResendLoading(false);
        }
    };

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

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
                            Everything Rwandan recruiting teams need to screen, rank, and hire smarter as powered by AI.
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

                    {!showOtpForm ? (
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

                            <RevealChild preset="fadeIn">
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#f7f9fc] px-2 text-slate-500 font-semibold">Or continue with</span>
                                    </div>
                                </div>
                            </RevealChild>

                            <RevealChild preset="fadeUp">
                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    disabled={googleLoading}
                                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {googleLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                    )}
                                    {googleLoading ? 'Signing in...' : 'Sign in with Google'}
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
                    ) : (
                        <RevealOnScroll staggerChildren={0.1} preset="fadeIn">
                            <RevealChild preset="fadeUp">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-[#4B7BFF]/10 flex items-center justify-center">
                                        <ShieldCheck className="w-8 h-8 text-[#4B7BFF]" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 text-center">Verify your login</h2>
                                <p className="mt-2 text-sm text-slate-500 font-medium text-center">
                                    We've sent a 6-digit code to<br />
                                    <span className="font-bold text-slate-700">{email}</span>
                                </p>
                            </RevealChild>

                            <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
                                <RevealChild preset="fadeUp">
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                            />
                                        ))}
                                    </div>
                                </RevealChild>

                                <RevealChild preset="fadeUp">
                                    <button
                                        type="submit"
                                        disabled={loading || otp.join('').length !== 6}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4B7BFF] hover:bg-[#3461DF] focus:outline-none focus:ring-4 focus:ring-[#4B7BFF]/20 transition-all shadow-lg shadow-[#4B7BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</>
                                        ) : (
                                            <>Verify & Sign In<ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </RevealChild>

                                <RevealChild preset="fadeIn">
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={countdown > 0 || resendLoading}
                                            className="text-sm font-semibold text-[#2D3DB5] hover:text-[#1E2A8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {resendLoading ? (
                                                'Sending...'
                                            ) : countdown > 0 ? (
                                                `Resend code in ${countdown}s`
                                            ) : (
                                                'Resend code'
                                            )}
                                        </button>
                                    </div>
                                </RevealChild>
                            </form>

                            <RevealChild preset="fadeIn">
                                <button
                                    onClick={() => setShowOtpForm(false)}
                                    className="mt-6 text-center w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                                >
                                    ← Back to login
                                </button>
                            </RevealChild>
                        </RevealOnScroll>
                    )}
                </div>
            </div>
        </div>
    );
}