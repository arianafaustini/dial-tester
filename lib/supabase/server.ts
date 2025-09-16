import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Server: Environment variables check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    finalUrl: supabaseUrl?.substring(0, 20) + "...",
    finalKey: supabaseKey ? "***" + supabaseKey.slice(-4) : "missing",
  })

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Server: Missing Supabase credentials!")
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}
