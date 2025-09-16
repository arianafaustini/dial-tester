"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Session {
  id: string
  user_id?: string // Added user_id to interface
  email: string
  start_time: string
  end_time?: string
  data_points?: DataPoint[]
}

interface DataPoint {
  id: string
  session_id: string
  timestamp: string
  value: number
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    console.log("[v0] Loading sessions from API...")
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/sessions")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load sessions")
      }

      console.log("[v0] Loaded sessions:", data.sessions.length)
      setSessions(data.sessions)
    } catch (err) {
      console.error("[v0] Error loading sessions:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalSessions = sessions.length
    let totalDataPoints = 0
    let totalDuration = 0
    const uniqueUsers = new Set<string>()

    sessions.forEach((session) => {
      totalDataPoints += session.data_points?.length || 0
      uniqueUsers.add(session.email)
      if (session.start_time && session.end_time) {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime()
        totalDuration += duration
      }
    })

    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 1000 / 60) : 0

    return {
      totalSessions,
      totalDataPoints,
      avgDuration,
      uniqueUsers: uniqueUsers.size,
    }
  }

  const calculateSessionStats = (dataPoints: DataPoint[]) => {
    if (!dataPoints || dataPoints.length === 0) {
      return { highest: 0, lowest: 0, average: 0, mode: 0 }
    }

    const values = dataPoints.map((dp) => dp.value)
    const highest = Math.max(...values)
    const lowest = Math.min(...values)
    const average = Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10

    // Calculate mode (most frequent value)
    const frequency: { [key: number]: number } = {}
    values.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1
    })
    const mode = Number.parseInt(
      Object.keys(frequency).reduce((a, b) => (frequency[Number.parseInt(a)] > frequency[Number.parseInt(b)] ? a : b)),
    )

    return { highest, lowest, average, mode }
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gray-900">
      <style jsx>{`
        .force-black-text {
          color: #000000 !important;
          font-weight: 500 !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-gray-300">Monitor and analyze emotional response data</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{stats.totalSessions}</div>
            <div className="text-sm text-gray-300 uppercase tracking-wide">Total Sessions</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{stats.totalDataPoints}</div>
            <div className="text-sm text-gray-300 uppercase tracking-wide">Total Data Points</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{stats.avgDuration}m</div>
            <div className="text-sm text-gray-300 uppercase tracking-wide">Avg Session Duration</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{stats.uniqueUsers}</div>
            <div className="text-sm text-gray-300 uppercase tracking-wide">Active Users</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 border border-gray-700">
          <div className="text-lg font-semibold mb-4 text-white">Data Management</div>
          <div className="flex flex-wrap gap-4">
            <button onClick={loadSessions} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh Data
            </button>
            <span className="px-3 py-1 rounded text-sm bg-green-900 text-green-300 border border-green-700">
              Source: Database API ✓
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="text-lg font-semibold text-white">Recent Sessions</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <h4 className="font-semibold mb-2">No Sessions Found</h4>
                <p>Start using the app to see session data here.</p>
              </div>
            ) : (
              sessions.map((session) => {
                const dataPoints = session.data_points?.length || 0
                const sessionStats = calculateSessionStats(session.data_points || [])

                return (
                  <div
                    key={session.id}
                    className="p-6 border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setSelectedSession(session)
                      setShowModal(true)
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{session.email}</span>
                        {session.user_id && (
                          <span className="text-xs font-mono text-gray-300">
                            User ID: {session.user_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">{new Date(session.start_time).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-blue-400">{dataPoints}</div>
                        <div className="text-gray-400">Data Points</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-400">{sessionStats.highest}</div>
                        <div className="text-gray-400">Highest</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-400">{sessionStats.lowest}</div>
                        <div className="text-gray-400">Lowest</div>
                      </div>
                      <div>
                        <div className="font-semibold text-purple-400">{sessionStats.average}</div>
                        <div className="text-gray-400">Average</div>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-400">{sessionStats.mode}</div>
                        <div className="text-gray-400">Mode</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Session: {selectedSession.email}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4 text-gray-300">
              <div>
                <strong>Start Time:</strong>
                <br />
                {new Date(selectedSession.start_time).toLocaleString()}
              </div>
              <div>
                <strong>Data Points:</strong>
                <br />
                {selectedSession.data_points?.length || 0}
              </div>
              <div>
                <strong>Session ID:</strong>
                <br />
                <span className="font-mono text-xs">{selectedSession.id?.slice(0, 8) || "N/A"}...</span>
              </div>
              {selectedSession.user_id && (
                <div>
                  <strong>User ID:</strong>
                  <br />
                  <span className="font-mono text-xs force-black-text">{selectedSession.user_id.slice(0, 8)}...</span>
                </div>
              )}
            </div>
            {selectedSession.data_points && selectedSession.data_points.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-white">Emotional Response Over Time</h4>
                <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-600">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={selectedSession.data_points.map((dp, index) => ({
                        time: new Date(dp.timestamp).toLocaleTimeString(),
                        value: dp.value,
                        index: index + 1,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                      <YAxis stroke="#9CA3AF" fontSize={12} domain={[-10, 10]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                          color: "#F9FAFB",
                        }}
                        labelStyle={{ color: "#9CA3AF" }}
                        formatter={(value: any, name: string) => [`${value}`, "Emotional Response"]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    Hover over data points to see exact values and timestamps
                  </div>
                </div>

                <h4 className="font-semibold mb-3 text-white">Statistical Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-green-900 p-3 rounded border border-green-700">
                    <div className="font-semibold text-green-300 text-lg">
                      {calculateSessionStats(selectedSession.data_points || []).highest}
                    </div>
                    <div className="text-gray-400">Highest Value</div>
                  </div>
                  <div className="bg-red-900 p-3 rounded border border-red-700">
                    <div className="font-semibold text-red-300 text-lg">
                      {calculateSessionStats(selectedSession.data_points || []).lowest}
                    </div>
                    <div className="text-gray-400">Lowest Value</div>
                  </div>
                  <div className="bg-purple-900 p-3 rounded border border-purple-700">
                    <div className="font-semibold text-purple-300 text-lg">
                      {calculateSessionStats(selectedSession.data_points || []).average}
                    </div>
                    <div className="text-gray-400">Average</div>
                  </div>
                  <div className="bg-orange-900 p-3 rounded border border-gray-700">
                    <div className="font-semibold text-orange-300 text-lg">
                      {calculateSessionStats(selectedSession.data_points || []).mode}
                    </div>
                    <div className="text-gray-400">Mode (Most Frequent)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
