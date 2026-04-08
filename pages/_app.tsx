import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useCallback, useRef } from "react";
import Lenis from "lenis";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import "@/index.css";

const queryClient = new QueryClient();

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

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /**
   * Aggressively resets scroll position to the very top.
   * Uses both Lenis (if available) AND native scroll methods
   * to guarantee scroll is at 0 even during animation frames.
   */
  const forceScrollTop = useCallback(() => {
    if (typeof window === "undefined") return;

    // Immediate native reset – doesn't rely on Lenis
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also tell Lenis to jump to 0 without animating
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
      // Immediately on route complete
      forceScrollTop();

      // After a microtask (React flush)
      Promise.resolve().then(forceScrollTop);

      // After the first paint frame
      requestAnimationFrame(() => {
        forceScrollTop();
        // And one more frame after layout settles
        requestAnimationFrame(forceScrollTop);
      });
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
    };
  }, [router.events, forceScrollTop]);

  // Also force scroll top on initial mount and on path change
  useEffect(() => {
    forceScrollTop();
    requestAnimationFrame(forceScrollTop);
  }, [router.asPath, forceScrollTop]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={forceScrollTop}
        >
          {/*
            CRITICAL: No `y` offset or `scale` in initial/exit states.
            A y displacement during framer-motion's animation causes
            the browser to miscalculate scroll position on mount,
            landing the viewport at the footer. Only opacity + blur
            is safe for page-level transitions.
          */}
          <motion.div
            key={router.asPath}
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "opacity, filter" }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
