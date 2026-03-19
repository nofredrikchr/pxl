# Image.ai Webapp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fullstack Next.js webapp that takes simple text prompts, expands them into high-quality JSON prompts using AI (Claude/Gemini), sends them to Kie.ai for image generation, and displays results with a gallery history.

**Architecture:** Next.js 14 App Router with Supabase (Postgres DB + Storage + Auth). AI prompt expansion via Anthropic and Google Gemini APIs. Image generation via Kie.ai API. Deployed on Vercel.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (DB/Auth/Storage), Anthropic SDK, Google Generative AI SDK, Kie.ai API

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `.env.local.example`, `.gitignore`

**Step 1: Create Next.js app**

```bash
cd c:/Users/fredr/Desktop/Image.ai
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk @google/generative-ai jose
npm install -D @types/node
```

**Step 3: Create `.env.local.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key
KIE_API_KEY=your_kie_key
APP_PASSWORD=your_app_password
```

**Step 4: Create `.env.local` with placeholder values**

Same as above but with actual placeholder text. User fills in real keys.

**Step 5: Update `.gitignore`**

Ensure `.env.local` is in `.gitignore` (Next.js default includes it).

**Step 6: Commit**

```bash
git init && git add -A && git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: Set Up Supabase Schema & Client

**Files:**
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client)
- Create: `src/lib/supabase/middleware.ts` (auth middleware helper)
- Create: `supabase/migrations/001_create_generations.sql` (reference SQL)

**Step 1: Create database migration SQL (reference file)**

```sql
-- supabase/migrations/001_create_generations.sql
-- Run this in Supabase SQL Editor

create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  json_prompt jsonb not null,
  settings jsonb not null default '{}',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  kie_task_id text,
  model_used text not null default 'haiku-4.5',
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.generations enable row level security;

-- Users can only see their own generations
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own generations"
  on public.generations for update
  using (auth.uid() = user_id);

create policy "Users can delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Index for gallery queries
create index idx_generations_user_created on public.generations(user_id, created_at desc);

-- Storage bucket (run in Supabase dashboard or via API)
-- Create bucket 'generated-images' with public access
```

**Step 2: Create Supabase browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create Supabase server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server component, ignore */ }
        },
      },
    }
  )
}
```

**Step 4: Create middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: set up Supabase client, server, middleware, and DB schema"
```

---

### Task 3: Authentication (Login Page + Middleware)

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create Next.js middleware**

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Step 2: Create login server actions**

```typescript
// src/app/login/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) { return { error: error.message } }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**Step 3: Create login page**

Minimal, styled login form with email + password fields. Dark theme. Error display.

**Step 4: Update root layout**

Add dark background, global styles, and font setup.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add authentication with login page and middleware"
```

---

### Task 4: Prompt Expansion API (Claude + Gemini)

**Files:**
- Create: `src/lib/ai/expand-prompt.ts`
- Create: `src/lib/ai/system-prompt.ts`
- Create: `src/lib/ai/models.ts`

**Step 1: Create model definitions**

```typescript
// src/lib/ai/models.ts
export type AIProvider = 'anthropic' | 'google'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  apiModel: string
  tag: string
  icon: string // path or emoji
}

export const AI_MODELS: AIModel[] = [
  { id: 'haiku-4.5', name: 'Haiku 4.5', provider: 'anthropic', apiModel: 'claude-haiku-4-5-20251001', tag: 'Rask', icon: '/icons/anthropic.svg' },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', provider: 'anthropic', apiModel: 'claude-sonnet-4-6-20250311', tag: 'Balansert', icon: '/icons/anthropic.svg' },
  { id: 'opus-4.6', name: 'Opus 4.6', provider: 'anthropic', apiModel: 'claude-opus-4-6-20250311', tag: 'Premium', icon: '/icons/anthropic.svg' },
  { id: 'gemini-flash', name: 'Gemini 3.1 Flash', provider: 'google', apiModel: 'gemini-3.1-flash', tag: 'Rask', icon: '/icons/google.svg' },
  { id: 'gemini-pro', name: 'Gemini 3.1 Pro', provider: 'google', apiModel: 'gemini-3.1-pro', tag: 'Premium', icon: '/icons/google.svg' },
]
```

**Step 2: Create system prompt from SKILL.md rules**

```typescript
// src/lib/ai/system-prompt.ts
export const SYSTEM_PROMPT = `You are an expert image prompt engineer...`
// Embeds the core rules from SKILL.md and master_prompt_reference.md
// Instructs the AI to return ONLY valid JSON in Dense Narrative Format
// No markdown, no explanation, just the JSON object
```

**Step 3: Create prompt expansion function**

```typescript
// src/lib/ai/expand-prompt.ts
// Handles both Anthropic and Google providers
// Takes: { prompt, settings, modelId }
// Returns: parsed JSON prompt object
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add AI prompt expansion with Claude and Gemini support"
```

---

### Task 5: Image Generation API (Kie.ai Integration)

**Files:**
- Create: `src/lib/kie/generate.ts`
- Create: `src/lib/kie/poll.ts`
- Create: `src/app/api/generate/route.ts`
- Create: `src/app/api/generate/[id]/status/route.ts`

**Step 1: Create Kie.ai client functions**

```typescript
// src/lib/kie/generate.ts
// createTask(jsonPrompt, aspectRatio, resolution, outputFormat) -> taskId
// Based on generate_kie.py logic

