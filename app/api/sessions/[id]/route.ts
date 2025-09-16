import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action } = await request.json()
    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (action === "complete") {
      updateData.end_time = new Date().toISOString()
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating session:", error)
      return NextResponse.json({ error: "Failed to update session", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: session, error } = await supabase
      .from("sessions")
      .select(`
        *,
        data_points (*)
      `)
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error fetching session:", error)
      return NextResponse.json({ error: "Failed to fetch session", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
