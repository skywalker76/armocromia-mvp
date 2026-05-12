"use client";

import { useState, useEffect, useRef } from "react";

interface NavBarProps {
  email: string;
}

/**
 * Navbar premium con glassmorphism, avatar, dropdown e hamburger mobile.
 *
 * Why: Client Component per gestire scroll detection, dropdown e mobile menu.
 */
export default function NavBar({ email }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = email ? email.charAt(0).toUpperCase() : "U";
  const displayName = email ? email.split("@")[0] : "Utente";

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-3.5 transition-all duration-300 ${
          scrolled
            ? "glass shadow-sm"
            : "bg-transparent border-b border-accent/8"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {/* Logo */}
          <a
            href="/dashboard"
            className="group flex items-center gap-2 sm:gap-2.5 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 transition-all group-hover:bg-accent/15 group-hover:shadow-sm">
              <svg
                className="h-4.5 w-4.5 text-accent transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
                />
              </svg>
            </div>
            <span className="font-serif text-lg tracking-tight text-ink">
              Armocromia
            </span>
          </a>

          {/* Desktop — Avatar + Dropdown */}
          <div className="hidden sm:block relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-all hover:bg-accent/5"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light text-xs font-bold text-white shadow-sm">
                {initial}
              </div>
              <span className="text-sm font-medium text-ink">
                {displayName}
              </span>
              <svg
                className={`h-3.5 w-3.5 text-muted-light transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Desktop Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-accent/10 bg-white py-2 shadow-lg animate-slide-down">
                <div className="px-4 py-3 border-b border-accent/8">
                  <p className="text-sm font-medium text-ink">{displayName}</p>
                  <p className="mt-0.5 text-xs text-muted-light truncate">{email}</p>
                </div>
                <div className="py-1">
                  <a
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-cream"
                  >
                    <svg className="h-4 w-4 text-muted-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    Dashboard
                  </a>
                </div>
                <div className="border-t border-accent/8 pt-1">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-cream hover:text-ink"
                    >
                      <svg className="h-4 w-4 text-muted-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                      Esci
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Mobile — Hamburger + Avatar */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light text-xs font-bold text-white shadow-sm">
              {initial}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-accent/5"
              aria-label="Apri menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel — slides down from top */}
          <div className="absolute inset-x-0 top-0 rounded-b-3xl bg-white shadow-xl animate-slide-down">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-accent/8">
              <span className="font-serif text-lg text-ink">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-cream transition-colors"
                aria-label="Chiudi menu"
              >
                <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info */}
            <div className="px-5 py-5 border-b border-accent/8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light text-base font-bold text-white shadow-sm">
                {initial}
              </div>
              <div>
                <p className="font-medium text-ink">{displayName}</p>
                <p className="text-sm text-muted-light truncate max-w-[200px]">{email}</p>
              </div>
            </div>

            {/* Menu items */}
            <nav className="px-3 py-3 space-y-1">
              <a
                href="/dashboard"
                className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-ink transition-colors hover:bg-cream active:bg-cream-dark"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </a>
              <a
                href="/"
                className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-ink transition-colors hover:bg-cream active:bg-cream-dark"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="font-medium">Home</span>
              </a>
            </nav>

            {/* Logout */}
            <div className="px-3 pb-5 pt-2 border-t border-accent/8 mt-1">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-muted transition-colors hover:bg-cream hover:text-ink active:bg-cream-dark"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  <span className="font-medium">Esci</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
