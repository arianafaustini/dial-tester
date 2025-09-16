import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] API: Starting sessions fetch...")
    console.log("[v0] API: Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
    })

    const supabase = createClient()
    console.log("[v0] API: Supabase client created")

    const { data: testData, error: testError } = await supabase
      .from("sessions")
      .select("count", { count: "exact", head: true })

    console.log("[v0] API: Database connection test:", { testData, testError })

    if (testError) {
      console.error("[v0] API: Database connection failed:", testError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: testError.message,
          code: testError.code,
        },
        { status: 500 },
      )
    }

    // Get all sessions with their data points
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        *,
        data_points (*)
      `)
      .order("start_time", { ascending: false })

    console.log("[v0] API: Sessions query result:", {
      sessionsCount: sessions?.length || 0,
      error: sessionsError,
      firstSession: sessions?.[0],
    })

    if (sessionsError) {
      console.error("[v0] API: Sessions query error:", sessionsError)
      return NextResponse.json(
        {
          error: "Failed to fetch sessions",
          details: sessionsError.message,
          code: sessionsError.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] API: Successfully returning sessions:", sessions?.length || 0)
    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("[v0] API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
