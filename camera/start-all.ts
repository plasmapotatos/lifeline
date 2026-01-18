#!/usr/bin/env tsx
/**
 * Start all three camera instances in parallel
 */

/// <reference types="node" />

import { spawn } from "node:child_process";

const cameras = [
  { name: "CAM_12", port: 5055, video: "./clip1.mp4" },
  { name: "Astra-12", port: 5056, video: "./clip2.mp4" },
  { name: "Astra-18", port: 5057, video: "./clip3.mp4" },  // Astra cameras use hyphens
];

console.log("Starting all 3 camera instances...\n");

const processes = cameras.map((cam) => {
  console.log(`Starting ${cam.name} on port ${cam.port} with ${cam.video}`);
  
  const proc = spawn("tsx", ["src/server.ts"], {
    env: {
      ...process.env,
      CAMERA_LOCATION: cam.name,
      PORT: String(cam.port),
      VIDEO_INPUT: cam.video,
    },
    stdio: "inherit",
  });

  proc.on("error", (err) => {
    console.error(`Error starting ${cam.name}:`, err);
  });

  proc.on("exit", (code) => {
    console.log(`${cam.name} exited with code ${code}`);
  });

  return proc;
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down all camera instances...");
  processes.forEach((proc) => proc.kill());
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down all camera instances...");
  processes.forEach((proc) => proc.kill());
  process.exit(0);
});
