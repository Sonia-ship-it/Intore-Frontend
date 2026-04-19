import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useCallback, useRef } from "react";
import Lenis from "lenis";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import "@/index.css";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function NextApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scrolling once
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      if ((window as any).lenis === lenis) {
        delete (window as any).lenis;
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const forceScrollTop = useCallback(() => {
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, []);

  // On EVERY route change: force scroll to top before and after paint
  useEffect(() => {
    const handleStart = () => {
      forceScrollTop();
    };

    const handleComplete = () => {
      forceScrollTop();
      requestAnimationFrame(forceScrollTop);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
    };
  }, [router.events, forceScrollTop]);

  // Initial load
  useEffect(() => {
    forceScrollTop();
  }, [router.asPath, forceScrollTop]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* Simple CSS animation wrap, solves the complex Framer unmount scroll bug completely */}
          <div key={router.asPath} className="animate-page-in">
            <Component {...pageProps} />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
