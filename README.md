# GenAI Store — AI-Powered Store Builder

A local clone of genstore.ai. Type a store idea ? Gemini generates a complete store in seconds.

## Quick Start

### 1. Backend setup
"``bash
cd backend
pip install -r requirements.txt
"``

Add your Gemini API key to .env:

"``
GEMINI_API_KEY=your_key_here
"``

Get a free key at: https://aistudio.google.com/app/apikey

Start the backend:
"``bash
uvicorn main:app --reload
"``
Backend runs at http://localhost:8000

### 2. Frontend setup
"``bash
cd frontend
npm install
npm run dev
"``
Frontend runs at http://localhost:5173

## Features
- ? Generate a complete store from one text prompt
- ?? AI-generated store name, tagline, theme color, and 5 products
- ?? Add, edit, delete products manually
- ? AI-generate more products for any store
- ?? AI-rewrite product descriptions with one click
- ?? Floating AI chat assistant with full store context
- ?? Per-store theme color applied throughout the UI
- ?? All data saved to stores.json locally

## Project Structure
- ackend/main.py — FastAPI routes
- ackend/gemini.py — All Gemini AI calls
- ackend/storage.py — JSON read/write helpers
- ackend/stores.json — All store data (auto-created)
- rontend/src/pages/ — Home, StorePage, Dashboard
- rontend/src/components/ — Reusable UI components

