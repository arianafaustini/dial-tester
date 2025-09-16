"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmotionalDialTester() {
  const [email, setEmail] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentValue, setCurrentValue] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [dataPoints, setDataPoints] = useState<Array<{ timestamp: number; value: number }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const sliderRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<number>(0)
  const saveThrottleMs = 100 // Save at most every 100ms
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSliderInteraction = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || !isRecording || isPaused) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const value = Math.round((percentage - 0.5) * 200) // -100 to +100

      setCurrentValue(value)

      const timestamp = Date.now() - startTimeRef.current
      const newDataPoint = { timestamp, value }
      setDataPoints((prev) => [...prev, newDataPoint])

      const now = Date.now()
      if (now - lastSaveRef.current >= saveThrottleMs) {
        lastSaveRef.current = now
        saveDataPoint(sessionId!, timestamp, value)
      }
    },
    [isRecording, isPaused, sessionId],
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    handleSliderInteraction(e.clientX)

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        handleSliderInteraction(e.clientX)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove, { passive: false })
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    const touch = e.touches[0]
    handleSliderInteraction(touch.clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault()
      const touch = e.touches[0]
      handleSliderInteraction(touch.clientX)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    isDraggingRef.current = false
  }

  const saveDataPoint = async (sessionId: string, timestamp: number, value: number) => {
    try {
      const response = await fetch("/api/data-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          timestamp: new Date(Date.now()).toISOString(),
          value: value,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save data point")
      }
    } catch (error) {
      console.error("Error saving data point:", error)
    }
  }

  const startSession = async () => {
    if (!email.trim()) {
      alert("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const { session } = await response.json()

      setSessionId(session.id)
      setIsRecording(true)
      setIsPaused(false)
      setSessionTime(0)
      setDataPoints([])
      startTimeRef.current = Date.now()
    } catch (error) {
      console.error("Error starting session:", error)
      alert("Failed to start session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const pauseSession = () => {
    setIsPaused(!isPaused)
  }

  const completeSession = async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "complete" }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete session")
      }

      setIsRecording(false)
      setIsPaused(false)
      setSessionId(null)
      setCurrentValue(0)
      alert(`Session completed! Recorded ${dataPoints.length} data points.`)
    } catch (error) {
      console.error("Error completing session:", error)
      alert("Error completing session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const sliderPosition = ((currentValue + 100) / 200) * 100

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Deployment trigger: 2025-01-16-force-rebuild */}
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-black border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Emotional Dial Tester</CardTitle>
            {sessionId && <div className="text-lg font-mono text-blue-400">{formatTime(sessionTime)}</div>}
          </CardHeader>
        </Card>

        {!sessionId && (
          <Card className="bg-black border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white">Enter your email to begin:</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="text-lg bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={startSession}
                  className="w-full text-lg py-6 bg-gray-700 hover:bg-gray-600 text-white"
                  disabled={!email.trim() || isLoading}
                >
                  {isLoading ? "Starting Session..." : "Start Session"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sessionId && (
          <>
            <Card className="bg-black border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-white">{currentValue}</div>
                  <div className="text-sm text-gray-400">Emotional Response</div>
                </div>

                <div className="relative">
                  <div
                    ref={sliderRef}
                    className="touch-slider h-16 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full cursor-pointer touch-none select-none"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ touchAction: "none" }}
                  >
                    <div
                      className="absolute top-1/2 w-6 h-6 bg-white border-2 border-gray-800 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg transition-all duration-100 pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Negative (-100)</span>
                    <span>Neutral (0)</span>
                    <span>Positive (+100)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-gray-800">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button
                    onClick={pauseSession}
                    variant="outline"
                    className="flex-1 text-lg py-6 min-h-[48px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    disabled={isLoading}
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    onClick={completeSession}
                    className="flex-1 text-lg py-6 min-h-[48px] bg-gray-700 hover:bg-gray-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Completing..." : "Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-gray-800">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{dataPoints.length}</div>
                    <div className="text-sm text-gray-400">Data Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {dataPoints.length > 0
                        ? Math.round(dataPoints.reduce((sum, dp) => sum + dp.value, 0) / dataPoints.length)
                        : 0}
                    </div>
                    <div className="text-sm text-gray-400">Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-black border-gray-800">
          <CardContent className="pt-6">
            <div className="font-semibold mb-2 text-white" style={{ color: "#ffffff !important" }}>
              Instructions:
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Drag the slider to express your emotional response</li>
              <li>• Left side: Negative emotions (-100 to 0)</li>
              <li>• Right side: Positive emotions (0 to +100)</li>
              <li>• Your responses are recorded in real-time</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
