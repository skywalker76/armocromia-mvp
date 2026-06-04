# Cromea Studio Safe Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the visual enhancements (Primavera Calda Hero image, uncropped aspect ratios, multilingual badge fixes, sticky navigation, real Dossier Gallery) and the Cinematic Hero (/preview) to production without breaking any current live functionality.

**Architecture:** We will use a 4-phase safe integration strategy: (1) Commit and push current branch `feature/hero-cinematica` to origin to trigger a Vercel Preview Deployment for testing, (2) Create a local integration branch from main and run a full production build (`npm run build`) to guarantee compile-time stability, (3) Merge and push to `main` for Vercel production deployment, (4) Perform live smoke testing on production URLs.

**Tech Stack:** Next.js 16, Git, Vercel, GSAP

---

### Task 1: Commit and Push Local Changes for Preview Build

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/[lang]/(marketing)/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/es.json`
- Modify: `src/messages/it.json`

**Step 1: Check git status**
Ensure all files are visible and ready.
Run: `git status`
Expected: Lists the 7 modified files and the untracked components/assets.

**Step 2: Add all files to the staging area**
Run: `git add .`
Expected: Files staged successfully.

**Step 3: Commit files locally**
Run: `git commit -m "feat: cromea studio visual optimization and real dossier gallery"`
Expected: Commit succeeds. Husky pre-commit hook runs `npm run build` and passes with 0 errors.

**Step 4: Push the branch to origin**
Run: `git push origin feature/hero-cinematica`
Expected: Push succeeds and triggers a Vercel Preview Deployment.

---

### Task 2: Validate the Preview Deployment

**Files:**
- None (Verification task)

**Step 1: Get the preview URL from Vercel**
Expected: Find the Vercel branch deployment link (e.g. from GitHub PR or Vercel dashboard).

**Step 2: Verify the Homepage on the Preview URL**
- Open the URL in a browser.
- Check that the Hero image shows the Primavera Calda dossier without clipping.
- Verify the sticky navigation menu works.
- Verify the Dossier Gallery scroll works and Lightbox opens on click.

**Step 3: Verify the Cinematic Hero Preview Route**
- Navigate to `/[lang]/preview` (e.g., `/it/preview`, `/en/preview`).
- Verify the canvas animation loads and scrolls correctly.

---

### Task 3: Local Integration and Compile Testing

**Files:**
- Create: Temporary branch `temp/safe-merge`

**Step 1: Checkout main branch and sync**
Run: `git checkout main`
Run: `git pull origin main`
Expected: Main branch updated and matches production.

**Step 2: Create a integration branch**
Run: `git checkout -b temp/safe-merge`
Expected: Switched to new branch `temp/safe-merge`.

**Step 3: Merge feature branch locally**
Run: `git merge feature/hero-cinematica`
Expected: Merged successfully (no conflicts or resolved).

**Step 4: Run production build locally**
Run: `npm run build`
Expected: Build completes successfully (`✓ Compiled successfully` with 0 TypeScript or linting errors).

---

### Task 4: Push to Main for Production Deploy

**Files:**
- Modify: `main` branch

**Step 1: Checkout main and merge safe branch**
Run: `git checkout main`
Run: `git merge temp/safe-merge`
Expected: Main branch updated with all verified changes.

**Step 2: Push main to origin**
Run: `git push origin main`
Expected: Pushed successfully to production. Vercel starts production deployment.

**Step 3: Verify production build status**
Check Vercel deployment logs to ensure production build finishes with "Ready" state.

---

### Task 5: Post-Deploy Production Verification

**Files:**
- None (Smoke testing task)

**Step 1: Verify home page live**
Access `https://www.cromeastudio.com/it` and verify the new sections and real dossier gallery load.

**Step 2: Verify magic link login**
Perform a test login to ensure the Supabase authentication flow remains fully operational.

**Step 3: Verify image compression upload**
Confirm the client-side canvas compression remains active for uploading a new photo.