// src/lib/kie/poll.ts
// pollTask(taskId) -> { status, imageUrl? }
// Based on get_kie_image.py logic
```

**Step 2: Create `/api/generate` route**

Full flow:
1. Verify auth (get user from Supabase session)
2. Accept { prompt, settings, model, jsonOverride? }
3. If no jsonOverride: call expand-prompt with selected model
4. Insert row in `generations` table with status='pending'
5. Call Kie.ai createTask
6. Update row with kie_task_id and status='processing'
7. Return generation id to client

**Step 3: Create `/api/generate/[id]/status` route**

1. Poll Kie.ai for task status
2. If complete: download image, upload to Supabase Storage, update row
3. Return current status + image_url if ready

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Kie.ai image generation API routes"
```

---

### Task 6: Dashboard / Generate Page

**Files:**
- Create: `src/app/page.tsx` (main dashboard)
- Create: `src/components/GenerateForm.tsx`
- Create: `src/components/ModelSelector.tsx`
- Create: `src/components/SettingsBar.tsx`
- Create: `src/components/JsonEditor.tsx`
- Create: `src/components/ImageResult.tsx`
- Create: `src/components/Navbar.tsx`

**Step 1: Create Navbar component**

Logo, nav links (Generer, Galleri), logout button. Sticky top.

**Step 2: Create ModelSelector component**

Dropdown/grid showing all 5 models with provider icon, name, and tag. Highlighted selection.

**Step 3: Create SettingsBar component**

Aspect ratio dropdown (1:1, 4:5, 9:16, 16:9), resolution (1K/2K/4K), style preset (Portrett, Landskap, Produkt, Fri).

**Step 4: Create JsonEditor component**

Syntax-highlighted JSON editor using a textarea with monospace font. Shows the expanded JSON prompt. Editable in advanced mode.

**Step 5: Create GenerateForm component**

Combines: text input, ModelSelector, SettingsBar, Advanced toggle (shows JsonEditor), Generate button. Handles loading/polling state.

**Step 6: Create ImageResult component**

Displays generated image with download button and "Generer på nytt" button.

**Step 7: Create Dashboard page**

Assembles Navbar + GenerateForm + ImageResult. Handles the full generation flow with polling.

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add dashboard page with generate form, model selector, and advanced mode"
```

---

### Task 7: Gallery Page

**Files:**
- Create: `src/app/gallery/page.tsx`
- Create: `src/app/gallery/[id]/page.tsx`
- Create: `src/components/GalleryGrid.tsx`
- Create: `src/components/GenerationCard.tsx`
- Create: `src/components/GenerationDetail.tsx`
- Create: `src/app/api/gallery/route.ts`
- Create: `src/app/api/gallery/[id]/route.ts`

**Step 1: Create gallery API routes**

- GET `/api/gallery` — fetch all generations for user, ordered by created_at desc, paginated (limit/offset)
- DELETE `/api/gallery/[id]` — delete generation + image from storage

**Step 2: Create GenerationCard component**

Thumbnail, truncated prompt, date, model used. Click navigates to detail.

**Step 3: Create GalleryGrid component**

Responsive grid of GenerationCards. Infinite scroll or "Load more" button.

**Step 4: Create Gallery page**

Navbar + GalleryGrid. Empty state if no generations.

**Step 5: Create GenerationDetail page**

Full-size image, original prompt, full JSON prompt (collapsible), settings, model used, date. Buttons: "Gjenbruk prompt" (link to dashboard with prompt pre-filled), "Last ned", "Slett".

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add gallery page with grid view and generation detail"
```

---

### Task 8: Polish & Assets

**Files:**
- Create: `public/icons/anthropic.svg`
- Create: `public/icons/google.svg`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Add provider icons**

Simple SVG icons for Anthropic and Google logos.

**Step 2: Polish global styles**

Dark theme, custom scrollbar, smooth transitions, loading animations.

**Step 3: Add proper metadata**

Title, description, favicon for the app.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add icons, polish styles, and metadata"
```

---

### Task 9: Vercel Deployment

**Step 1: Initialize git repo and push**

```bash
git remote add origin <github-repo-url>
git push -u origin main
```

**Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect GitHub repo in Vercel dashboard.

**Step 3: Set environment variables in Vercel**

All 6 env vars from `.env.local.example`.

**Step 4: Create Supabase user**

In Supabase dashboard, create a user with email/password for login.

**Step 5: Verify deployment**

Test login, generate an image, check gallery.
