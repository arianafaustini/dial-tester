class EmotionalDialTester {
  constructor() {
    this.isRecording = false
    this.sessionStartTime = null
    this.sessionTimer = null
    this.dataPoints = []
    this.currentValue = 0
    this.isDragging = false
    this.userEmail = null
    this.sessionId = null

    this.supabase = null
    this.initializeSupabase()

    this.initializeElements()
    this.setupEventListeners()
    this.initializeChart()
    this.checkHapticSupport()
    this.createDebugPanel()
    this.bootstrapUserFromStorage()
  }

  async initializeSupabase() {
    try {
      if (typeof window.supabase === "undefined") {
        // Load Supabase from CDN
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        script.onload = () => {
          this.setupSupabaseClient()
        }
        document.head.appendChild(script)
      } else {
        this.setupSupabaseClient()
      }
    } catch (error) {
      console.error("[v0] Error initializing Supabase:", error)
      this.updateDebugPanel(`Database initialization error: ${error.message}`)
    }
  }

  setupSupabaseClient() {
    try {
      const supabaseUrl = window.SUPABASE_URL || "https://your-project.supabase.co"
      const supabaseKey = window.SUPABASE_ANON_KEY || "your-anon-key"

      console.log("[v0] Using Supabase URL:", supabaseUrl)
      console.log("[v0] Using Supabase Key:", supabaseKey ? "***" + supabaseKey.slice(-4) : "not found")

      if (
        supabaseUrl === "https://your-project.supabase.co" ||
        supabaseKey === "your-anon-key" ||
        !supabaseUrl ||
        !supabaseKey
      ) {
        throw new Error("Supabase credentials not properly configured")
      }

      this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

      console.log("[v0] Supabase client initialized successfully")
      this.updateDebugPanel("Database connected successfully")
      this.addTestDatabaseButton()

      // Test the connection
      this.testSupabaseConnection()
    } catch (error) {
      console.error("[v0] Error setting up Supabase client:", error)
      this.updateDebugPanel(`Database setup error: ${error.message}`)
    }
  }

  async testSupabaseConnection() {
    try {
      const { data, error } = await this.supabase.from("sessions").select("count").limit(1)
      if (error) {
        console.error("[v0] Supabase connection test failed:", error)
        this.updateDebugPanel(`Database connection failed: ${error.message}`)
      } else {
        console.log("[v0] Supabase connected successfully")
        this.updateDebugPanel("Database connected successfully")
        this.addTestDatabaseButton()
      }
    } catch (error) {
      console.error("[v0] Connection test error:", error)
      this.updateDebugPanel(`Connection test failed: ${error.message}`)
    }
  }

  addTestDatabaseButton() {
    const testBtn = document.createElement("button")
    testBtn.textContent = "Test DB Save"
    testBtn.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: #4299e1;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      cursor: pointer;
      z-index: 1001;
    `
    testBtn.addEventListener("click", () => this.testDatabaseSave())
    document.body.appendChild(testBtn)
  }

  async testDatabaseSave() {
    try {
      console.log("[v0] Testing database save...")
      this.updateDebugPanel("Testing database save...")

      if (!this.userEmail) {
        alert("Please set your email first")
        return
      }

      // Test session creation
      const testSessionData = {
        email: this.userEmail,
        start_time: new Date().toISOString(),
      }

      const { data: sessionData, error: sessionError } = await this.supabase
        .from("sessions")
        .insert([testSessionData])
        .select()
        .single()

      if (sessionError) {
        console.error("[v0] Test session creation failed:", sessionError)
        this.updateDebugPanel(`Test session failed: ${sessionError.message}`)
        return
      }

      console.log("[v0] Test session created:", sessionData)
      this.updateDebugPanel(`Test session created: ${sessionData.id}`)

      // Test data point creation
      const testDataPoint = {
        session_id: sessionData.id,
        timestamp: new Date().toISOString(),
        value: 42,
      }

      const { data: dataPointData, error: dataPointError } = await this.supabase
        .from("data_points")
        .insert([testDataPoint])
        .select()
        .single()

      if (dataPointError) {
        console.error("[v0] Test data point creation failed:", dataPointError)
        this.updateDebugPanel(`Test data point failed: ${dataPointError.message}`)
        return
      }

      console.log("[v0] Test data point created:", dataPointData)
      this.updateDebugPanel(`Test data point created: ${dataPointData.id}`)

      alert("Database test successful! Check admin dashboard.")
    } catch (error) {
      console.error("[v0] Database test error:", error)
      this.updateDebugPanel(`Test error: ${error.message}`)
      alert(`Database test failed: ${error.message}`)
    }
  }

  getApiBaseUrl() {
    // Check if we're running locally
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3000/api"
    }

    // For deployed environments, use the same origin
    return `${window.location.origin}/api`
  }

  initializeElements() {
    this.dialThumb = document.getElementById("dial-thumb")
    this.dialTrack = document.querySelector(".dial-track")
    this.currentValueDisplay = document.getElementById("current-value")
    this.intensityFill = document.getElementById("intensity-fill")
    this.sessionTimerDisplay = document.getElementById("session-timer")

    this.startBtn = document.getElementById("start-btn")
    this.pauseBtn = document.getElementById("pause-btn")
    this.resetBtn = document.getElementById("reset-btn")
    this.exportBtn = document.getElementById("export-btn")
    this.changeUserBtn = document.getElementById("change-user-btn")
    this.syncBtn = document.getElementById("sync-btn") // Added manual sync button

    this.avgResponseDisplay = document.getElementById("avg-response")
    this.maxResponseDisplay = document.getElementById("max-response")
    this.minResponseDisplay = document.getElementById("min-response")
    this.dataPointsDisplay = document.getElementById("data-points")

    this.chartCanvas = document.getElementById("response-chart")
    this.chartCtx = this.chartCanvas.getContext("2d")
  }

  showUserModal() {
    const modal = document.createElement("div")
    modal.className = "user-modal"
    modal.innerHTML = `
            <div class="modal-content">
                <h2>Welcome to Emotional Dial Tester</h2>
                <p>Please enter your email to start recording sessions:</p>
                <input type="email" id="user-email" placeholder="your.email@example.com" required>
                <div class="modal-buttons">
                    <button id="save-email-btn" class="control-btn primary">Continue</button>
                </div>
            </div>
        `
    document.body.appendChild(modal)

    const emailInput = document.getElementById("user-email")
    const saveBtn = document.getElementById("save-email-btn")

    saveBtn.addEventListener("click", () => {
      const email = emailInput.value.trim()
      if (this.isValidEmail(email)) {
        this.setUserEmail(email)
        document.body.removeChild(modal)
      } else {
        alert("Please enter a valid email address")
      }
    })

    emailInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveBtn.click()
      }
    })
  }

  bootstrapUserFromStorage() {
    try {
      this.updateDebugPanel("Checking localStorage...")
      const savedEmail = localStorage.getItem("edt:userEmail")
      console.log("[v0] Checking saved email:", savedEmail)

      if (savedEmail && this.isValidEmail(savedEmail)) {
        console.log("[v0] Found valid saved email, setting user")
        this.updateDebugPanel(`Found email: ${savedEmail}`)
        this.setUserEmail(savedEmail)
      } else {
        console.log("[v0] No valid saved email, showing modal")
        this.updateDebugPanel("No saved email, showing modal")
        // Disable Start until email is set
        if (this.startBtn) this.startBtn.disabled = true
        this.showUserModal()
      }
    } catch (error) {
      console.error("[v0] Error bootstrapping user:", error)
      this.updateDebugPanel(`Bootstrap error: ${error.message}`)
      // Show modal as fallback
      if (this.startBtn) this.startBtn.disabled = true
      this.showUserModal()
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async setUserEmail(email) {
    try {
      console.log("[v0] Setting user email:", email)
      this.updateDebugPanel(`Setting email: ${email}`)
      this.userEmail = email

      try {
        localStorage.setItem("edt:userEmail", email)
        console.log("[v0] Email saved to localStorage successfully")
        this.updateDebugPanel("Email saved to localStorage")
      } catch (storageError) {
        console.error("[v0] localStorage error:", storageError)
        this.updateDebugPanel(`Storage error: ${storageError.message}`)
        // Fallback for Safari private mode or storage issues
        this.userEmail = email // Keep in memory at least
      }

      console.log("[v0] User set successfully:", { email })
      this.updateUserDisplay()
      // Enable Start once email is set
      if (this.startBtn) {
        this.startBtn.disabled = false
        console.log("[v0] Start button enabled")
        this.updateDebugPanel("Start button enabled")
      }
    } catch (error) {
      console.error("[v0] Error setting user:", error)
      this.updateDebugPanel(`SetUser error: ${error.message}`)
      alert("Failed to save user data. You can still use the app, but data may not persist.")
      // Still allow the app to work even if storage fails
      this.userEmail = email
      this.updateUserDisplay()
      if (this.startBtn) this.startBtn.disabled = false
    }
  }

  updateUserDisplay() {
    const header = document.querySelector(".header h1")
    header.innerHTML = `Emotional Response Dial Tester<br><small>User: ${this.userEmail}</small>`
  }

  setupEventListeners() {
    // Dial interaction
    this.dialTrack.addEventListener("click", (e) => this.handleDialClick(e))
    this.dialThumb.addEventListener("mousedown", (e) => this.startDrag(e))
    this.dialThumb.addEventListener("touchstart", (e) => this.startDrag(e))

    // Global mouse/touch events
    document.addEventListener("mousemove", (e) => this.handleDrag(e))
    document.addEventListener("mouseup", () => this.endDrag())
    document.addEventListener("touchmove", (e) => this.handleDrag(e))
    document.addEventListener("touchend", () => this.endDrag())

    // Control buttons
    this.startBtn.addEventListener("click", () => this.startSession())
    this.pauseBtn.addEventListener("click", () => this.pauseSession())
    this.resetBtn.addEventListener("click", () => this.resetSession())
    this.exportBtn.addEventListener("click", () => this.exportData())
    if (this.changeUserBtn) {
      this.changeUserBtn.addEventListener("click", () => {
        this.showUserModal()
      })
    }
    if (this.syncBtn) {
      this.syncBtn.addEventListener("click", () => {
        this.manualSync()
      })
    }

    // Prevent default touch behaviors
    this.dialTrack.addEventListener("touchstart", (e) => e.preventDefault())
    this.dialTrack.addEventListener("touchmove", (e) => e.preventDefault())
  }

  checkHapticSupport() {
    this.hapticSupported = "vibrate" in navigator
    console.log("Haptic feedback supported:", this.hapticSupported)
  }

  triggerHapticFeedback(intensity = "medium") {
    if (!this.hapticSupported) return

    const patterns = {
      light: [10],
      medium: [20],
      strong: [50],
      double: [20, 10, 20],
    }

    navigator.vibrate(patterns[intensity] || patterns.medium)

    // Visual feedback
    this.dialThumb.classList.add("haptic-feedback")
    setTimeout(() => {
      this.dialThumb.classList.remove("haptic-feedback")
    }, 100)
  }

  handleDialClick(e) {
    if (this.isDragging) return

    const rect = this.dialTrack.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))

    this.updateDialPosition(percentage)
    this.triggerHapticFeedback("light")
  }

  startDrag(e) {
    this.isDragging = true
    this.dialThumb.style.cursor = "grabbing"
    e.preventDefault()
  }

  handleDrag(e) {
    if (!this.isDragging) return

    const rect = this.dialTrack.getBoundingClientRect()
    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const dragX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, dragX / rect.width))

    this.updateDialPosition(percentage)

    // Trigger haptic feedback based on movement intensity
    const movement = Math.abs(percentage - this.currentValue)
    if (movement > 0.1) {
      this.triggerHapticFeedback("light")
    }
  }

  endDrag() {
    this.isDragging = false
    this.dialThumb.style.cursor = "grab"
  }

  updateDialPosition(percentage) {
    const trackWidth = this.dialTrack.offsetWidth
    const thumbWidth = this.dialThumb.offsetWidth
    const maxPosition = trackWidth - thumbWidth
    const newPosition = percentage * maxPosition

    this.dialThumb.style.left = `${newPosition}px`

    // Convert percentage to -100 to +100 scale
    this.currentValue = Math.round((percentage - 0.5) * 200)
    this.updateDisplay()
    this.recordDataPoint()
  }

  updateDisplay() {
    this.currentValueDisplay.textContent = this.currentValue

    // Update intensity bar
    const intensity = Math.abs(this.currentValue) / 100
    this.intensityFill.style.width = `${intensity * 100}%`

    // Update intensity bar color based on value
    if (this.currentValue < -50) {
      this.intensityFill.style.background = "#e53e3e"
    } else if (this.currentValue > 50) {
      this.intensityFill.style.background = "#48bb78"
    } else {
      this.intensityFill.style.background = "linear-gradient(90deg, #e53e3e 0%, #f6ad55 50%, #48bb78 100%)"
    }
  }

  recordDataPoint() {
    if (!this.isRecording) return

    const timestamp = Date.now() - this.sessionStartTime
    const dataPoint = {
      timestamp,
      value: this.currentValue,
      time: new Date().toISOString(),
    }

    this.dataPoints.push(dataPoint)
    console.log("[v0] Data point recorded:", dataPoint)

    if (this.supabase && this.sessionId && !this.sessionId.startsWith("local_")) {
      this.saveDataPointToDatabase(dataPoint)
    }

    this.updateChart()
    this.updateSummary()
  }

  async saveDataPointToDatabase(dataPoint) {
    try {
      const dbDataPoint = {
        session_id: this.sessionId,
        timestamp: new Date(this.sessionStartTime + dataPoint.timestamp).toISOString(),
        value: dataPoint.value,
      }

      const { error } = await this.supabase.from("data_points").insert([dbDataPoint])

      if (error) {
        console.error("[v0] Failed to save data point to database:", error)
        this.updateDebugPanel(`DB save failed: ${error.message}`)
      } else {
        console.log("[v0] Data point saved to database:", dbDataPoint)
      }
    } catch (error) {
      console.error("[v0] Error saving data point to database:", error)
      this.updateDebugPanel(`DB save error: ${error.message}`)
    }
  }

  async startSession() {
    if (!this.userEmail) {
      alert("Please set your email first")
      return
    }

    if (!this.supabase) {
      alert("Database connection required. Please check your internet connection and try again.")
      this.updateDebugPanel("Database connection required")
      return
    }

    try {
      this.updateDebugPanel("Starting session...")

      // Create session in database
      const sessionData = {
        email: this.userEmail,
        start_time: new Date().toISOString(),
      }

      const { data, error } = await this.supabase.from("sessions").insert([sessionData]).select().single()

      if (error) {
        throw error
      }

      this.sessionId = data.id
      this.isRecording = true
      this.sessionStartTime = Date.now()
      this.dataPoints = []

      this.startBtn.disabled = true
      this.pauseBtn.disabled = false

      this.startTimer()
      this.triggerHapticFeedback("double")

      console.log("[v0] Session started successfully")
      this.updateDebugPanel("Session active")
    } catch (error) {
      console.error("[v0] Session creation failed:", error)
      this.updateDebugPanel(`Session failed: ${error.message}`)
      alert("Failed to start session. Please check your internet connection and try again.")
    }
  }

  async pauseSession() {
    this.isRecording = false
    clearInterval(this.sessionTimer)

    this.startBtn.disabled = false
    this.pauseBtn.disabled = true

    if (this.sessionId && this.dataPoints.length > 0) {
      await this.saveDataPointsToDatabase()
    }

    this.triggerHapticFeedback("medium")
    this.updateDebugPanel("Session paused")
  }

  async resetSession() {
    if (this.sessionId && this.dataPoints.length > 0) {
      await this.finalizeSessionInDatabase()
    }

    this.isRecording = false
    this.sessionStartTime = null
    this.sessionId = null
    clearInterval(this.sessionTimer)
    this.dataPoints = []

    this.sessionTimerDisplay.textContent = "00:00"
    this.currentValue = 0
    this.updateDialPosition(0.5)
    this.updateDisplay()
    this.updateChart()
    this.updateSummary()

    this.triggerHapticFeedback("strong")
    this.updateDebugPanel("Session reset")
  }

  startTimer() {
    this.sessionTimer = setInterval(() => {
      const elapsed = Date.now() - this.sessionStartTime
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      this.sessionTimerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }, 1000)
  }

  initializeChart() {
    this.chartData = []
    this.chartMaxPoints = 100
    this.drawChart()
  }

  updateChart() {
    if (this.dataPoints.length === 0) return

    // Keep only recent data points for performance
    if (this.dataPoints.length > this.chartMaxPoints) {
      this.chartData = this.dataPoints.slice(-this.chartMaxPoints)
    } else {
      this.chartData = [...this.dataPoints]
    }

    this.drawChart()
  }

  drawChart() {
    const canvas = this.chartCanvas
    const ctx = this.chartCtx
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (this.chartData.length < 2) return

    // Set up chart area
    const padding = 20
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Draw zero line
    ctx.strokeStyle = "#4a5568"
    ctx.lineWidth = 2
    const zeroY = padding + chartHeight / 2
    ctx.beginPath()
    ctx.moveTo(padding, zeroY)
    ctx.lineTo(width - padding, zeroY)
    ctx.stroke()

    // Draw data line
    if (this.chartData.length > 1) {
      ctx.strokeStyle = "#4299e1"
      ctx.lineWidth = 3
      ctx.beginPath()

      const maxTime = Math.max(...this.chartData.map((d) => d.timestamp))
      const minTime = Math.min(...this.chartData.map((d) => d.timestamp))
      const timeRange = maxTime - minTime || 1

      this.chartData.forEach((point, index) => {
        const x = padding + ((point.timestamp - minTime) / timeRange) * chartWidth
        const y = padding + chartHeight / 2 - (point.value / 100) * (chartHeight / 2)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    // Draw data points
    ctx.fillStyle = "#4299e1"
    this.chartData.forEach((point) => {
      const x =
        padding +
        ((point.timestamp - (this.chartData[0]?.timestamp || 0)) /
          Math.max(
            1,
            (this.chartData[this.chartData.length - 1]?.timestamp || 0) - (this.chartData[0]?.timestamp || 0),
          )) *
          chartWidth
      const y = padding + chartHeight / 2 - (point.value / 100) * (chartHeight / 2)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  updateSummary() {
    if (this.dataPoints.length === 0) {
      this.avgResponseDisplay.textContent = "0"
      this.maxResponseDisplay.textContent = "0"
      this.minResponseDisplay.textContent = "0"
      this.dataPointsDisplay.textContent = "0"
      return
    }

    const values = this.dataPoints.map((d) => d.value)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const max = Math.max(...values)
    const min = Math.min(...values)

    this.avgResponseDisplay.textContent = avg
    this.maxResponseDisplay.textContent = max
    this.minResponseDisplay.textContent = min
    this.dataPointsDisplay.textContent = this.dataPoints.length
  }

  async saveDataPointsToDatabase() {
    if (!this.sessionId || this.dataPoints.length === 0) return

    if (!this.supabase) {
      throw new Error("Database connection required")
    }

    try {
      // Convert data points to database format
      const dbDataPoints = this.dataPoints.map((point) => ({
        session_id: this.sessionId,
        timestamp: new Date(this.sessionStartTime + point.timestamp).toISOString(),
        value: point.value,
      }))

      const { error } = await this.supabase.from("data_points").insert(dbDataPoints)

      if (error) {
        console.error("[v0] Database data points save error:", error)
        this.updateDebugPanel(`DB save error: ${error.message}`)
        throw error
      } else {
        console.log("[v0] Data points saved to database successfully")
        this.updateDebugPanel("Data points saved to database")
      }
    } catch (error) {
      console.error("[v0] Error saving data points to database:", error)
      this.updateDebugPanel(`DB save error: ${error.message}`)
      throw error
    }
  }

  async finalizeSessionInDatabase() {
    if (!this.sessionId) return

    if (!this.supabase) {
      throw new Error("Database connection required")
    }

    try {
      const endTime = new Date().toISOString()

      // Save data points first
      if (this.dataPoints.length > 0) {
        await this.saveDataPointsToDatabase()
      }

      // Update session with final data
      const { error } = await this.supabase
        .from("sessions")
        .update({
          end_time: endTime,
        })
        .eq("id", this.sessionId)

      if (error) {
        console.error("[v0] Database session finalize error:", error)
        this.updateDebugPanel(`DB finalize error: ${error.message}`)
        throw error
      } else {
        console.log("[v0] Session finalized in database successfully")
        this.updateDebugPanel("Session finalized in database")
      }
    } catch (error) {
      console.error("[v0] Error finalizing session in database:", error)
      this.updateDebugPanel(`DB finalize error: ${error.message}`)
      throw error
    }
  }

  async exportData() {
    if (this.dataPoints.length === 0) {
      alert("No data to export. Start a session first.")
      return
    }

    try {
      if (this.sessionId) {
        const { data: sessionData, error: sessionError } = await this.supabase
          .from("sessions")
          .select("*")
          .eq("id", this.sessionId)
          .single()

        const { data: dataPointsData, error: dataPointsError } = await this.supabase
          .from("data_points")
          .select("*")
          .eq("session_id", this.sessionId)
          .order("timestamp")

        if (!sessionError && !dataPointsError && sessionData) {
          const exportData = {
            session: sessionData,
            dataPoints: dataPointsData,
            exportedAt: new Date().toISOString(),
          }

          const dataStr = JSON.stringify(exportData, null, 2)
          const dataBlob = new Blob([dataStr], { type: "application/json" })

          const link = document.createElement("a")
          link.href = URL.createObjectURL(dataBlob)
          link.download = `session-${this.sessionId}.json`
          link.click()

          this.triggerHapticFeedback("medium")
          this.updateDebugPanel("Data exported from database")
          return
        }
      }
    } catch (error) {
      console.error("[v0] Error exporting from database:", error)
      this.updateDebugPanel(`DB export error: ${error.message}`)
    }

    // Fallback to local data export
    const exportData = {
      sessionInfo: {
        startTime: new Date(this.sessionStartTime).toISOString(),
        duration: this.sessionTimerDisplay.textContent,
        totalDataPoints: this.dataPoints.length,
      },
      summary: {
        averageResponse: Math.round(this.dataPoints.reduce((a, b) => a + b.value, 0) / this.dataPoints.length),
        maxResponse: Math.max(...this.dataPoints.map((d) => d.value)),
        minResponse: Math.min(...this.dataPoints.map((d) => d.value)),
      },
      dataPoints: this.dataPoints,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `emotional-response-data-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    this.triggerHapticFeedback("medium")
    this.updateDebugPanel("Data exported from local storage")
  }

  createDebugPanel() {
    const debugPanel = document.createElement("div")
    debugPanel.id = "debug-panel"
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
      max-width: 200px;
      font-family: monospace;
    `
    document.body.appendChild(debugPanel)
    this.debugPanel = debugPanel
    this.updateDebugPanel("Debug panel created")
  }

  updateDebugPanel(message) {
    if (!this.debugPanel) return
    const timestamp = new Date().toLocaleTimeString()
    this.debugPanel.innerHTML = `
      <div><strong>Debug Info:</strong></div>
      <div>Email: ${this.userEmail || "NOT SET"}</div>
      <div>Session: ${this.sessionId || "NONE"}</div>
      <div>Recording: ${this.isRecording}</div>
      <div>Start Btn: ${this.startBtn ? (this.startBtn.disabled ? "DISABLED" : "ENABLED") : "NOT FOUND"}</div>
      <div>Last: ${timestamp}</div>
      <div style="margin-top:5px; font-size:10px;">${message}</div>
    `
  }

  async manualSync() {
    this.updateDebugPanel("Manual sync no longer needed - using live database")

    // Show success message to user
    const syncBtn = document.getElementById("sync-btn")
    if (syncBtn) {
      const originalText = syncBtn.textContent
      syncBtn.textContent = "✓ Live DB!"
      syncBtn.style.background = "#48bb78"
      setTimeout(() => {
        syncBtn.textContent = originalText
        syncBtn.style.background = ""
      }, 2000)
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new EmotionalDialTester()
})

// Service Worker registration for PWA capabilities
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
