"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CinematicHeroProps {
  loginHref: string;
  dict: {
    eyebrow: string;
    card: string;
    headline1_line1: string;
    headline1_line2: string;
    headline2_line1: string;
    headline2_line2: string;
    nav: string[];
    marquee: string[];
    cta: string;
    priceAmount: string;
    priceNote: string;
  };
}

export default function CinematicHero({ loginHref, dict }: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const proxyRef = useRef({ f: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  const FRAME_COUNT = 380;
  const PAD_SIZE = 3;
  const frameSrc = (idx: number) =>
    `/.tmp/scroll-journey/chromatic-journey/images/frames/f_${String(idx + 1).padStart(
      PAD_SIZE,
      "0"
    )}.jpg`;

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Preloading image frames client-side
  useEffect(() => {
    if (reducedMotion) {
      setLoading(false);
      return;
    }

    let loaded = 0;
    const images: HTMLImageElement[] = [];

    const handleLoad = () => {
      loaded++;
      setLoadedCount(loaded);
      
      // Hide loader as soon as the first critical 24 frames are loaded
      if (loaded === Math.min(24, FRAME_COUNT)) {
        setLoading(false);
      }
      
      // Force refresh ScrollTrigger once ALL frames are loaded to avoid alignment bugs
      if (loaded === FRAME_COUNT) {
        ScrollTrigger.refresh();
      }
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = handleLoad;
      img.onerror = handleLoad; // avoid freezing on loading error
      img.src = frameSrc(i);
      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      // Cleanup image loaders if component unmounts
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [reducedMotion]);

  // Handle canvas fit and rendering
  const draw = (idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[Math.max(0, Math.min(FRAME_COUNT - 1, idx | 0))];
    if (!img || !img.complete || !img.naturalWidth) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);

    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;

    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  // Handle window resizing
  useEffect(() => {
    if (reducedMotion || loading) return;
    const handleResize = () => draw(proxyRef.current.f);
    window.addEventListener("resize", handleResize);
    // Draw initial frame
    draw(0);
    return () => window.removeEventListener("resize", handleResize);
  }, [reducedMotion, loading]);

  // GSAP ScrollTrigger timeline activation
  useLayoutEffect(() => {
    if (reducedMotion || loading || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const lastFrame = FRAME_COUNT - 1;
      const runway = lastFrame * 16; // ~16px of scroll runway per frame for buttery smoothness

      proxyRef.current.f = 0;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${runway}`,
          scrub: 0.6, // smooth elastical scrubbing delay
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        proxyRef.current,
        {
          f: lastFrame,
          ease: "none",
          onUpdate: () => {
            draw(proxyRef.current.f);
          },
        },
        0
      )
        .to(".cinematic-hint", { opacity: 0, duration: 0.02 }, 0)
        // Frosted card reveals at 7% scroll, exits at 22%
        .fromTo(
          ".cinematic-card",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" },
          0.07
        )
        .to(
          ".cinematic-card",
          { opacity: 0, y: -40, duration: 0.06, ease: "power2.in" },
          0.22
        )
        // Mid Headline (headline1) reveals at 42% scroll, exits at 58%
        .fromTo(
          ".cinematic-h1",
          { opacity: 0, y: 80, letterSpacing: "0.4em" },
          { opacity: 1, y: 0, letterSpacing: "0.08em", duration: 0.07, ease: "power2.out" },
          0.42
        )
        .to(
          ".cinematic-h1",
          { opacity: 0, y: -30, duration: 0.06, ease: "power2.in" },
          0.58
        )
        // Final Headline (headline2) + CTA reveal at 82% scroll, lasting till the end
        .fromTo(
          ".cinematic-final",
          { opacity: 0, y: 80, letterSpacing: "0.4em" },
          { opacity: 1, y: 0, letterSpacing: "0.08em", duration: 0.08, ease: "power2.out" },
          0.82
        )
        .fromTo(
          ".cinematic-cta-wrap",
          { opacity: 0, scale: 0.9, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.08, ease: "back.out(1.5)" },
          0.84
        );
    }, containerRef.current);

    return () => ctx.revert();
  }, [reducedMotion, loading]);

  // Reduced motion alternative static render
  if (reducedMotion) {
    return (
      <section
        className="relative min-h-[90vh] w-full flex items-center justify-center bg-[#04090c] px-6 py-20 text-center"
        aria-label="Viaggio Cromatico - Versione statica accessibile"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
          style={{
            backgroundImage: `url(/.tmp/scroll-journey/chromatic-journey/images/start.png)`,
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto rounded-3xl border border-[#B97A6A]/20 bg-[#061418]/65 backdrop-blur-md px-8 py-12 shadow-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#B97A6A] mb-4">
            {dict.eyebrow}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight text-white mb-6">
            {dict.headline1_line1}{" "}
            <span className="italic text-[#B97A6A]">{dict.headline1_line2}</span>
          </h1>
          <p
            className="text-lg text-white/90 leading-relaxed mb-8 font-serif"
            dangerouslySetInnerHTML={{ __html: dict.card }}
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={loginHref}
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#B97A6A] to-[#C98A7A] px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] touch-bounce"
            >
              {dict.cta}
            </Link>
            <span className="text-sm text-white/70">
              <span className="font-semibold text-white">{dict.priceAmount}</span>{" "}
              {dict.priceNote}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="hero relative h-screen w-full overflow-hidden bg-[#04090c]"
      aria-label="Esperienza di Armocromia - Viaggio Cinematico"
    >
      <canvas ref={canvasRef} id="stage" className="absolute inset-0 w-full h-full block" />
      
      {/* Radial vignette overlay for high contrast text readability (WCAG AA) */}
      <div 
        className="vignette absolute inset-0 pointer-events-none z-10" 
        style={{
          background: "radial-gradient(115% 85% at 50% 48%, rgba(4,9,12,0) 30%, rgba(4,9,12,0.65) 100%)"
        }}
      />

      {/* Navigation bar mockup conforming to design specifications */}
      <nav className="absolute top-6 left-50% -translate-x-[50%] flex items-center gap-1 z-20 bg-white/5 backdrop-blur-md border border-[#B97A6A]/20 rounded-full px-2 py-1.5 pointer-events-none">
        <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] text-white/80 mr-2">&times;</div>
        {dict.nav.map((w, idx) => (
          <span
            key={w}
            className={`text-[11px] font-semibold tracking-wider px-3.5 py-1.5 rounded-full ${
              idx === 0 ? "bg-[#B97A6A] text-[#05181c]" : "text-white/80"
            }`}
          >
            {w}
          </span>
        ))}
      </nav>

      {/* Frosted card beats (Scroll controlled) */}
      <div className="cinematic-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(740px,85vw)] rounded-3xl border border-[#B97A6A]/22 bg-[#061418]/45 backdrop-blur-[12px] px-8 sm:px-12 py-10 sm:py-12 text-center z-15 opacity-0 pointer-events-none">
        <div className="eyebrow font-serif italic text-base text-[#B97A6A] mb-4">
          {dict.eyebrow}
        </div>
        <p
          className="font-serif text-white text-2xl sm:text-4xl leading-snug"
          dangerouslySetInnerHTML={{ __html: dict.card }}
        />
      </div>

      {/* Mid Season Headline (Scroll controlled) */}
      <h2 className="cinematic-h1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] text-center font-serif font-semibold text-4xl sm:text-7xl lg:text-8xl leading-none tracking-widest text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] z-15 opacity-0 pointer-events-none">
        <span>{dict.headline1_line1}</span>
        <span className="block italic font-normal text-[#B97A6A] mt-2">{dict.headline1_line2}</span>
      </h2>

      {/* Finale Reveal Panel (Scroll controlled) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] flex flex-col items-center justify-center text-center z-15 pointer-events-none">
        <h2 className="cinematic-final font-serif font-semibold text-4xl sm:text-7xl lg:text-8xl leading-none tracking-widest text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] opacity-0">
          <span>{dict.headline2_line1}</span>
          <span className="block italic font-normal text-[#B97A6A] mt-2">{dict.headline2_line2}</span>
        </h2>

        {/* CTA button appearing dynamically in the finale beat */}
        <div className="cinematic-cta-wrap mt-8 sm:mt-12 flex flex-col items-center gap-3 opacity-0 pointer-events-auto">
          <Link
            href={loginHref}
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#B97A6A] to-[#C98A7A] px-10 py-5 text-lg font-medium text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] touch-bounce"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out" />
            {dict.cta}
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <span className="text-sm text-white/80 drop-shadow-md">
            <span className="font-semibold text-white">{dict.priceAmount}</span>{" "}
            {dict.priceNote}
          </span>
        </div>
      </div>

      {/* Onboarding hint indicator at the start */}
      <div className="cinematic-hint absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 text-[11px] uppercase tracking-[0.25em] z-15 pointer-events-none">
        <span>Scorri per iniziare</span>
        <div 
          className="w-4 h-4 border-r-2 border-b-2 border-[#B97A6A] rotate-45"
          style={{
            animation: "bob 1.6s ease-in-out infinite"
          }}
        />
        <style jsx global>{`
          @keyframes bob {
            0%, 100% { transform: translateY(0) rotate(45deg); }
            50% { transform: translateY(6px) rotate(45deg); }
          }
        `}</style>
      </div>

      {/* Infinite horizontal marquee */}
      <div 
        className="absolute bottom-0 inset-x-0 py-4 overflow-hidden z-15 pointer-events-none"
        style={{
          background: "linear-gradient(0deg, rgba(4,9,12,0.6) 0%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)"
        }}
      >
        <div 
          className="flex whitespace-nowrap"
          style={{
            animation: "slide 24s linear infinite"
          }}
        >
          {Array(3).fill(dict.marquee).flat().map((word, idx) => (
            <span
              key={idx}
              className="font-serif italic text-lg sm:text-xl text-white/60 px-10"
            >
              {word}
            </span>
          ))}
        </div>
        <style jsx global>{`
          @keyframes slide {
            from { transform: translateX(0); }
            to { transform: translateX(-33.33%); }
          }
        `}</style>
      </div>

      {/* Dreamy loading veil visible until initial frames are ready */}
      {loading && (
        <div className="absolute inset-0 bg-[#04090c] flex flex-col items-center justify-center z-40 transition-opacity duration-500">
          <span className="font-serif italic text-[#B97A6A] text-lg tracking-widest animate-pulse">
            caricamento viaggio cromatico… {Math.min(100, Math.round((loadedCount / 24) * 100))}%
          </span>
        </div>
      )}
    </section>
  );
}
