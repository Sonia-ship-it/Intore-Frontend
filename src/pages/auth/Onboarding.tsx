'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { IntoreMark } from '@/components/branding/IntoreMark';
import { cn } from '@/lib/utils';

// ── Animated SVG illustrations ────────────────────────────────────────────────

function ClockSvg() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      {/* Outer glow */}
      <circle cx="100" cy="100" r="80" fill="rgba(75,123,255,0.08)" />
      {/* Clock face */}
      <circle cx="100" cy="100" r="60" fill="rgba(15,21,71,0.9)" stroke="rgba(75,123,255,0.4)" strokeWidth="2" />
      {/* Hour marks */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const r = deg * Math.PI / 180;
        const x1 = 100 + 48 * Math.sin(r);
        const y1 = 100 - 48 * Math.cos(r);
        const x2 = 100 + (i % 3 === 0 ? 40 : 44) * Math.sin(r);
        const y2 = 100 - (i % 3 === 0 ? 40 : 44) * Math.cos(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(75,123,255,0.5)" strokeWidth={i % 3 === 0 ? 2 : 1} />;
      })}
      {/* Minute hand — animated */}
      <line x1="100" y1="100" x2="100" y2="58" stroke="#4B7BFF" strokeWidth="2" strokeLinecap="round"
        style={{ transformOrigin: '100px 100px', animation: 'spin 10s linear infinite' }} />
      {/* Hour hand */}
      <line x1="100" y1="100" x2="120" y2="75" stroke="white" strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: '100px 100px', animation: 'spin 120s linear infinite' }} />
      {/* Center dot */}
      <circle cx="100" cy="100" r="4" fill="#4B7BFF" />
      {/* Floating time chips */}
      <g style={{ animation: 'floatUp 3s ease-in-out infinite' }}>
        <rect x="130" y="60" width="50" height="22" rx="11" fill="rgba(75,123,255,0.2)" stroke="rgba(75,123,255,0.4)" strokeWidth="1" />
        <text x="155" y="75" textAnchor="middle" fill="#4B7BFF" fontSize="10" fontWeight="600">3 days</text>
      </g>
      <g style={{ animation: 'floatUp 3s ease-in-out infinite 1s' }}>
        <rect x="20" y="80" width="50" height="22" rx="11" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
        <text x="45" y="95" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="600">7 hours</text>
      </g>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes floatUp { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </svg>
  );
}

