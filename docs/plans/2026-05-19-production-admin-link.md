# Production Admin Link Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the conditional "Admin" link in the navbar displays correctly in production for authorized administrators (like `gamatig@gmail.com`) by forcing the authenticated area layout to be dynamic at runtime.

**Architecture:** Next.js App Router statically pre-renders and caches layouts unless they are marked dynamic. By adding `export const dynamic = "force-dynamic"` to the layout, we force Next.js to evaluate `cookies()` and environment variables (`process.env.ADMIN_EMAILS`) fresh at runtime on every page request, rather than caching the pre-rendered static layout shell from build-time.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase Auth.

---

## Proposed Changes

### Core Layout Routing

#### [MODIFY] [layout.tsx](file:///C:/Antigravity/armocromia-mvp/src/app/%5Blang%5D/%28app%29/layout.tsx)
- Force dynamic rendering by exporting `const dynamic = "force-dynamic"`.
- This ensures `isAdmin` is calculated at runtime with actual server-side environment variables and cookies.

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import ToastContainer from "@/components/ui/Toast";
import NavBar from "@/components/app/NavBar";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";

// Force Next.js to render this layout dynamically at runtime on every request
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  // ... rest of layout logic remains untouched
}
```

---

## Verification Plan

### Automated/Local Tests
- Run `npm run build` locally to verify that the build succeeds with Turbopack/Next.js compiler.
- Check the compiler output to ensure that the layout is compiled as a dynamic route/layout.
- Run `npm run dev` to verify the local navbar displays the "Admin" link when simulated as an admin.

### Manual Verification
- Deploy to Vercel and verify that the "Admin" link is visible on the live site when logged in as `gamatig@gmail.com`.
