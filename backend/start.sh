#!/bin/bash

# Exit on error
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting application..."
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