function PileSvg() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      <circle cx="100" cy="100" r="80" fill="rgba(139,92,246,0.08)" />
      {/* Stack of Resumes */}
      {[0,1,2,3,4].map((i) => (
        <g key={i} style={{ animation: `slideIn 0.5s ease-out ${i * 0.1}s both` }}>
          <rect x={30 + i * 3} y={60 + i * 14} width="120" height="80" rx="6"
            fill={i === 4 ? 'rgba(15,21,71,0.95)' : `rgba(15,21,71,${0.5 + i * 0.1})`}
            stroke={i === 4 ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.05)'} strokeWidth="1" />
          {i === 4 && <>
            <rect x="42" y="74" width="60" height="4" rx="2" fill="rgba(139,92,246,0.7)" />
            <rect x="42" y="84" width="90" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
            <rect x="42" y="92" width="75" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
            <rect x="42" y="100" width="80" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
            <circle cx="130" cy="110" r="12" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" />
            <text x="130" y="114" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="700">?</text>
          </>}
        </g>
      ))}
      {/* Count badge */}
      <g style={{ animation: 'bounce 1s ease-in-out infinite' }}>
        <circle cx="155" cy="55" r="18" fill="#8b5cf6" />
        <text x="155" y="60" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">200</text>
      </g>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
      `}</style>
    </svg>
  );
}

function BiasScaleSvg() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      <circle cx="100" cy="100" r="80" fill="rgba(16,185,129,0.08)" />
      {/* Scale beam */}
      <rect x="95" y="55" width="10" height="80" rx="5" fill="rgba(255,255,255,0.1)" />
      <rect x="40" y="90" width="120" height="6" rx="3" fill="rgba(255,255,255,0.15)"
        style={{ transformOrigin: '100px 93px', animation: 'tilt 3s ease-in-out infinite' }} />
      {/* Left pan */}
      <g style={{ transformOrigin: '65px 93px', animation: 'tilt 3s ease-in-out infinite' }}>
        <line x1="65" y1="93" x2="55" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <line x1="65" y1="93" x2="75" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <ellipse cx="65" cy="122" rx="18" ry="5" fill="rgba(239,68,68,0.3)" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" />
        <text x="65" y="126" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="600">Bias</text>
      </g>
      {/* Right pan */}
      <g style={{ transformOrigin: '135px 93px', animation: 'tiltR 3s ease-in-out infinite' }}>
        <line x1="135" y1="93" x2="125" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <line x1="135" y1="93" x2="145" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <ellipse cx="135" cy="117" rx="18" ry="5" fill="rgba(16,185,129,0.3)" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" />
        <text x="135" y="121" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="600">Fair</text>
      </g>
      {/* AI shield */}
      <g style={{ animation: 'pulse 2s ease-in-out infinite' }}>
        <path d="M100 30 L115 38 L115 52 Q115 62 100 68 Q85 62 85 52 L85 38 Z" fill="rgba(75,123,255,0.2)" stroke="#4B7BFF" strokeWidth="1.5" />
        <text x="100" y="53" textAnchor="middle" fill="#4B7BFF" fontSize="10" fontWeight="700">Intore</text>
      </g>
      <style>{`
        @keyframes tilt { 0%,100% { transform:rotate(-8deg); } 50% { transform:rotate(8deg); } }
        @keyframes tiltR { 0%,100% { transform:rotate(8deg); } 50% { transform:rotate(-8deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </svg>
  );
}

function AllSetSvg() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      <circle cx="100" cy="100" r="80" fill="rgba(16,185,129,0.08)" />
      {/* Outer ring */}
      <circle cx="100" cy="100" r="55" stroke="rgba(16,185,129,0.3)" strokeWidth="2" strokeDasharray="8 4" style={{ animation: 'spin 20s linear infinite' }} />
      {/* Check circle */}
      <circle cx="100" cy="100" r="40" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2" />
      <path d="M82 100 L95 113 L118 87" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: 'draw 0.8s ease-out 0.3s both' }} />
      {/* Sparkles */}
      {[[40,45],[160,55],[35,155],[165,145],[100,30]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#10b981" opacity="0.6"
          style={{ animation: `twinkle 1.5s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes draw { from { stroke-dashoffset:50; } to { stroke-dashoffset:0; } }
        @keyframes twinkle { 0%,100% { opacity:0.2; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.3); } }
      `}</style>
    </svg>
  );
}

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'time',
    accent: '#4B7BFF',
    bg: 'from-[#0F1547] to-[#1a2060]',
    Illustration: ClockSvg,
    question: 'How long does it take you to screen 200 Resumes?',
    options: ['Less than a day', '2–3 days', 'A full week', 'More than a week'],
    punchline: 'Intore does it in under 3 minutes.',
    punchColor: 'text-[#4B7BFF]',
  },
  {
    id: 'volume',
    accent: '#8b5cf6',
    bg: 'from-[#1a0f47] to-[#2a1060]',
    Illustration: PileSvg,
    question: 'How many applications do you receive per job posting?',
    options: ['Under 50', '50–150', '150–500', '500+'],
    punchline: 'We rank every single one fairly and instantly.',
    punchColor: 'text-violet-400',
  },
  {
    id: 'bias',
    accent: '#10b981',
    bg: 'from-[#0f2a1f] to-[#0f1547]',
    Illustration: BiasScaleSvg,
    question: 'Are you confident your screening process is free from bias?',
    options: ['Very confident', 'Somewhat confident', 'Not sure', 'Definitely not'],
    punchline: 'Intore flags bias automatically  so you hire fairly.',
    punchColor: 'text-emerald-400',
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-2 = slides, 3 = all set
  const [selected, setSelected] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const isAllSet = step === SLIDES.length;
  const slide = SLIDES[step];

  const advance = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setSelected(null);
      setAnimating(false);
    }, 300);
  };

  useEffect(() => {
    if (isAllSet) {
      const t = setTimeout(() => router.push('/recruiter/dashboard'), 3500);
      return () => clearTimeout(t);
    }
  }, [isAllSet]);

  // ── All set screen ──────────────────────────────────────────────────────────
  if (isAllSet) {
    return (
      <div className="min-h-screen bg-[#05071A] flex items-center justify-center p-8">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-48 h-48 mx-auto">
            <AllSetSvg />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">You're all set!</h1>
            <p className="text-slate-400 text-lg">Your Intore workspace is ready. Let's start hiring smarter.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Taking you to your dashboard...
          </div>
          <div className="w-48 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ animation: 'fillBar 3.5s linear forwards' }} />
          </div>
        </div>
        <style>{`@keyframes fillBar { from { width:0%; } to { width:100%; } }`}</style>
      </div>
    );
  }

  // ── Slide screen ────────────────────────────────────────────────────────────
  return (
    <div className={cn('min-h-screen bg-gradient-to-br flex flex-col', slide.bg)}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-6">
        <div className="flex items-center gap-2">
          <IntoreMark className="w-7 h-7 text-[#4B7BFF]" />
          <span className="text-white font-bold text-lg">Intore</span>
        </div>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i === step ? 'w-8' : 'w-3', i < step ? 'bg-white/60' : i === step ? 'bg-white' : 'bg-white/20')} />
          ))}
        </div>
        <button onClick={() => router.push('/recruiter/dashboard')} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className={cn('flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-8 py-10 transition-opacity duration-300', animating ? 'opacity-0' : 'opacity-100')}>

        {/* Illustration */}
        <div className="w-56 h-56 lg:w-72 lg:h-72 shrink-0">
          <slide.Illustration />
        </div>

        {/* Question + options */}
        <div className="max-w-lg w-full space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: slide.accent }}>
              Quick question {step + 1} of {SLIDES.length}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              {slide.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slide.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                className={cn(
                  'px-5 py-3.5 rounded-xl text-sm font-semibold text-left transition-all border',
                  selected === opt
                    ? 'text-white border-transparent shadow-lg'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                )}
                style={selected === opt ? { background: slide.accent, borderColor: slide.accent } : {}}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Punchline — appears after selection */}
          <div className={cn('transition-all duration-500 overflow-hidden', selected ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0')}>
            <p className={cn('text-lg font-bold', slide.punchColor)}>
              ✦ {slide.punchline}
            </p>
          </div>

          <button
            onClick={advance}
            disabled={!selected}
            className={cn(
              'flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all',
              selected ? 'opacity-100 shadow-lg hover:scale-105' : 'opacity-30 cursor-not-allowed'
            )}
            style={{ background: selected ? slide.accent : '#4B7BFF' }}
          >
            {step === SLIDES.length - 1 ? 'See my workspace' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
