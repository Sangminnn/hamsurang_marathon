#!/bin/bash

# Hamsurang Marathon - Dev Start Script
# Usage: ./start.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Kill existing processes on ports 2567 (server) and 5173 (web)
echo "Stopping existing processes..."
lsof -ti:2567 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start server in background
echo "Starting game server (port 2567)..."
pnpm dev:server &
SERVER_PID=$!

# Start web with --host for LAN access
echo "Starting web dev server (port 5173, LAN enabled)..."
pnpm dev:web -- --host &
WEB_PID=$!

# Get LAN IP
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")

echo ""
echo "========================================="
echo "  Hamsurang Marathon Dev Servers"
echo "========================================="
echo "  Web (local):  http://localhost:5173"
echo "  Web (LAN):    http://${LAN_IP}:5173"
echo "  Server:       ws://${LAN_IP}:2567"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all servers."

# Trap Ctrl+C to kill both processes
trap "echo 'Shutting down...'; kill $SERVER_PID $WEB_PID 2>/dev/null; exit 0" INT TERM

# Wait for both
wait
