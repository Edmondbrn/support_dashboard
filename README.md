# Support Dashboard

A ticket support platform built with React and Supabase.  
Live demo: https://support-dashboard-ygd3-fawn.vercel.app

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-8-CA4245?logo=reactrouter&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)
![oxlint](https://img.shields.io/badge/oxlint-1-4B32C3?logo=eslint&logoColor=white)
![Shadcn/ui](https://img.shields.io/badge/shadcn/ui-8A2BE2?logo=shadcnui&color=131316)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

## Project structure

The repository contains two main parts:

**support_front**: React single-page application with Vite, TypeScript, Tailwind CSS, TanStack Query for server state, React Router for navigation, and a component library built on Base UI / Shadcn. It talks to Supabase via the JavaScript client, which handles authentication, tickets, messages with realtime updates, file uploads, and an admin dashboard. Tests live in `tests/integration` and run against a local Supabase stack in CI.

**supabase**: Supabase powers the backend. The PostgreSQL database is defined using schema migrations and row-level security policies (RLS). Sensitive actions are handled either by Remote Procedure Calls (RPC functions) or by edge functions. RPCs are used for admin actions and sensitive update transactions, while an edge function validates and sends mail using the Resend API. The edge function is protected against external calls by a secret token stored in the Supabase Vault, which lets the RPC function invoke the edge function via the `pg_net` extension. This RPC is only accessible to the `postgres` role. A storage bucket handles message attachments, and the database content is reset every night to restore the demo dataset (see [Deployment](#deployment)).

## Getting started locally

1. Install pnpm and Node 22
2. `pnpm install` in `support_front`
3. `supabase start` in `supabase` (starts Postgres, Auth, Realtime, Storage, Studio)
4. Copy `support_front/.env.example` to `support_front/.env` and fill in the local Supabase URL and keys from `supabase status`
5. `pnpm dev` in `support_front`, app runs on http://localhost:5173

## Deployment

- **Frontend**: Vercel (Git integration, auto-deploys `main`)
- **Backend**: Single Supabase Cloud project (linked via `supabase link`)
- **Nightly reset**: a GitHub Actions cron job runs `supabase db reset --linked` every night at 02:00 UTC (~03:00 CET) to wipe and reapply migrations against the linked cloud project, then reseeds demo data from `seed.sql`. Supabase-managed schemas (`auth`, `storage`, and the Vault) are left untouched by the reset, so stored secrets survive it.

## Scripts (from support_front)

`pnpm dev`: start dev server  
`pnpm build`: type-check and build for production  
`pnpm lint`: oxlint  
`pnpm test`: vitest integration suite  
`pnpm typecheck`: tsc --noEmit