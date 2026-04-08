'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Diamond } from 'lucide-react';
import { RevealOnScroll, RevealChild } from '@/components/animations/RevealOnScroll';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1200);
    };

    return (
        <div className="min-h-screen flex bg-[#f7f9fc]">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-[45%] bg-[#05071A] text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4B7BFF]/10 via-transparent to-[#1E2A8A]/10"></div>
                <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 text-[200px] font-black text-white/[0.02] leading-none tracking-tighter italic select-none whitespace-nowrap">
                    INTORE
                </div>

                <div className="relative z-10 transition-transform">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Diamond className="w-8 h-8 text-[#4B7BFF] fill-[#4B7BFF] animate-[spin_6s_linear_infinite]" />
                        <span className="text-xl font-bold tracking-tight">Intore</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <RevealOnScroll preset="fadeUp" delay={0.1}>
                        <h2 className="text-4xl font-black tracking-tight leading-tight">
                            Join Rwanda's<br />talent revolution.
                        </h2>
                    </RevealOnScroll>
                    <RevealOnScroll preset="fadeUp" delay={0.2}>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            Intore connects you with Rwanda's best opportunities using AI-powered matching, making the hiring and application process seamless.
                        </p>
                    </RevealOnScroll>
                </div>

                <div className="relative z-10">
                    <p className="text-[11px] text-slate-600 font-medium">© 2026 Intore. Built for a smarter workforce.</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2.5 mb-12">
                        <Diamond className="w-8 h-8 text-[#4B7BFF] fill-[#4B7BFF] animate-[spin_6s_linear_infinite]" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">Intore</span>
                    </div>

                    <RevealOnScroll staggerChildren={0.1} preset="fadeIn">
                        <RevealChild preset="fadeUp">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">Create an account</h2>
                            <p className="mt-2 text-sm text-slate-500 font-medium">Get started with Intore in seconds</p>
                        </RevealChild>

                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            <RevealChild preset="fadeUp">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Claudine"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Uwimana"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                    </div>
                                </div>
                            </RevealChild>

                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="claudine@example.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                    />
                                </div>
                            </RevealChild>
                            
                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+250 788 123 456"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                    />
                                </div>
                            </RevealChild>

                            <RevealChild preset="fadeUp">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </RevealChild>

                            <RevealChild preset="fadeUp">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4B7BFF] hover:bg-[#3461DF] focus:outline-none focus:ring-4 focus:ring-[#4B7BFF]/20 transition-all shadow-lg shadow-[#4B7BFF]/20 disabled:opacity-80 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </RevealChild>
                        </form>

                        <RevealChild preset="fadeIn">
                            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                                Already have an account?{' '}
                                <Link href="/login" className="font-bold text-[#4B7BFF] hover:text-[#3461DF] transition-colors">
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