'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { RevealOnScroll, RevealChild } from '@/components/animations/RevealOnScroll';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { register } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState<string>('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');

    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return null;
        const checks = [
            pwd.length >= 8,
            /[A-Z]/.test(pwd),
            /[0-9]/.test(pwd),
            /[^A-Za-z0-9]/.test(pwd),
        ];
        const score = checks.filter(Boolean).length;
        if (score <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500', width: 'w-1/4' };
        if (score === 2) return { label: 'Fair', color: 'bg-orange-400', text: 'text-orange-400', width: 'w-2/4' };
        if (score === 3) return { label: 'Good', color: 'bg-yellow-400', text: 'text-yellow-500', width: 'w-3/4' };
        return { label: 'Strong', color: 'bg-green-500', text: 'text-green-500', width: 'w-full' };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({
                name: `${firstName} ${lastName}`.trim(),
                email,
                password,
                role: 'recruiter',
                phoneNumber: phone,
                companyName,
            });
            router.push('/onboarding');
        } catch (err) {
            toast({
                title: 'Registration failed',
                description: err instanceof Error ? err.message : 'Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f7f9fc] animate-page-in">
            {/* Left Panel */}
            <div className="hidden lg:flex w-[45%] bg-[#05071A] text-white flex-col justify-between p-12 relative overflow-hidden sticky top-0 h-screen">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4B7BFF]/10 via-transparent to-[#1E2A8A]/10" />
                <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 text-[200px] font-black text-white/[0.02] leading-none tracking-tighter italic select-none whitespace-nowrap">
                    INTORE
                </div>
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2.5">
                        <IntoreMark className="w-8 h-8 text-[#4B7BFF] animate-brand-spin" />
                        <span className="text-xl font-bold tracking-tight">Intore</span>
                    </Link>
                </div>
                <div className="relative z-10 space-y-8">
                    <RevealOnScroll preset="fadeUp" delay={0.1}>
                        <h2 className="text-4xl font-black tracking-tight leading-tight">
                            Join Rwanda&apos;s<br />talent revolution.
                        </h2>
                    </RevealOnScroll>
                    <RevealOnScroll preset="fadeUp" delay={0.2}>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            Intore connects you with Rwanda&apos;s best opportunities using AI-powered matching, making the recruiting and application process seamless.
                        </p>
                    </RevealOnScroll>
                </div>
                <div className="relative z-10">
                    <p className="text-[11px] text-slate-600 font-medium">© 2026 Intore. Built for a smarter workforce.</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md animate-auth-panel-in">
                    <div className="lg:hidden flex items-center gap-2.5 mb-12">
                        <IntoreMark className="w-8 h-8 text-[#4B7BFF] animate-brand-spin" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">Intore</span>
                    </div>

                    <RevealOnScroll staggerChildren={0.1} preset="fadeIn">
                        <RevealChild preset="fadeUp">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">Create an account</h2>
                            <p className="mt-2 text-sm text-slate-500 font-medium">Get started with Intore in seconds</p>
                        </RevealChild>

                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            {/* Company Name */}
                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Company Name</label>
                                    <input
                                        type="text" required placeholder="Organization name"
                                        value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                    />
                                </div>
                            </RevealChild>
                            <RevealChild preset="fadeUp">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">First Name</label>
                                        <input
                                            type="text" required placeholder="Name"
                                            value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Last Name</label>
                                        <input
                                            type="text" required placeholder="Name"
                                            value={lastName} onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                    </div>
                                </div>
                            </RevealChild>

                            {/* Email */}
                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Email</label>
                                    <input
                                        type="email" required placeholder="name@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                    />
                                </div>
                            </RevealChild>

                            {/* Phone */}
                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Phone Number</label>
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#4B7BFF]/20 focus-within:border-[#4B7BFF] transition-all">
                                        <PhoneInput
                                            international defaultCountry="RW"
                                            value={phone} onChange={(value) => setPhone(value || '')}
                                            placeholder="Enter phone number"
                                            className="phone-input-intore"
                                        />
                                    </div>
                                </div>
                            </RevealChild>

                            {/* Password */}
                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                        <button
                                            type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordStrength && (
                                        <div className="mt-2 space-y-1">
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                                            </div>
                                            <p className={`text-[11px] font-semibold ${passwordStrength.text}`}>
                                                {passwordStrength.label} — {passwordStrength.label === 'Weak' ? 'add uppercase, numbers & symbols' : passwordStrength.label === 'Fair' ? 'add numbers & symbols' : passwordStrength.label === 'Good' ? 'add a symbol to make it strong' : 'great password'}
                                            </p>
                                        </div>
                                    )}                                </div>
                            </RevealChild>

                            {/* Submit */}
                            <RevealChild preset="fadeUp">
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4B7BFF] hover:bg-[#3461DF] focus:outline-none focus:ring-4 focus:ring-[#4B7BFF]/20 transition-all shadow-lg shadow-[#4B7BFF]/20 disabled:opacity-80 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
                                    ) : (
                                        <>Create Account<ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </RevealChild>
                        </form>

                        <RevealChild preset="fadeIn">
                            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-[#2D3DB5] hover:text-[#1E2A8A] transition-colors">
                                    Sign in →
                                </Link>
                            </p>
                        </RevealChild>
                    </RevealOnScroll>
                </div>
            </div>
        </div>
    );
}
