"""
BuilderAI Planner - Analyzes user prompts and creates project plans.
Single LLM call to produce a structured project plan.
"""

import json
from typing import AsyncGenerator

import httpx
from openai import AsyncOpenAI

SYSTEM_PROMPT = """You are BuilderAI, an expert software architect and full-stack developer.
Given a user's description of software they want to build, you must:

1. Analyze the requirements
2. Create a project plan with a clear description
3. Define the file structure needed

Respond ONLY with valid JSON in this exact format:
{
  "description": "Brief description of what will be built",
  "tech_stack": ["React", "TypeScript", "Tailwind CSS"],
  "files": [
    {
      "path": "src/App.tsx",
      "description": "Main application component with routing"
    },
    {
      "path": "src/components/Header.tsx",
      "description": "Navigation header component"
    }
  ]
}

Keep the project simple and focused. Use React + TypeScript + Tailwind CSS as the default stack.
Generate between 3-8 files maximum. Include package.json, index.html, and main entry files.
Do NOT include any markdown formatting, code blocks, or extra text - ONLY the JSON object."""


def _create_client(api_key: str, base_url: str) -> AsyncOpenAI:
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(120.0, connect=30.0),
        follow_redirects=True,
    )
    return AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        http_client=http_client,
    )


class Planner:
    """Analyzes prompts and creates project plans with a single LLM call."""

    def __init__(self, api_key: str, base_url: str, model: str):
        self.client = _create_client(api_key, base_url)
        self.model = model

    async def plan(self, prompt: str) -> AsyncGenerator[dict, None]:
        """
        Analyze user prompt and create a project plan.
        Yields streaming events and finally the plan data.
        Uses exactly 1 LLM call.
        """
        yield {
            "type": "status",
            "step": "analyzing",
            "message": "🔍 Analyzing your prompt and understanding requirements...",
        }
        yield {
            "type": "log",
            "message": f'Prompt received: "{prompt[:100]}{"..." if len(prompt) > 100 else ""}"',
        }
        yield {
            "type": "status",
            "step": "planning",
            "message": "📋 Creating project plan and architecture...",
        }

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            content = response.choices[0].message.content.strip()
            plan = _parse_json(content)

            if not plan or "files" not in plan:
                # Single retry with stricter instruction
                yield {
                    "type": "log",
                    "message": "Retrying plan generation with stricter format...",
                }
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                        {
                            "role": "user",
                            "content": "Please respond with ONLY valid JSON, no markdown or extra text.",
                        },
                    ],
                    temperature=0.5,
                    max_tokens=2000,
                )
                content = response.choices[0].message.content.strip()
                plan = _parse_json(content)

                if not plan or "files" not in plan:
                    yield {
                        "type": "error",
                        "message": "Failed to generate project plan. Please try a more specific prompt.",
                    }
                    return

            yield {"type": "plan", "data": plan}
            yield {
                "type": "log",
                "message": f"Plan created: {plan.get('description', 'N/A')}",
            }
            yield {
                "type": "log",
                "message": f"Tech stack: {', '.join(plan.get('tech_stack', []))}",
            }
            yield {
                "type": "log",
                "message": f"Files to generate: {len(plan.get('files', []))}",
            }

            # Build file tree
            file_tree = _build_file_tree(plan["files"])
            yield {"type": "file_tree", "data": file_tree}

        except Exception as e:
            yield {"type": "error", "message": _classify_error(e)}

    async def close(self):
        try:
            await self.client.close()
        except Exception:
            pass


def _parse_json(text: str) -> dict | None:
    """Try to parse JSON from LLM response, handling markdown code blocks."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(cleaned[start:end])
            except json.JSONDecodeError:
                return None
        return None


def _build_file_tree(files: list[dict]) -> list[dict]:
    """Convert flat file list to indented file tree structure."""
    tree = []
    seen_dirs: set[str] = set()

    for file_info in files:
        path = file_info["path"]
        parts = path.split("/")

        for i in range(len(parts) - 1):
            dir_path = "/".join(parts[: i + 1])
            if dir_path not in seen_dirs:
                seen_dirs.add(dir_path)
                tree.append(
                    {
                        "name": parts[i] + "/",
                        "type": "folder",
                        "indent": i,
                    }
                )

        tree.append(
            {
                "name": parts[-1],
                "type": "file",
                "indent": len(parts) - 1,
            }
        )

    return tree


def _classify_error(e: Exception) -> str:
    """Classify an API error into a user-friendly message."""
    error_msg = str(e)
    if "authentication" in error_msg.lower() or "api key" in error_msg.lower() or "401" in error_msg:
        return "❌ Invalid API Key. Please check your Qwen API key in Settings."
    elif "rate" in error_msg.lower() or "429" in error_msg:
        return "⚠️ Rate limit exceeded. Please wait a moment and try again."
    elif "connect" in error_msg.lower() or "timeout" in error_msg.lower():
        return "❌ Cannot connect to LLM API. Please check your Base URL in Settings."
    else:
        return f"❌ Error: {error_msg}"