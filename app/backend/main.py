"""
BuilderAI Backend - FastAPI server with WebSocket for real-time code generation.

Architecture:
  - Planner: Analyzes prompt → project plan (1 LLM call)
  - Coder:   Generates ALL files in batch (1 LLM call)  
  - Runner:  Simulates build/deploy (0 LLM calls)
  
Total per build: 2 LLM calls (previously N+1)
"""

import json
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import BuilderAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("builderai")

DEFAULT_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 BuilderAI Backend starting...")
    logger.info("📐 Architecture: Planner (1 call) → Coder (1 call) → Runner (0 calls)")
    yield
    logger.info("👋 BuilderAI Backend shutting down...")


app = FastAPI(
    title="BuilderAI Backend",
    description="AI-powered software builder using Qwen LLM — optimized 2-call architecture",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class TestConnectionRequest(BaseModel):
    api_key: str
    base_url: str
    model: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="BuilderAI Backend",
        version="2.0.0",
    )


@app.post("/api/test-connection", response_model=TestConnectionResponse)
async def test_connection(req: TestConnectionRequest):
    """Test API connection by making a minimal LLM request."""
    api_key = req.api_key.strip()
    base_url = req.base_url.strip() or DEFAULT_BASE_URL
    model = req.model.strip() or "qwen3.5-plus"

    if not api_key:
        return TestConnectionResponse(
            success=False,
            message="API Key is required.",
        )

    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        follow_redirects=True,
    )

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            http_client=http_client,
        )

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Hi"},
            ],
            max_tokens=5,
        )

        if response.choices and response.choices[0].message.content:
            return TestConnectionResponse(
                success=True,
                message=f"Connection successful! Model '{model}' is responding.",
            )
        else:
            return TestConnectionResponse(
                success=False,
                message="Connected but received empty response from the model.",
            )

    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "api key" in error_msg.lower() or "401" in error_msg:
            return TestConnectionResponse(
                success=False,
                message="Invalid API Key. Please check your key.",
            )
        elif "rate" in error_msg.lower() or "429" in error_msg:
            return TestConnectionResponse(
                success=False,
                message="Rate limit exceeded. Please wait and try again.",
            )
        elif "connect" in error_msg.lower() or "timeout" in error_msg.lower():
            return TestConnectionResponse(
                success=False,
                message=f"Cannot connect to {base_url}. Please check the URL.",
            )
        elif "model" in error_msg.lower() or "not found" in error_msg.lower() or "404" in error_msg:
            return TestConnectionResponse(
                success=False,
                message=f"Model '{model}' not found. Please check the model name.",
            )
        else:
            return TestConnectionResponse(
                success=False,
                message=f"Connection failed: {error_msg}",
            )
    finally:
        try:
            await http_client.aclose()
        except Exception:
            pass


@app.websocket("/ws/build")
async def websocket_build(websocket: WebSocket):
    """
    WebSocket endpoint for real-time software building.

    Client sends:
    {
        "type": "start_build",
        "prompt": "Build me a todo app...",
        "api_key": "sk-...",
        "base_url": "https://coding.dashscope.aliyuncs.com/v1",
        "model": "qwen3.5-plus"
    }

    Server streams back events with types:
    - status: Build step updates
    - plan: Project plan with file list
    - file_tree: File tree structure
    - code_start: Starting code generation for a file
    - code_chunk: Streaming code content
    - code_complete: Finished generating a file
    - log: Terminal log messages
    - preview_url: URL to preview the built app
    - error: Error messages
    - complete: Build finished

    Architecture: 2 LLM calls total (plan + batch code generation)
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON message"}
                )
                continue

            msg_type = message.get("type")

            if msg_type == "start_build":
                prompt = message.get("prompt", "").strip()
                api_key = message.get("api_key", "").strip()
                base_url = message.get(
                    "base_url",
                    DEFAULT_BASE_URL,
                ).strip()
                model = message.get("model", "qwen3.5-plus").strip()

                if not prompt:
                    await websocket.send_json(
                        {"type": "error", "message": "Prompt cannot be empty."}
                    )
                    continue

                if not api_key:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "API Key is required. Please configure it in Settings.",
                        }
                    )
                    continue

                logger.info(
                    f"Starting build - Model: {model}, Base URL: {base_url}"
                )
                logger.info(
                    "Pipeline: Planner (1 LLM call) → Coder (1 LLM call) → Runner (0 calls)"
                )

                agent = BuilderAgent(
                    api_key=api_key,
                    base_url=base_url,
                    model=model,
                )

                try:
                    async for event in agent.run_build(prompt):
                        await websocket.send_json(event)
                except WebSocketDisconnect:
                    logger.info("Client disconnected during build")
                    return
                except Exception as e:
                    logger.error(f"Build error: {e}")
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": f"Build failed: {str(e)}",
                        }
                    )
                finally:
                    await agent.close()

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            else:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}",
                    }
                )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)