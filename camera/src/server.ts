import "dotenv/config";
import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import FormData from "form-data";

/**
 * =========================
 * Hackathon constants
 * =========================
 */
const PORT = parseInt(process.env.PORT || "5055", 10);
const CAMERA_LOCATION = process.env.CAMERA_LOCATION || process.env.CAMERA_NAME || "CAM_12";

// Use a looping mp4 as the camera feed (stable for hackathon demos)
// Can be overridden via VIDEO_INPUT environment variable for different cameras
const VIDEO_INPUT = process.env.VIDEO_INPUT || "./clip.mp4";

// Unique clip path per camera (prevents collisions when multiple instances run)
const CLIP_FILE_NAME = `.latest_clip_${CAMERA_LOCATION}.mp4`;

// Frame + clip settings
const FPS = 10;               // capture fps into buffer (10 is enough)
const WINDOW_SECS = 10;       // rolling window length for clip

/**
 * =========================
 * Env
 * =========================
 */
const OVERSHOOT_API_KEY = process.env.OVERSHOOT_API_KEY || "ovs_16e2ba18927ea6bfa68cc5bd90048d1f";
const OVERSHOOT_API_URL = process.env.OVERSHOOT_API_URL || "https://cluster1.overshoot.ai/api/v0.2";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const USE_MOCK_ANALYSIS = process.env.USE_MOCK_ANALYSIS === "true"; // Set to "true" to bypass Overshoot

console.log("CWD:", process.cwd());

/**
 * =========================
 * In-memory state
 * =========================
 */
type Frame = { ts: number; jpg: Buffer };

const MAX_FRAMES = FPS * WINDOW_SECS;
let frames: Frame[] = [];

let latestFrame: Buffer | null = null;
let latestFrameTs: number | null = null;

let latestClipPath: string | null = null;
let latestClipTs: number | null = null;
let lastAnalyzedAt: number = 0; // Track when we last analyzed (by time, not clip timestamp)

/**
 * =========================
 * Express server
 * =========================
 */
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Latest camera frame as JPEG
app.get("/latest_frame", (_req, res) => {
  if (!latestFrame) return res.status(404).send("No frame yet");
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "no-store");
  res.send(latestFrame);
});

