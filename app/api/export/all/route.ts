import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { data: combinedData, error } = await supabase
      .from("data_points")
      .select(`
        id,
        value,
        timestamp,
        sessions!inner (
          id,
          created_at
        )
      `)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching combined data:", error)
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    }

    // Convert to CSV
    const headers = ["Data Point ID", "Session ID", "Emotional Value", "Timestamp", "Session Created"]
    const csvContent = [
      headers.join(","),
      ...combinedData.map((point) =>
        [point.id, point.sessions.id, point.value, point.timestamp, point.sessions.created_at].join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="complete_dataset.csv"',
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
