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
    const { data: dataPoints, error } = await supabase
      .from("data_points")
      .select("*")
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching data points:", error)
      return NextResponse.json({ error: "Failed to fetch data points" }, { status: 500 })
    }

    // Convert to CSV
    const headers = ["ID", "Session ID", "Value", "Timestamp"]
    const csvContent = [
      headers.join(","),
      ...dataPoints.map((point) => [point.id, point.session_id, point.value, point.timestamp].join(",")),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="data_points.csv"',
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
