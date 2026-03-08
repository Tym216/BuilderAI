"""
BuilderAI Agent - Orchestrator that ties Planner → Coder → Runner together.

Architecture:
  - Planner: 1 LLM call to analyze prompt and create project plan
  - Coder:   1 LLM call to generate ALL code files in batch
  - Runner:  0 LLM calls, writes files to disk, installs deps, starts dev server

Total: 2 LLM calls per build
"""

from typing import AsyncGenerator

from planner import Planner
from coder import Coder, CoderResult
from runner import Runner


class BuilderAgent:
    """
    Orchestrates the full build pipeline.
    
    Pipeline: Planner (1 LLM call) → Coder (1 LLM call) → Runner (real build)
    """

    def __init__(self, api_key: str, base_url: str, model: str = "qwen3.5-plus"):
        self.planner = Planner(api_key, base_url, model)
        self.coder = Coder(api_key, base_url, model)
        self.runner = Runner()

    async def run_build(self, prompt: str) -> AsyncGenerator[dict, None]:
        """
        Full build pipeline:
          1. Planner analyzes prompt → project plan (1 LLM call)
          2. Coder generates ALL files in batch (1 LLM call)
          3. Runner writes files, installs deps, starts dev server (0 LLM calls)
        
        All steps stream events to the frontend for real-time display.
        """
        plan_data = None

        # ── Phase 1: Plan (1 LLM call) ──
        async for event in self.planner.plan(prompt):
            yield event
            if event["type"] == "plan":
                plan_data = event["data"]
            if event["type"] == "error" and plan_data is None:
                return

        if not plan_data:
            yield {
                "type": "error",
                "message": "❌ Build failed: Could not create project plan.",
            }
            return

        # ── Phase 2: Generate ALL code (1 LLM call) ──
        yield {
            "type": "status",
            "step": "generating",
            "message": "🔨 Generating code for all files in a single pass...",
        }

        coder_result = CoderResult()
        async for event in self.coder.generate(prompt, plan_data, coder_result):
            yield event
            # Stop on fatal error during generation
            if event["type"] == "error":
                return

        # ── Phase 3: Real Build & Run (0 LLM calls) ──
        async for event in self.runner.finalize(plan_data, coder_result.generated_files):
            yield event

    async def close(self):
        """Clean up HTTP clients. Note: we do NOT kill the dev server here
        because it needs to keep running for the preview to work."""
        await self.planner.close()
        await self.coder.close()
        # Don't call runner.cleanup() - the dev server should keep running