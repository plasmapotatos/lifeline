# Testing the Overshoot Analysis Loop

You need **three things running**: camera server, backend, and frontend. The frontend fetches clips from the camera, sends them to Overshoot, and POSTs to the backend.

---

## 1. Prerequisites

### Video for the camera

The camera server reads from `camera/clip.mp4`. If it’s missing, the server exits.

```bash
# You need any short MP4 in the camera folder, e.g.:
cp /path/to/your/video.mp4 /Users/owen/NexHacks/camera/clip.mp4
```

If you don’t have one, use a sample (e.g. from [Sample Videos](https://sample-videos.com/) or any phone recording). A few seconds is enough.

### Overshoot API key

In `frontend/.env`:

```
VITE_OVERSHOOT_API_KEY=ovs_16e2ba18927ea6bfa68cc5bd90048d1f
```

Restart the frontend after changing `.env`.

---

## 2. Start all three services

Use **3 terminals**.

### Terminal 1 — Camera server (port 5055)

For a single camera instance:

```bash
cd /Users/owen/NexHacks/camera
npm run dev
```

**For multiple cameras (3 instances):**

Run 3 separate camera server instances with different ports, camera names, and video files:

**Terminal 1A - Camera 1 (CAM_12, port 5055, clip1.mp4):**
```bash
cd /Users/owen/NexHacks/camera
CAMERA_LOCATION=CAM_12 PORT=5055 VIDEO_INPUT=./clip1.mp4 npm run dev
```

**Terminal 1B - Camera 2 (CAM_18, port 5056, clip2.mp4):**
```bash
cd /Users/owen/NexHacks/camera
CAMERA_LOCATION=CAM_18 PORT=5056 VIDEO_INPUT=./clip2.mp4 npm run dev
```

**Terminal 1C - Camera 3 (CAM_24, port 5057, clip3.mp4):**
```bash
cd /Users/owen/NexHacks/camera
CAMERA_LOCATION=CAM_24 PORT=5057 VIDEO_INPUT=./clip3.mp4 npm run dev
```

Each camera instance will:
- Use its own video file (specified via `VIDEO_INPUT`)
- Use the same Overshoot API (configured via environment variables)
- Post events to the backend with its unique camera name
- Serve clips at its own port (e.g., `http://localhost:5055/latest_clip.mp4` for CAM_12)

**Note:** If you want all cameras to use the same video file, you can omit the `VIDEO_INPUT` variable and all will default to `./clip.mp4`.

- Wait until you see `clip written: ... true` a few times (clip is built every 1s after ~3s of frames).
- `http://localhost:5055/latest_clip.mp4` should return a video (check in browser or `curl -I`).

### Terminal 2 — Backend (port 8000)

```bash
cd /Users/owen/NexHacks/backend
source venv/bin/activate   # or: . venv/bin/activate
python main.py
```

Or: `uvicorn main:app --reload --host 0.0.0.0 --port 8000` (adjust if your `main` uses a different module path).

- `http://localhost:8000/` should return something like `{"message":"Welcome to Lifeline API!"}` (or your root response).

### Terminal 3 — Frontend (port 5173)

```bash
cd /Users/owen/NexHacks/frontend
npm run dev
```

- Open `http://localhost:5173` in a browser. The analysis loop starts as soon as the app loads.

---

## 3. What to check

### Camera

- `http://localhost:5055/health` → `{"ok":true}`
- `http://localhost:5055/latest_state` → `bufferedFrames`, `latestClipTs`, etc.
- `http://localhost:5055/latest_clip.mp4` → plays or downloads as MP4.

### Backend

- `http://localhost:8000/events` → list of events (initially empty or seeded).
- `http://localhost:8000/ambulances` → list of ambulances.

### Frontend / analysis loop

- **Browser console** (F12 → Console):
  - `analysis: ...` → Overshoot or network errors.
  - No errors and no `Missing VITE_OVERSHOOT_API_KEY` → loop is running.
- **Backend events**: after 2–4 runs of the loop, `GET /events` should show new events (informational or emergency, depending on the clip).

---

## 4. Quick backend-only test (no Overshoot)

To confirm `POST /process_event` works without the frontend:

```bash
curl -X POST http://localhost:8000/process_event \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": "CAM_12",
    "severity": "informational",
    "title": "Test event",
    "description": "Manual curl test",
    "reference_clip_url": "http://localhost:5055/latest_clip.mp4"
  }'
```

Then:

```bash
curl http://localhost:8000/events
```

You should see the new event. For `"severity": "emergency"` you should also see an ambulance assigned when you `GET /ambulances`.

---

## 5. End-to-end flow

1. Camera: ffmpeg reads `clip.mp4` → buffers ~3s of frames → builds `.latest_clip.mp4` every second.
2. Frontend: every 2s, fetches `http://localhost:5055/latest_clip.mp4` → sends to Overshoot → gets `{ title, description, severity }` → POSTs to `http://localhost:8000/process_event` (with cooldown/dedupe for emergencies).
3. Backend: creates `Event`, and for `emergency` assigns the nearest idle ambulance; the ambulance mover updates positions over time.

---

## 6. Common issues

| Symptom | Likely cause |
|--------|---------------|
| Camera exits: `VIDEO_INPUT not found` | No `camera/clip.mp4`. Add any MP4. |
| `latest_clip.mp4` returns 404 | Wait 3–5s after camera start for enough frames; check `latest_state` and `bufferedFrames`. |
| `Missing VITE_OVERSHOOT_API_KEY` | Set it in `frontend/.env` and restart `npm run dev`. |
| `analysis: ...` or CORS in console | Overshoot or backend down; confirm backend and camera URLs and CORS. |
| No new events in `/events` | Clip might be “informational” every time; try a clip with a fall/distress, or use the `curl` test above. |
