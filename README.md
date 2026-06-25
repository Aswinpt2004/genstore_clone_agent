# GenAI Store - Agentic AI Store Builder

A local clone of genstore.ai with an agentic store-building workflow. Type a business goal and the agent plans the workflow, creates a store, expands the catalog, improves copy, and prepares launch advice.

## Quick Start

### 1. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and add your Gemini API key:

```env
GEMINI_API_KEY=your_key_here
```

Get a free key at: https://aistudio.google.com/app/apikey

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at http://localhost:8000

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Features

- Generate a complete store from one text prompt
- Agent mode that plans, calls backend tools, improves products, and writes launch advice
- AI-generated store name, tagline, theme color, and products
- Add, edit, delete products manually
- AI-generate more products for any store
- AI-rewrite product descriptions with one click
- Floating AI chat assistant with full store context
- Per-store theme color applied throughout the UI
- All data saved to `backend/stores.json` locally

## Agentic Workflow

The app includes a store-building agent at `POST /api/agent/run`.

Instead of returning a single model response, the agent receives a business goal, asks Gemini to choose the next action, executes one backend tool, observes the updated store state, and repeats until the build is complete.

Agent tools include:

- `create_store`
- `generate_more_products`
- `improve_all_descriptions`
- `update_store_branding`
- `write_launch_advice`
- `finish`

This makes the project an agentic AI store builder: the model plans a multi-step workflow and uses application tools to complete the user's ecommerce goal.

## Project Structure

- `backend/main.py` - FastAPI routes
- `backend/agent.py` - Agent loop and tool execution
- `backend/gemini.py` - Gemini AI calls
- `backend/storage.py` - JSON read/write helpers
- `backend/stores.json` - Local generated store data, ignored by Git
- `frontend/src/pages/` - Home, StorePage, Dashboard
- `frontend/src/components/` - Reusable UI components
