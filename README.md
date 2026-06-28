# HireScore AI

A recruiter-first hiring workflow app built with React, TypeScript, Vite, Supabase, and Vercel Blob.

The free plan helps recruiters manage client companies, hiring roles, resume intake, candidate lists, downloads, and JD/version history. The paid HireScore AI path is positioned around candidate ranking, AI explanations, AI-generated candidate profiles, shortlist decisions, and complete hiring-flow automation.

## Features

- Supabase email/password authentication and protected routes
- Client company create/edit/list/detail workflows
- Hiring role library with search, filters, status badges, skills, clone, and soft archive/restore
- Resume folder/file upload through Vercel Blob
- Candidate list and download flow per hiring role
- AI upgrade surfaces for ranking, explanations, and profile creation
- Immutable JD snapshots: every edit or restore creates a new version
- Local demo mode when Supabase variables are absent

## Local Setup

1. Install dependencies: `pnpm install`
2. Create a Supabase project.
3. Open Supabase SQL Editor and run `supabase/schema.sql`.
4. In Supabase Authentication, create an email/password user.
5. Copy `.env.example` to `.env.local` and add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-read-write-token
```

6. Start the app: `pnpm dev`

Only `VITE_` variables belong in the frontend. `BLOB_READ_WRITE_TOKEN` is server-only and must never be hardcoded or exposed in browser code.

## Deployment

Import this folder into Vercel, keep the detected Vite settings, and add the two `VITE_` environment variables plus the server-only `BLOB_READ_WRITE_TOKEN`. The included `vercel.json` provides SPA route rewrites.
