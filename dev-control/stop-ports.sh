#!/bin/bash

echo "Stopping anything on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Stopping anything on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "Stopping stray Next.js dev processes..."
pkill -f "next dev" 2>/dev/null || true

echo "Done."