"use client"

import { useEffect, useState } from "react"

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
    <div className="min-h-screen bg-gray-50">
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
          <p className="text-slate-200">Monitor and analyze emotional response data</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Total Sessions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDataPoints}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Total Data Points</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.avgDuration}m</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Avg Session Duration</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueUsers}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Active Users</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#1f2937" }}>
            Data Management
          </h3>
          <div className="flex flex-wrap gap-4">
            <button onClick={loadSessions} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh Data
            </button>
            <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800">Source: Database API ✓</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold" style={{ color: "#1f2937" }}>
              Recent Sessions
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
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
                    className="p-6 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedSession(session)
                      setShowModal(true)
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">{session.email}</span>
                        {session.user_id && (
                          <span className="text-xs font-mono force-black-text">
                            User ID: {session.user_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(session.start_time).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-blue-600">{dataPoints}</div>
                        <div className="text-gray-600">Data Points</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">{sessionStats.highest}</div>
                        <div className="text-gray-600">Highest</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{sessionStats.lowest}</div>
                        <div className="text-gray-600">Lowest</div>
                      </div>
                      <div>
                        <div className="font-semibold text-purple-600">{sessionStats.average}</div>
                        <div className="text-gray-600">Average</div>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-600">{sessionStats.mode}</div>
                        <div className="text-gray-600">Mode</div>
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
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Session: {selectedSession.email}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
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
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Statistical Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    const stats = calculateSessionStats(selectedSession.data_points || [])
                    return (
                      <>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="font-semibold text-green-600 text-lg">{stats.highest}</div>
                          <div className="text-gray-600">Highest Value</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <div className="font-semibold text-red-600 text-lg">{stats.lowest}</div>
                          <div className="text-gray-600">Lowest Value</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="font-semibold text-purple-600 text-lg">{stats.average}</div>
                          <div className="text-gray-600">Average</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <div className="font-semibold text-orange-600 text-lg">{stats.mode}</div>
                          <div className="text-gray-600">Mode (Most Frequent)</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