// Latest clip as MP4
app.get("/latest_clip.mp4", (_req, res) => {
  const clipAbs = path.resolve(process.cwd(), CLIP_FILE_NAME);

  // Debug: log the exact path being used
  console.log("Serving clip:", clipAbs);
  console.log("File exists?", fs.existsSync(clipAbs));
  console.log("CWD:", process.cwd());

  if (!fs.existsSync(clipAbs)) {
    return res.status(404).send("No clip yet");
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Cache-Control", "no-store");

  // Use fs.readFile + res.send instead of sendFile (more reliable)
  try {
    const fileBuffer = fs.readFileSync(clipAbs);
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error reading clip file:", err);
    if (!res.headersSent) {
      res.status(404).send("Error serving clip");
    }
  }
});

// Latest metadata (good for debug + dashboard overlays)
app.get("/latest_state", (_req, res) => {
  res.json({
    cameraLocation: CAMERA_LOCATION,
    latestFrameTs,
    latestClipTs,
    bufferedFrames: frames.length,
  });
});

/**
 * =========================
 * Frame capture (ffmpeg MJPEG -> stdout)
 * =========================
 */
function startFrameCapture() {
  const inputAbs = path.resolve(process.cwd(), VIDEO_INPUT);
  if (!fs.existsSync(inputAbs)) {
    console.error(`VIDEO_INPUT not found: ${inputAbs}`);
    console.error("Place a file at ~/NexHacks/camera/clip.mp4");
    process.exit(1);
  }

  console.log("Starting frame capture from:", inputAbs);

  const ff = spawn("ffmpeg", [
    "-re",                    // read input at its native pace
    "-stream_loop",
    "-1",                     // loop forever (for file sources)
    "-i",
    inputAbs,
    "-vf",
    `fps=${FPS}`,             // sample to FPS
    "-f",
    "mjpeg",                  // output MJPEG stream
    "pipe:1",
  ]);

  // ffmpeg logs go to stderr; keep quiet unless debugging
  ff.stderr.on("data", () => {});

  const SOI = Buffer.from([0xff, 0xd8]); // JPEG start
  const EOI = Buffer.from([0xff, 0xd9]); // JPEG end
  let buf = Buffer.alloc(0);

  ff.stdout.on("data", (chunk: Buffer) => {
    buf = Buffer.concat([buf, chunk]);

    while (true) {
      const start = buf.indexOf(SOI);
      const end = buf.indexOf(EOI);

      if (start === -1 || end === -1 || end < start) break;

      const jpg = buf.slice(start, end + 2);
      buf = buf.slice(end + 2);

      const ts = Date.now();
      latestFrame = jpg;
      latestFrameTs = ts;

      frames.push({ ts, jpg });
      if (frames.length > MAX_FRAMES) frames.shift();
    }
  });

  ff.on("close", (code) => {
    console.error("ffmpeg frame capture exited with code:", code);
    process.exit(1);
  });
}

/**
 * =========================
 * Build mp4 from buffered frames (ffmpeg)
 * =========================
 */
async function buildClipFromFrames(outPath: string, framesToUse: Frame[]) {
  // Unique temp directory per camera to prevent conflicts when multiple instances run
  const tmpDir = path.join(process.cwd(), `.tmp_frames_${CAMERA_LOCATION}`);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  // Write JPEGs as sequential filenames
  framesToUse.forEach((f, i) => {
    const name = `frame_${String(i).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(tmpDir, name), f.jpg);
  });

  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      path.join(tmpDir, "frame_%05d.jpg"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      outPath,
    ]);

    ff.stderr.on("data", () => {});
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg clip exit ${code}`))));
  });
}

/**
 * =========================
 * Analysis loop (Overshoot + backend posting)
 * =========================
 */
type Severity = "informational" | "emergency";

let analysisRunning = false;
let lastEmergencyAt = 0;
let lastEmergencyTitle: string | null = null;
let lastEmergencyDescription: string | null = null;

function canSendEmergency(): boolean {
  const now = Date.now();
  if (now - lastEmergencyAt < 30_000) return false;
  lastEmergencyAt = now;
  return true;
}

async function runMockAnalysis(): Promise<{ title: string; description: string; severity: Severity }> {
  // Mock analysis for testing - generates alternating informational/emergency events
  const mockEvents = [
    { title: "Person walking normally", description: "Normal pedestrian activity observed", severity: "informational" as Severity },
    { title: "Person collapsed on ground", description: "Individual appears to have fallen and not moving", severity: "emergency" as Severity },
    { title: "Vehicle passing by", description: "Standard traffic flow observed", severity: "informational" as Severity },
    { title: "Person lying motionless", description: "Individual on ground showing no movement", severity: "emergency" as Severity },
    { title: "Normal street activity", description: "Regular pedestrian and vehicle movement", severity: "informational" as Severity },
  ];
  
  const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
  console.log(`[Analysis] Mock analysis result:`, randomEvent);
  return randomEvent;
}

