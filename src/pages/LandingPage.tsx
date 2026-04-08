import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  Diamond, Menu, Sparkles, FileText, ShieldCheck,
  MessageSquare, Upload, Scale, CheckCircle, BarChart,
  PlayCircle, Users
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { RevealOnScroll, RevealChild, AnimatedCounter, useParallaxCursor } from '@/components/animations/RevealOnScroll';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const parallaxRef1 = useParallaxCursor(12);
  const parallaxRef2 = useParallaxCursor(-8);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToSection = (e: ReactMouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.scrollTo(el, { offset: -88, duration: 2.0 });
      } else {
        const navOffset = 88;
        const targetY = el.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div
        className="pointer-events-none fixed hidden md:block z-[6] w-[520px] h-[520px] rounded-full"
        style={{
          left: cursor.x,
          top: cursor.y,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(75,123,255,0.24) 0%, rgba(75,123,255,0.12) 30%, rgba(75,123,255,0.04) 52%, transparent 72%)',
          filter: 'blur(26px)',
          transition: 'left 120ms ease-out, top 120ms ease-out',
        }}
      />
      {/* GLOBAL LANDING STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --brand-50:  #EEF0FD;
          --brand-100: #CDD5F8;
          --brand-200: #9AAAF0;
          --brand-300: #6B7FE8;
          --brand-400: #4A5FD4;
          --brand-500: #2D3DB5;
          --brand-600: #1E2A8A;
          --brand-700: #151D6B;
          --brand-800: #0F1547;
          --brand-900: #0A0E2E;
          --brand-950: #05071A;
          --accent: #4B7BFF;
        }
        
        @keyframes fadeUpFloat {
          from { opacity: 0; transform: translateY(24px) rotate(var(--card-rot)); }
          to   { opacity: 1; transform: translateY(0px)  rotate(var(--card-rot)); }
        }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px)   rotate(var(--card-rot)); }
          50%       { transform: translateY(-7px)  rotate(var(--card-rot)); }
        }

        @keyframes heroPulse {
          0%, 100% { box-shadow: 0 0 32px rgba(75,123,255,0.45); }
          50%       { box-shadow: 0 0 52px rgba(75,123,255,0.7);  }
        }

        .float-card {
          animation: fadeUpFloat 0.8s ease-out forwards, gentleFloat 5s ease-in-out infinite;
          animation-delay: var(--delay), calc(var(--delay) + 0.8s);
        }

        .pulse-btn {
          animation: heroPulse 3s infinite ease-in-out;
        }

        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .hero-reveal {
          opacity: 0;
          animation: heroReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--hero-delay, 0ms);
        }

        /* Cursor-controlled tilt for hero cards */
        .parallax-tilt {
          transition: transform 0.2s ease-out;
          will-change: transform;
        }
      `}} />

      {/* SECTION 1 — PILL NAVBAR */}
      <div className="pill-navbar-wrapper">
        <div className="pill-navbar">
          {/* LEFT — Logo */}
          <Link href="/" className="flex items-center gap-2" style={{ paddingRight: 32 }}>
            <Diamond className="w-4 h-4 text-[#4B7BFF] fill-[#4B7BFF]" />
            <span className="font-semibold text-[16px] text-white">Intore</span>
          </Link>

          {/* CENTER — Nav links */}
          <div className="hidden md:flex pill-nav-links items-center" style={{ gap: 32 }}>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How it works</a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')}>Testimonials</a>
            <a href="#blog">Blog</a>
          </div>

          {/* RIGHT — Login + CTA */}
          <div className="hidden md:flex items-center" style={{ marginLeft: 'auto', gap: 16, paddingLeft: 24 }}>
            <Link href="/login" className="pill-login-link">
              <span className="pill-login-dot" />
              Log in
            </Link>
            <Link href="/register" className="pill-cta-btn">Get started</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white"
            style={{ marginLeft: 'auto' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 text-white p-2">
            <span className="text-2xl">✕</span>
          </button>
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How it works</a>
          <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')}>Testimonials</a>
          <a href="#blog" onClick={() => setMobileMenuOpen(false)}>Blog</a>
          <div className="mobile-menu-actions">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mobile-login">Log in</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="mobile-cta">Get started</Link>
          </div>
        </div>
      )}

      {/* SECTION 2 — HERO */}
      <section
        id="hero"
        className="relative w-full h-auto overflow-visible flex flex-col items-center pt-[100px] pb-24 md:pb-32 lg:pb-40"
        style={{ background: '#05071A' }}
      >
        
        {/* BACKGROUND LAYERS */}
        {/* Layer 0: Base gradient */}
        <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #1E2A8A 0%, #0F1547 40%, #05071A 100%)' }} />

        {/* Layer 1: Vertical Panels */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[100%] z-[1] hidden md:flex items-end gap-[3px]">
          {/* Panel 1 */}
          <div className="w-[80px] h-[45%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1a2060 0%, #0d1240 100%)', borderRadius: '4px 4px 0 0', opacity: 0.6 }} />
          {/* Panel 2 */}
          <div className="w-[100px] h-[58%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1e2875 0%, #111650 100%)', borderRadius: '4px 4px 0 0', opacity: 0.75 }} />
          {/* Panel 3 */}
          <div className="w-[120px] h-[72%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #2335a0 0%, #141b6a 100%)', borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
          {/* Panel 4 (Center) */}
          <div className="w-[180px] h-[90%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #2d3db5 0%, #1a2480 50%, #0f1560 100%)', borderRadius: '4px 4px 0 0', opacity: 1, boxShadow: 'inset -4px 0 20px rgba(0,0,0,0.3), inset 4px 0 20px rgba(0,0,0,0.3)' }} />
          {/* Panel 5 */}
          <div className="w-[120px] h-[72%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #2335a0 0%, #141b6a 100%)', borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
          {/* Panel 6 */}
          <div className="w-[100px] h-[58%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1e2875 0%, #111650 100%)', borderRadius: '4px 4px 0 0', opacity: 0.75 }} />
          {/* Panel 7 */}
          <div className="w-[80px] h-[45%] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1a2060 0%, #0d1240 100%)', borderRadius: '4px 4px 0 0', opacity: 0.6 }} />
        </div>

        {/* Layer 2: Diagonal shadow band */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: 'linear-gradient(135deg, transparent 0%, transparent 30%, rgba(5,7,26,0.45) 45%, rgba(5,7,26,0.55) 55%, transparent 70%, transparent 100%)' }} />

        {/* Layer 3: Glow Orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-[3]" style={{ background: 'radial-gradient(circle, rgba(45,61,181,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] rounded-full pointer-events-none z-[3]" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Layer 4: Star Field */}
        <div className="absolute inset-0 z-[4] pointer-events-none opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* LAYER 5: Fade overlay at bottom transition */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] z-[5] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(5,7,26,0.0) 0%, rgba(5,7,26,0.8) 100%)' }} />

        {/* CONTENT ZONE */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-start pt-10 pb-0">
          
          {/* Top text block */}
          <RevealOnScroll preset="fadeIn" delay={0.1} duration={0.8} once={true} className="max-w-3xl mx-auto px-6 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-[#4B7BFF]/15 border border-[#4B7BFF]/40 backdrop-blur-[8px] rounded-full px-4 py-1.5 mx-auto mt-4">
              <Sparkles className="w-3 h-3 text-brand-300" />
              <span className="text-[12px] text-white/90 font-medium">Built for Rwanda's Growing Workforce</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4B7BFF] animate-pulse"></span>
            </div>

            {/* Headline */}
            <h1 className="text-[32px] md:text-[46px] font-[800] text-white leading-[1.1] mt-4">
              Hire Rwanda's Best Talent,<br />Faster Than Ever Before.
            </h1>

            {/* Subheading */}
            <p className="mt-4 text-[15px] md:text-[18px] text-white/60 leading-[1.7] max-w-xl mx-auto">
              Intore helps Rwandan companies screen, rank, and shortlist top candidates — so your team spends time on people, not paperwork.
            </p>
          </RevealOnScroll>

          {/* CTA Zone (vertical mid-hero) */}
          <RevealOnScroll preset="fadeUp" delay={0.4} duration={0.8} once={true} className="mt-6 text-center px-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="pulse-btn bg-[#4B7BFF] text-white px-7 py-3.5 rounded-xl font-semibold text-[15px] hover:brightness-110 transition-all">
                Start hiring smarter
              </Link>
              <button onClick={(e) => scrollToSection(e, 'testimonials')} className="bg-white/10 border border-white/20 backdrop-blur-[8px] text-white px-7 py-3.5 rounded-xl font-medium text-[15px] hover:bg-white/15 transition-all flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-white/80" />
                Watch a demo
              </button>
            </div>
            <p className="mt-3 text-[12px] text-white/35 relative z-10 mb-0">
              Free for 14 days · No credit card · Cancel anytime
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* CARDS INTERSECTION WRAPPER */}
      <div className="cards-intersection-wrapper relative z-[20] w-full max-w-[1200px] mx-auto mt-[-80px] md:mt-[-120px] lg:mt-[-180px] pb-0 h-auto md:h-[360px] px-6 lg:px-0 pointer-events-none">
        
        {/* Child relative container so absolute floating works cleanly within the max-w bounds */}
        <div className="relative w-full h-full pointer-events-auto">
          
          {/* LEFT CARD */}
          <div ref={parallaxRef1} className="hidden md:block absolute left-0 top-[40px] w-[220px] h-[240px] rounded-[16px] p-4 text-white z-[15]" 
               style={{ background: 'rgba(15,21,71,0.85)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'gentleFloat 5s ease-in-out infinite', ...({ '--card-rot': '-2deg' } as CSSProperties) }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></div>
              <span className="text-[11px] font-medium text-white/80">Live Screening</span>
            </div>
            <div className="mt-3">
              <div className="text-[32px] font-bold leading-none">247</div>
              <div className="text-[10px] text-white/50 mt-0.5">candidates screened today</div>
            </div>
            <div className="mt-4 flex items-end gap-1 h-[40px]">
              <div className="w-[8px] h-[60%] bg-brand-200 rounded-t-sm"></div>
              <div className="w-[8px] h-[80%] bg-brand-200 rounded-t-sm"></div>
              <div className="w-[8px] h-[45%] bg-brand-200 rounded-t-sm"></div>
              <div className="w-[8px] h-[100%] bg-brand-500 rounded-t-sm"></div>
              <div className="w-[8px] h-[70%] bg-brand-200 rounded-t-sm"></div>
            </div>
            <div className="mt-2 text-[10px] text-white/40">Last 5 days</div>
          </div>

          {/* CENTER CARD (Largest - Straddling Boundary) */}
          <RevealOnScroll
            preset="scaleUp"
            delay={0.6}
            duration={1.0}
            className="relative w-full md:w-[85vw] lg:w-[min(720px,86vw)] bg-white rounded-[20px] flex flex-col md:flex-row overflow-hidden mx-auto z-[20]"
            style={{
              boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.15), 0 40px 80px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.08)',
              maxHeight: '320px',
            }}
          >
            
            
            <div className="hidden md:block flex-[0_0_160px] p-4 border-r border-[#F1F5F9] bg-white">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#4B7BFF] animate-pulse"></div>
                <span className="text-[10px] text-slate-500 font-medium">Live Screening</span>
              </div>
              <div className="mt-3">
                <div className="text-[32px] font-bold text-slate-900 leading-none">247</div>
                <div className="text-[10px] text-slate-400 mt-0.5">candidates screened today</div>
              </div>
              <div className="mt-4 flex items-end gap-1 h-[32px]">
                <div className="w-[6px] h-[60%] bg-brand-200 rounded-t-sm"></div>
                <div className="w-[6px] h-[80%] bg-brand-200 rounded-t-sm"></div>
                <div className="w-[6px] h-[45%] bg-brand-200 rounded-t-sm"></div>
                <div className="w-[6px] h-[100%] bg-brand-500 rounded-t-sm"></div>
                <div className="w-[6px] h-[70%] bg-brand-200 rounded-t-sm"></div>
              </div>
              <div className="mt-2 text-[9px] text-slate-400">Last 5 days</div>
            </div>

            
            <div className="flex-1 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span className="text-[12px] text-slate-700 font-semibold">Intore AI</span>
                </div>
                <div className="bg-[#4B7BFF]/10 border border-[#4B7BFF]/25 text-[#2D3DB5] text-[9px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-[4px] h-[4px] rounded-full bg-[#4B7BFF]"></div>
                  Live
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[16px] font-bold text-slate-900 leading-tight">Scanning 18 candidates<br/><span className="text-brand-500">In Real-Time</span></div>
              </div>
              <div className="mt-3 flex items-center">
                <div className="relative w-[48px] h-[48px] flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90 origin-center" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="25" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="28" cy="28" r="25" fill="none" stroke="var(--brand-500)" strokeWidth="5" strokeDasharray="157" strokeDashoffset="47" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[12px] font-bold text-slate-800">70%</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-[11px] text-slate-500">AI match confidence</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">across postings</div>
                  <div className="mt-1 flex gap-1.5 flex-wrap">
                    <span className="bg-brand-50 text-brand-600 text-[9px] rounded-full px-1.5 py-0.5">React</span>
                    <span className="bg-brand-50 text-brand-600 text-[9px] rounded-full px-1.5 py-0.5">TS</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F1F5F9] space-y-1">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-[20px] h-[20px] rounded-full bg-brand-500 text-white flex items-center justify-center text-[9px] font-bold">AU</div>
                    <span className="text-[11px] text-slate-700 font-medium">A. Uwimana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[36px] h-[4px] rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-500 w-[94%]"></div>
                    </div>
                    <span className="text-[10px] font-semibold text-brand-600 w-[24px] text-right">94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[9px] font-bold">JN</div>
                    <span className="text-[11px] text-slate-700 font-medium">J. Nshimiyimana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[36px] h-[4px] rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-500 w-[87%]"></div>
                    </div>
                    <span className="text-[10px] font-semibold text-brand-600 w-[24px] text-right">87%</span>
                  </div>
                </div>
              </div>
            </div>

        
            <div className="flex-[0_0_180px] p-4 text-white flex flex-col" style={{ background: 'linear-gradient(160deg, #0F1547 0%, #05071A 100%)' }}>
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-[#FBBF24]">★</span>
                <span className="text-[10px] text-white/80 font-medium">Best Match Found</span>
              </div>
              <div className="mt-2 text-[8px] text-white/40 uppercase tracking-wide">Last Update</div>
              <div className="mt-1 text-[16px] font-bold text-white leading-tight">Amara Uwimana</div>
              <div className="mt-0.5 text-[10px] text-white/55">Senior Software Engineer</div>
              <div className="mt-2 flex items-baseline">
                <span className="text-[28px] font-bold text-white">94%</span>
                <span className="text-[9px] text-white/45 ml-1">Score</span>
              </div>
              <button className="mt-3 w-[28px] h-[28px] rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <div className="relative mt-auto pt-3 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center">
                  <img src="https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=60&h=60&fit=crop&crop=face" className="w-[24px] h-[24px] rounded-full border-2 border-[#0F1547] object-cover" />
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face" className="w-[24px] h-[24px] rounded-full border-2 border-[#0F1547] object-cover -ml-[8px]" />
                  <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face" className="w-[24px] h-[24px] rounded-full border-2 border-[#0F1547] object-cover -ml-[8px]" />
                  <div className="w-[24px] h-[24px] rounded-full border-2 border-[#0F1547] bg-brand-500 text-white text-[8px] font-bold flex items-center justify-center -ml-[8px]">+24</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/80 font-medium mt-1">98% Satisfied</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* RIGHT CARD */}
          <div ref={parallaxRef2} className="hidden md:block absolute right-0 top-[60px] w-[200px] h-[200px] rounded-[16px] p-4 text-white z-[15]"
               style={{ background: 'rgba(15,21,71,0.85)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'gentleFloat 4.5s ease-in-out infinite 0.5s', ...({ '--card-rot': '2deg' } as CSSProperties) }}>
            <div className="text-[32px] font-bold text-white leading-none">2.4×</div>
            <div className="text-[12px] text-white/60 mt-1">Faster hiring</div>
            <div className="text-[11px] text-white/40 mt-0.5">vs. manual screening</div>
            <div className="mt-3">
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                <path d="M2 18 L12 10 L22 14 L38 2" stroke="#4B7BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* SMALL FLOATING BADGES */}
          <div className="hidden lg:flex absolute left-[40px] top-[180px] w-[160px] rounded-[16px] p-[14px] text-white items-center gap-2 z-[15]"
               style={{ background: 'rgba(15,21,71,0.85)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'gentleFloat 5.5s ease-in-out infinite 1s', ...({ '--card-rot': '-3deg' } as CSSProperties) }}>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <div>
              <span className="block text-[11px] font-medium leading-tight">Bias Check Passed</span>
            </div>
          </div>

          <div className="hidden md:flex lg:hidden xl:flex absolute left-[80px] bottom-[20px] lg:bottom-[40px] w-[140px] items-center gap-2 bg-white border border-[#E2E8F0] shadow-md rounded-xl p-2 z-[15]"
               style={{ animation: 'gentleFloat 5s ease-in-out infinite 0.8s', ...({ '--card-rot': '0deg' } as CSSProperties) }}>
            <div className="text-amber-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <div>
              <span className="block text-[10px] text-slate-800 font-semibold leading-tight">AI Screened</span>
            </div>
          </div>

          <div className="hidden md:flex lg:hidden xl:flex absolute right-[60px] lg:right-[80px] bottom-[10px] lg:bottom-[30px] w-[140px] items-center gap-2 bg-white border border-[#E2E8F0] shadow-md rounded-xl p-2 z-[15]"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite 1.2s', ...({ '--card-rot': '0deg' } as CSSProperties) }}>
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            <div>
              <span className="block text-[10px] text-slate-800 font-semibold leading-tight">Ready to Int</span>
            </div>
          </div>

          <div className="hidden lg:flex absolute right-[80px] top-[-30px] h-[80px] w-[160px] rounded-[16px] p-[12px] items-center gap-3 text-white z-[15]"
               style={{ background: 'rgba(15,21,71,0.85)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'gentleFloat 6s ease-in-out infinite 0.3s', ...({ '--card-rot': '0deg' } as CSSProperties) }}>
            <img src="https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=80&h=80&fit=crop&crop=face" className="w-[28px] h-[28px] rounded-full object-cover" />
            <div>
              <div className="text-[10px] font-medium leading-tight">Amara J.</div>
              <div className="text-[9px] text-white/40 leading-tight mt-0.5">Director</div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3 — SOCIAL PROOF / LOGOS BAR */}
      <section className="bg-white pt-[40px] pb-14 px-6 border-b border-slate-100 relative z-[10]">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll preset="fadeIn" delay={0.1}>
            <p className="text-[13px] text-slate-400 font-medium uppercase tracking-wide text-center">
              TRUSTED BY HIRING TEAMS ACROSS RWANDA
            </p>
          </RevealOnScroll>
          
          <RevealOnScroll preset="fadeUp" className="mt-6 flex flex-wrap justify-center items-center gap-10" staggerChildren={0.08}>
            {['Inyarwanda Ltd', 'Kigali Tech Hub', 'RwandAir', 'BK Capital', 'MTN Rwanda', 'Equity Bank Rwanda'].map(name => (
              <RevealChild key={name} preset="blurIn" as="span">
                <span className="text-[18px] font-semibold text-slate-300 hover:text-slate-500 transition-colors cursor-default">
                  {name}
                </span>
              </RevealChild>
            ))}
          </RevealOnScroll>
          
          <RevealOnScroll preset="fadeUp" delay={0.2} className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-[48px] pt-10">
            <div className="text-center">
              <div className="text-[32px] font-bold text-brand-600 leading-none"><AnimatedCounter target={18} suffix=" min" className="text-[32px] font-bold text-brand-600 leading-none" /></div>
              <div className="text-[13px] text-slate-500 mt-1">Average time to shortlist</div>
            </div>
            <div className="hidden md:block w-[1px] h-10 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-[32px] font-bold text-brand-600 leading-none"><AnimatedCounter target={94} suffix="%" className="text-[32px] font-bold text-brand-600 leading-none" /></div>
              <div className="text-[13px] text-slate-500 mt-1">Recruiter satisfaction</div>
            </div>
            <div className="hidden md:block w-[1px] h-10 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-[32px] font-bold text-brand-600 leading-none"><AnimatedCounter target={3.2} suffix="×" className="text-[32px] font-bold text-brand-600 leading-none" /></div>
              <div className="text-[13px] text-slate-500 mt-1">Faster than manual review</div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 4 — FEATURES */}
      <section id="features" className="bg-[#F8FAFF] py-24 px-6">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll preset="fadeUp" className="text-center">
            <h2 className="text-[12px] text-[#4B7BFF] font-semibold uppercase tracking-widest">
              Features
            </h2>
            <h3 className="mt-3 text-[28px] md:text-[38px] font-bold text-slate-900">
              Everything Rwandan hiring teams need to hire smarter.
            </h3>
            <p className="mt-3 text-[16px] text-slate-500 max-w-lg mx-auto">
              Intore handles the analysis. You make the decisions.
            </p>
          </RevealOnScroll>

          {/* LARGE FEATURE BLOCK 1 */}
          <RevealOnScroll preset="slideLeft" delay={0.15} className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5 order-2 md:order-1">
              {/* Product Mockup Image built in HTML/CSS */}
              <div className="bg-brand-50 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-full bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-xl overflow-hidden"
                     style={{ transform: 'perspective(1200px) rotateY(-8deg) rotateX(2deg)' }}>
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Mock Candidates */}
                    {[
                      { rank: 1, initial: 'AU', name: 'Amara U.', score: 94, s: 'React Expert', g: 'No AWS', conf: 'High', color: 'bg-[#4B7BFF]' },
                      { rank: 2, initial: 'JN', name: 'Jean N.', score: 88, s: 'System Design', g: 'Leadership', conf: 'High', color: 'bg-teal-500' },
                      { rank: 3, initial: 'CM', name: 'Chantal M.', score: 85, s: 'Clean Code', g: 'GraphQL', conf: 'High', color: 'bg-amber-500' },
                      { rank: 4, initial: 'EB', name: 'Eric B.', score: 67, s: 'JS Core', g: 'Typescript', conf: 'Med', color: 'bg-rose-500' },
                      { rank: 5, initial: 'MH', name: 'Marie H.', score: 64, s: 'Vue.js', g: 'React', conf: 'Low', color: 'bg-indigo-500' }
                    ].map(c => (
                      <div key={c.rank} className="flex flex-wrap sm:flex-nowrap items-center gap-3 border border-slate-100 rounded-xl p-2 bg-white hover:bg-slate-50">
                        <span className="text-[12px] font-bold text-slate-400 w-4 pl-1">#{c.rank}</span>
                        <div className={`w-7 h-7 rounded-full ${c.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {c.initial}
                        </div>
                        <div className="w-24">
                          <div className="text-[12px] font-semibold text-slate-900">{c.name}</div>
                        </div>
                        <div className="flex-1 w-full mx-2 mt-2 sm:mt-0 flex gap-1 flex-wrap">
                           <span className="bg-emerald-50 text-emerald-700 rounded text-[9px] px-1.5 py-0.5 border border-emerald-100">{c.s}</span>
                           <span className="bg-red-50 text-red-700 rounded text-[9px] px-1.5 py-0.5 border border-red-100">{c.g}</span>
                        </div>
                        <div className="text-right shrink-0">
                           <div className={cn("text-[13px] font-bold", c.score >= 80 ? "text-teal-600" : c.score >= 65 ? "text-amber-500" : "text-red-500")}>{c.score}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-7 order-1 md:order-2 md:pl-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-[11px] font-medium">
                AI Screening
              </div>
              <h4 className="text-[28px] font-bold text-slate-900 mt-3 leading-tight">
                From 200 applicants to a ranked top 10 — in minutes.
              </h4>
              <p className="text-[16px] text-slate-600 mt-4 leading-[1.7]">
                Intore analyses every candidate against your job requirements and produces a ranked shortlist with match scores, key strengths, and critical gaps — all explained in plain language.
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  "Scores every applicant 0–100 against your criteria",
                  "Highlights strengths and gaps per candidate",
                  "Flags potential bias in your shortlist automatically"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-[16px] h-[16px] text-[#4B7BFF] shrink-0 mt-0.5" />
                    <span className="text-[14px] text-slate-700">{text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-block mt-6 text-[14px] font-medium text-[#4B7BFF] hover:text-[#2D3DB5] transition-colors">
                See how screening works →
              </Link>
            </div>
          </RevealOnScroll>

          {/* LARGE FEATURE BLOCK 2 */}
          <RevealOnScroll preset="slideRight" delay={0.15} className="mt-20 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 md:pr-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-[11px] font-medium">
                AI Chat Assistant
              </div>
              <h4 className="text-[28px] font-bold text-slate-900 mt-3 leading-tight">
                Ask your shortlist anything. Get answers instantly.
              </h4>
              <p className="text-[16px] text-slate-600 mt-4 leading-[1.7]">
                Once screening is complete, Intore's AI assistant knows your entire candidate pool. Ask it to compare the top three, surface near-misses, or explain why someone ranked where they did.
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  "Context-aware to your specific job and applicants",
                  "Suggestion chips for common recruiter questions",
                  "Streaming responses — no waiting for full answers"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-[16px] h-[16px] text-brand-500 shrink-0 mt-0.5" />
                    <span className="text-[14px] text-slate-700">{text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-block mt-6 text-[14px] font-medium text-[#4B7BFF] hover:text-[#2D3DB5] transition-colors">
                Explore the chat feature →
              </Link>
            </div>
            
            <div className="md:col-span-5">
              {/* Mock Chat Panel */}
              <div className="bg-brand-50 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-full bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-xl overflow-hidden"
                     style={{ transform: 'perspective(1200px) rotateY(8deg) rotateX(2deg)' }}>
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] font-medium text-slate-900">AI Assistant</span>
                  </div>
                  <div className="p-4 space-y-4 min-h-[220px]">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-brand-50 flex items-center justify-center border border-brand-100 shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                      </div>
                      <div className="bg-brand-50 border border-brand-200 text-slate-700 p-3 rounded-xl rounded-tl-sm text-[13px] leading-relaxed">
                        Screening complete! Amara Uwimana is your top match at 94%. Shall I compare the top 3?
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 mt-0.5"></div>
                      <div className="bg-brand-500 text-white p-3 rounded-xl rounded-tr-sm text-[13px] leading-relaxed shadow-sm">
                        Compare top 3
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-600 bg-white border-slate-200 border px-2.5 py-1.5 rounded-full shadow-sm">Who almost qualified?</span>
                      <span className="text-[10px] text-slate-600 bg-white border-slate-200 border px-2.5 py-1.5 rounded-full shadow-sm">Show gaps</span>
                      <span className="text-[10px] text-slate-600 bg-white border-slate-200 border px-2.5 py-1.5 rounded-full shadow-sm">Summarize</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg h-9 flex items-center px-3 opacity-60">
                      <span className="text-[12px] text-slate-400">Ask a question...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Feature Grid */}
          <RevealOnScroll preset="scaleUp" delay={0.1} className="mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" staggerChildren={0.1}>
            
            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <Users className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Structured profiles</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Native support for Umurava platform profiles and external resumes — both handled automatically.
                </p>
              </div>
            </RevealChild>

            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Bias detection</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Automatic alerts when rankings skew toward credentials over demonstrated skills.
                </p>
              </div>
            </RevealChild>

            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <FileText className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Explainable scores</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Every ranking comes with full AI reasoning — no black boxes, no guesswork.
                </p>
              </div>
            </RevealChild>

            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <Upload className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Bulk import</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Drag in a CSV or a folder of PDFs. Intore parses and normalises everything.
                </p>
              </div>
            </RevealChild>

            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <Scale className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Compliance ready</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Built with Colorado AI Act, GDPR, and California ADS regulations in mind from day one.
                </p>
              </div>
            </RevealChild>

            <RevealChild preset="fadeUp">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="w-[40px] h-[40px] rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <MessageSquare className="w-[20px] h-[20px] text-[#4B7BFF]" />
                </div>
                <h4 className="text-[15px] font-semibold text-slate-900 mt-4">Chat assistant</h4>
                <p className="text-[14px] text-slate-500 mt-2 leading-[1.6]">
                  Ask natural-language follow-up questions about your shortlist after every screening run.
                </p>
              </div>
            </RevealChild>

          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 5 — TESTIMONIALS */}
      <section id="testimonials" className="bg-white py-24 px-6 border-b border-slate-100">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll preset="fadeUp" className="text-center">
            <h2 className="text-[12px] text-[#4B7BFF] font-semibold uppercase tracking-widest">
              Testimonials
            </h2>
            <h3 className="mt-3 text-[36px] font-bold text-slate-900">
              Recruiters who've made the switch.
            </h3>
            <p className="mt-3 text-[16px] text-slate-500">
              Real teams. Real results. Real hiring decisions.
            </p>
          </RevealOnScroll>

          <RevealOnScroll preset="fadeUp" delay={0.1} className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6" staggerChildren={0.15}>
            
            <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-8 hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="flex gap-1">
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
              </div>
              <div className="mt-4 text-[16px] text-slate-700 leading-[1.7] italic">
                <span className="text-brand-100 text-[48px] font-serif leading-[0] float-left mr-1 relative top-4">“</span>
                We used to spend an entire week reviewing CVs for every open role. With Intore, we had a ranked shortlist before our Monday standup. The AI reasoning is clear enough that I can defend every decision to our MD.
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <img src="https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=80&h=80&fit=crop&crop=face" alt="Amara" className="w-[44px] h-[44px] rounded-full object-cover border-2 border-white ring-2 ring-brand-100" />
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">Claudine Uwimana</div>
                  <div className="text-[13px] text-slate-500">Head of Talent · Inyarwanda Ltd · Kigali</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-8 hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="flex gap-1">
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
              </div>
              <div className="mt-4 text-[16px] text-slate-700 leading-[1.7] italic">
                <span className="text-brand-100 text-[48px] font-serif leading-[0] float-left mr-1 relative top-4">“</span>
                The bias detection changed how our team thinks about hiring. We were unknowingly filtering out strong candidates from upcountry provinces. Intore surfaced talent we would have missed completely.
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face" alt="David" className="w-[44px] h-[44px] rounded-full object-cover border-2 border-white ring-2 ring-brand-100" />
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">Patrick Nshimiyimana</div>
                  <div className="text-[13px] text-slate-500">Recruitment Lead · Kigali Tech Hub</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-8 hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="flex gap-1">
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
                <span className="text-[14px] text-[#FBBF24]">★</span>
              </div>
              <div className="mt-4 text-[16px] text-slate-700 leading-[1.7] italic">
                <span className="text-brand-100 text-[48px] font-serif leading-[0] float-left mr-1 relative top-4">“</span>
                Our time-to-hire dropped from five weeks to just under two. For a company growing as fast as we are across Rwanda, that speed is everything.
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face" alt="Priya" className="w-[44px] h-[44px] rounded-full object-cover border-2 border-white ring-2 ring-brand-100" />
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">Diane Mukasine</div>
                  <div className="text-[13px] text-slate-500">People & Culture · MTN Rwanda · Kigali</div>
                </div>
              </div>
            </div>

          </RevealOnScroll>

          <RevealOnScroll preset="scaleUp" delay={0.15} className="mt-16 bg-brand-50 border-[1.5px] border-brand-100 rounded-2xl py-12 px-8 text-center max-w-4xl mx-auto shadow-sm">
            <h3 className="text-[28px] font-bold text-slate-900">Ready to hire smarter across Rwanda?</h3>
            <p className="mt-2 text-[15px] text-slate-500">Join leading Rwandan companies already using Intore to find and hire top local talent.</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="bg-[#0F1547] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#1E2A8A] transition-colors w-full sm:w-auto border border-[rgba(75,123,255,0.3)]">
                Start for free today
              </Link>
              <button className="bg-white border border-slate-300 text-slate-700 px-8 py-3.5 rounded-xl font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto">
                Schedule a demo
              </button>
            </div>
            <p className="text-[12px] text-slate-400 mt-3">No credit card · 14-day trial · Cancel anytime</p>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 6 — FOOTER */}
      <Footer />
    </div>
  );
}
