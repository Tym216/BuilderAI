# BuilderAI - Full Stack Implementation

## Architecture
- **Frontend**: React + Shadcn/UI + Tailwind (existing)
- **Backend**: Python FastAPI with WebSocket for real-time streaming
- **LLM**: Qwen API (configurable API key + base URL)

## Backend Files (Python - /workspace/app/backend/)
1. **main.py** - FastAPI app with WebSocket endpoint, CORS, health check
2. **agent.py** - LLM agent logic: prompt analysis, planning, code generation per file
3. **requirements.txt** - Python dependencies

## Frontend Files to Modify/Create
4. **src/components/BuildSimulation.tsx** - REWRITE: Connect to backend WebSocket, show real build progress (planning, file tree, code generation per file, logs, errors)
5. **src/components/HeroSection.tsx** - MODIFY: Prompt input triggers real backend call
6. **src/components/SettingsModal.tsx** - NEW: Modal for API Key and Model Base URL configuration
7. **src/pages/Index.tsx** - MODIFY: Add settings button, pass config to build simulation
8. **src/lib/buildApi.ts** - NEW: WebSocket client helper for backend communication

## WebSocket Protocol
Frontend sends:
```json
{ "type": "start_build", "prompt": "...", "api_key": "...", "base_url": "..." }
```

Backend streams back events:
```json
{ "type": "status", "step": "analyzing", "message": "Analyzing prompt..." }
{ "type": "plan", "data": { "description": "...", "files": [...] } }
{ "type": "file_tree", "data": [{ "name": "...", "type": "file|folder", "indent": 0 }] }
{ "type": "code_start", "file": "src/App.tsx" }
{ "type": "code_chunk", "file": "src/App.tsx", "content": "import React..." }
{ "type": "code_complete", "file": "src/App.tsx" }
{ "type": "log", "message": "Installing dependencies..." }
{ "type": "preview_url", "url": "https://..." }
{ "type": "error", "message": "Failed to generate..." }
{ "type": "complete", "message": "Build complete!" }
```

## Error Handling
- Connection failures: retry with exponential backoff
- LLM API errors: display error in terminal, allow retry
- Incomplete generation: show partial results with error state
- Invalid API key: clear error message prompting reconfiguration