async function runOvershootAnalysis(clipPath: string): Promise<{ title: string; description: string; severity: Severity } | null> {
  try {
    console.log(`[Analysis] Starting Overshoot analysis for clip: ${clipPath}`);
    
    // Read the clip file
    const clipBuffer = fs.readFileSync(clipPath);
    console.log(`[Analysis] Clip file size: ${(clipBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Create form data for Overshoot API
    const formData = new FormData();
    formData.append("file", clipBuffer, {
      filename: "clip.mp4",
      contentType: "video/mp4",
    });
    
    const prompt = `You are monitoring city security footage.

Return STRICT JSON only:
{
  "title": string,
  "description": string,
  "severity": "informational" | "emergency"
}

Emergency if the clip shows:
- a person collapsing/falling and not recovering
- a person lying motionless on the ground
- visible serious injury/bleeding
- violent assault
- obvious medical distress requiring urgent help
- NOT IF CARS ARE MOVING NORMALLY

Otherwise informational.

Keep title under 6 words.
Keep description under 25 words.
Do not include any extra keys or text.`;

    formData.append("prompt", prompt);
    formData.append("outputSchema", JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        severity: { type: "string", enum: ["informational", "emergency"] },
      },
      required: ["title", "description", "severity"],
    }));

    console.log(`[Analysis] Calling Overshoot API: ${OVERSHOOT_API_URL}/analyze`);
    
    // Call Overshoot HTTP API
    const response = await fetch(`${OVERSHOOT_API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OVERSHOOT_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log(`[Analysis] Overshoot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analysis] Overshoot API error: ${response.status} ${errorText}`);
      return null;
    }

    const result: any = await response.json();
    console.log(`[Analysis] Overshoot raw response:`, JSON.stringify(result, null, 2));
    
    // Parse the result (might be in result.result or directly in response)
    let parsed: any;
    if (typeof result === "string") {
      parsed = JSON.parse(result);
    } else if (result && typeof result.result === "string") {
      parsed = JSON.parse(result.result);
    } else {
      parsed = result;
    }
    
    console.log(`[Analysis] Parsed result:`, parsed);
    
    return {
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity as Severity,
    };
  } catch (e) {
    console.error("[Analysis] Overshoot analysis error:", (e as Error).message);
    console.error("[Analysis] Error stack:", (e as Error).stack);
    return null;
  }
}

async function postEventToBackend(result: { title: string; description: string; severity: Severity }) {
  try {
    const payload = {
      camera_id: CAMERA_LOCATION,
      severity: result.severity,
      title: result.title,
      description: result.description,
      reference_clip_url: `http://localhost:${PORT}/latest_clip.mp4`, // Each camera serves its own clip at its own port
    };
    
    console.log(`[Analysis] Posting event to backend:`, payload);
    console.log(`[Analysis] Backend URL: ${BACKEND_URL}/process_event`);
    
    const response = await fetch(`${BACKEND_URL}/process_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`[Analysis] Backend response status: ${response.status}`);

    // Always read response as text first (handles both JSON and non-JSON responses)
    const responseText = await response.text();
    console.log(`[Analysis] Backend response text:`, responseText);

    if (!response.ok) {
      console.error(`[Analysis] Backend POST error: ${response.status} - ${responseText}`);
      return false;
    }

    // Try to parse as JSON if successful
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log(`[Analysis] Backend response (parsed):`, responseData);
    } catch (e) {
      // Not JSON, that's okay - just log the text
      console.log(`[Analysis] Backend response is not JSON, using raw text`);
    }

    if (result.severity === "emergency" && response.ok) {
      lastEmergencyTitle = result.title;
      lastEmergencyDescription = result.description;
    }

    console.log(`[Analysis] ✅ Successfully posted ${result.severity} event: ${result.title}`);
    return true;
  } catch (e) {
    console.error("[Analysis] Backend POST error:", (e as Error).message);
    console.error("[Analysis] Error stack:", (e as Error).stack);
    return false;
  }
}

async function runAnalysisAndPost() {
  if (analysisRunning) {
    console.log("[Analysis] Already running, skipping...");
    return;
  }
  analysisRunning = true;

  try {
    if (!latestClipPath || !fs.existsSync(latestClipPath) || !latestClipTs) {
      console.log("[Analysis] Clip not ready yet");
      return; // Clip not ready yet
    }

    // Only analyze if 10 seconds have passed since last analysis
    const now = Date.now();
    if (now - lastAnalyzedAt < 10000) {
      const remaining = Math.ceil((10000 - (now - lastAnalyzedAt)) / 1000);
      console.log(`[Analysis] Waiting ${remaining}s until next analysis`);
      return; // Not yet time for next analysis (wait for new 10-second window)
    }
    
    console.log(`[Analysis] Starting analysis (${Math.floor((now - lastAnalyzedAt) / 1000)}s since last)`);

    // Run analysis (Overshoot or mock)
    let result: { title: string; description: string; severity: Severity } | null;
    
    if (USE_MOCK_ANALYSIS) {
      console.log("[Analysis] Using MOCK analysis mode (bypassing Overshoot)");
      result = await runMockAnalysis();
    } else {
      result = await runOvershootAnalysis(latestClipPath);
      if (!result) {
        console.warn("[Analysis] Overshoot analysis returned null, skipping post");
        return; // Analysis failed, try again next time
      }
    }

    console.log("[Analysis] Overshoot result:", result);

    // Apply cooldown and deduplication for emergencies only
    if (result.severity === "emergency") {
      const isDuplicate =
        lastEmergencyTitle === result.title && lastEmergencyDescription === result.description;
      if (isDuplicate) {
        // Still mark as analyzed even if duplicate
        lastAnalyzedAt = now;
        return;
      }
      if (!canSendEmergency()) {
        // Still mark as analyzed even if cooldown
        lastAnalyzedAt = now;
        return;
      }
    }

    // Post to backend (for both informational and emergency events)
    const posted = await postEventToBackend(result);
    
    // Only mark as analyzed if post succeeded (prevents repeated failures from being hidden)
    if (posted) {
      lastAnalyzedAt = now;
      console.log(`[Analysis] ✅ Successfully posted ${result.severity} event: ${result.title}`);
    } else {
      console.warn(`[Analysis] ❌ Failed to post ${result.severity} event: ${result.title} - will retry next cycle`);
      // Don't set lastAnalyzedAt - this allows retry in the next cycle
    }
  } catch (e) {
    console.warn("Analysis loop error:", (e as Error).message);
  } finally {
    analysisRunning = false;
  }
}

function startAnalysisLoop() {
  console.log("Starting analysis loop...");
  console.log(`[Analysis] Mock mode: ${USE_MOCK_ANALYSIS ? "ENABLED" : "DISABLED"}`);
  console.log(`[Analysis] Backend URL: ${BACKEND_URL}`);
  console.log(`[Analysis] Camera ID: ${CAMERA_LOCATION}`);
  // Run every 10s to analyze each new 10-second clip window
  setInterval(runAnalysisAndPost, 10000);
  // Also run immediately after a short delay to start analyzing
  setTimeout(() => {
    console.log("[Analysis] Running first analysis in 2 seconds...");
    setTimeout(runAnalysisAndPost, 2000);
  }, 2000);
}

/**
 * =========================
 * Clip building loop
 * =========================
 */
function startClipLoop() {
  console.log("Starting clip building loop...");

  setInterval(async () => {
    try {
      if (frames.length < MAX_FRAMES) return;

      const framesToUse = frames.slice(-MAX_FRAMES);
      const clipAbs = path.resolve(process.cwd(), CLIP_FILE_NAME);

      console.log("frames buffered:", frames.length);

      await buildClipFromFrames(clipAbs, framesToUse);

      console.log("clip written:", clipAbs, fs.existsSync(clipAbs));

      latestClipPath = clipAbs;
      latestClipTs = Date.now();
    } catch (e) {
      console.warn("Clip build error:", (e as Error).message);
    }
  }, 1000);
}

/**
 * =========================
 * Start server
 * =========================
 */
app.listen(PORT, () => {
  console.log(`Camera server running on http://localhost:${PORT}`);
  console.log(`Camera location: ${CAMERA_LOCATION}`);
  console.log(`Overshoot API URL: ${OVERSHOOT_API_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  startFrameCapture();
  startClipLoop();
  startAnalysisLoop();
});
