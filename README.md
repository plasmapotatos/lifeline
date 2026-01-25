# NexHacks

Real-time emergency response dashboard with a FastAPI backend, React frontend, and a simulated camera feed.

## Tech Stack
- **Backend:** FastAPI, Beanie (MongoDB), Motor, WebSockets
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Query, MapLibre
- **Camera service:** Node.js, Express, ffmpeg
- **Charts:** Recharts

## Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB connection string (Atlas or local)
- ffmpeg installed (for the camera service)

## Setup

### Backend
1. Configure environment variables:
	- Copy [backend/.env.example](backend/.env.example) to backend/.env and fill in values.
2. Install dependencies:
	- `pip install -r backend/requirements.txt`

### Frontend
1. Install dependencies:
	- `cd frontend && npm install`

### Camera Service
1. Install dependencies:
	- `cd camera && npm install`
2. Place a short MP4 at camera/clip.mp4

## Run

Open three terminals and run each service:

### 1) Backend
`cd backend && python main.py`

### 2) Camera Service
`cd camera && npm run dev`

### 3) Frontend
`cd frontend && npm run dev`

Then open http://localhost:5173 on local browser

## Notes
- The frontend consumes live updates over WebSockets at `/ws/live`.
- Use `POST /ambulances/{ambulance_id}/simulate` to simulate an ambulance path.
