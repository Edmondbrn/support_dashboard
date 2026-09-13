import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types.ts'

// remove vite warnign about duplicated instances
declare global {
  // eslint-disable-next-line no-var
  var __supabase: ReturnType<typeof createClient<Database>> | undefined
}

export const supabase =
  globalThis.__supabase ??
  createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  )

if (import.meta.env.DEV) globalThis.__supabase = supabase