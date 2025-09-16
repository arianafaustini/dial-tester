import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Server: Environment variables check:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      finalUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
      finalKey: "***" + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-4),
    })

    const { session_id, value, timestamp } = await request.json()

    console.log("[v0] Server: Received data:", {
      session_id,
      value,
      valueType: typeof value,
      timestamp,
    })

    if (!session_id || value === undefined) {
      return NextResponse.json({ error: "Session ID and value are required" }, { status: 400 })
    }

    const numericValue = typeof value === "string" ? Number.parseFloat(value) : Number(value)

    console.log("[v0] Server: Value processing:", {
      originalValue: value,
      numericValue,
      isNaN: isNaN(numericValue),
      withinRange: numericValue >= -100 && numericValue <= 100,
    })

    // Validate that the value is within the expected range
    if (isNaN(numericValue) || numericValue < -100 || numericValue > 100) {
      console.error("Invalid value:", value, "parsed as:", numericValue)
      return NextResponse.json(
        {
          error: "Value must be a number between -100 and 100",
          received: value,
          parsed: numericValue,
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data: dataPoint, error } = await supabase
      .from("data_points")
      .insert({
        session_id,
        value: numericValue, // Store original value (-100 to +100)
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving data point:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertedValue: numericValue,
        sessionId: session_id,
      })
      return NextResponse.json({ error: "Failed to save data point", details: error.message }, { status: 500 })
    }

    console.log("[v0] Server: Successfully saved data point:", {
      originalValue: numericValue,
      storedValue: numericValue,
      sessionId: session_id,
    })

    return NextResponse.json({ dataPoint })
  } catch (error) {
    console.error("Data point save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
