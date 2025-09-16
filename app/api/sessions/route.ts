import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        email: email.trim(),
        start_time: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      return NextResponse.json({ error: "Failed to create session", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
