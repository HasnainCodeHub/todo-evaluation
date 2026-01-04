# Vercel Serverless Function Entry Point
# This file exposes the FastAPI app for Vercel's Python runtime

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel expects a variable named 'app' or 'handler'
# FastAPI app is ASGI-compatible and works directly
