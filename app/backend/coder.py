"""
BuilderAI Coder - Generates ALL project code in a single LLM call.
Streams the output and parses file boundaries in real-time.
Also collects generated file contents for the Runner to write to disk.
"""

import re
from typing import AsyncGenerator

import httpx
from openai import AsyncOpenAI

# This prompt instructs the LLM to output ALL files in one response
# using clear delimiters so we can parse them in real-time.
SYSTEM_PROMPT = """You are BuilderAI, an expert full-stack developer.
You will generate ALL project files in a SINGLE response.

CRITICAL FORMAT RULES:
- Use the exact delimiter format below for EACH file
- Do NOT use markdown code blocks (no ```)
- Do NOT add any explanation text between files
- Output ONLY the file contents with delimiters

For each file, use this EXACT format:

===FILE: path/to/file.ext===
(complete file content here)
===END_FILE===

Example output:

===FILE: package.json===
{
  "name": "my-app",
  "version": "1.0.0"
}
===END_FILE===

===FILE: src/App.tsx===
import React from 'react';
export default function App() {
  return <div>Hello</div>;
}
===END_FILE===

Rules:
- Write complete, production-ready code for EVERY file
- Use modern best practices
- Include all necessary imports
- Make the code functional and well-structured
- Generate ALL files listed in the plan
- ALWAYS include a package.json with all required dependencies
- ALWAYS include scripts: "dev" (using vite), "build", "start" in package.json
- For React projects, include vite.config.ts or vite.config.js
- For HTML projects, include an index.html as the entry point"""


def _create_client(api_key: str, base_url: str) -> AsyncOpenAI:
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(180.0, connect=30.0),
        follow_redirects=True,
    )
    return AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        http_client=http_client,
    )


# Regex patterns for parsing file delimiters from streamed text
_FILE_START_PATTERN = re.compile(r"===FILE:\s*(.+?)\s*===")
_FILE_END_PATTERN = re.compile(r"===END_FILE===")


class CoderResult:
    """Holds the results of code generation: events to stream + collected files."""

    def __init__(self):
        self.generated_files: dict[str, str] = {}  # path -> content


class Coder:
    """Generates all project code in a single LLM call with streaming."""

    def __init__(self, api_key: str, base_url: str, model: str):
        self.client = _create_client(api_key, base_url)
        self.model = model

    async def generate(
        self, prompt: str, plan: dict, result: CoderResult
    ) -> AsyncGenerator[dict, None]:
        """
        Generate ALL code files in a single streaming LLM call.
        Parses ===FILE: ...=== / ===END_FILE=== delimiters in real-time
        and emits code_start / code_chunk / code_complete events.

        Also collects file contents into result.generated_files for the Runner.

        Uses exactly 1 LLM call regardless of file count.
        """
        files = plan.get("files", [])
        file_list_str = "\n".join(
            f"- {f['path']}: {f.get('description', '')}" for f in files
        )
        project_desc = plan.get("description", "")
        tech_stack = ", ".join(plan.get("tech_stack", []))

        user_message = f"""Original user request: {prompt}

Project: {project_desc}
Tech stack: {tech_stack}

Generate ALL of the following files:
{file_list_str}

Remember: use ===FILE: path=== and ===END_FILE=== delimiters for each file. No markdown, no explanations."""

        yield {
            "type": "status",
            "step": "generating",
            "message": f"⚡ Generating all {len(files)} files in one pass...",
        }
        yield {
            "type": "log",
            "message": f"Sending batch code generation request ({len(files)} files)...",
        }

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.3,
                max_tokens=16000,
                stream=True,
            )

            # State machine for parsing streamed output
            buffer = ""
            current_file: str | None = None
            current_content = ""
            files_completed = 0
            total_files = len(files)

            async for chunk in stream:
                if not chunk.choices or not chunk.choices[0].delta.content:
                    continue

                text = chunk.choices[0].delta.content
                buffer += text

                # Process buffer line by line to detect delimiters
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    full_line = line.rstrip("\r")

                    # Check for file start delimiter
                    start_match = _FILE_START_PATTERN.search(full_line)
                    if start_match:
                        # If we were in a file, close it (safety)
                        if current_file is not None:
                            result.generated_files[current_file] = current_content
                            yield {"type": "code_complete", "file": current_file}
                            files_completed += 1
                            yield {
                                "type": "log",
                                "message": f"✓ {current_file} generated ({len(current_content)} chars)",
                            }

                        current_file = start_match.group(1).strip()
                        current_content = ""
                        yield {
                            "type": "status",
                            "step": "generating",
                            "message": f"⚡ Generating {current_file} ({files_completed + 1}/{total_files})...",
                        }
                        yield {"type": "code_start", "file": current_file}
                        yield {
                            "type": "log",
                            "message": f"[{files_completed + 1}/{total_files}] Generating: {current_file}",
                        }
                        continue

                    # Check for file end delimiter
                    end_match = _FILE_END_PATTERN.search(full_line)
                    if end_match:
                        if current_file is not None:
                            result.generated_files[current_file] = current_content
                            yield {"type": "code_complete", "file": current_file}
                            files_completed += 1
                            yield {
                                "type": "log",
                                "message": f"✓ {current_file} generated ({len(current_content)} chars)",
                            }
                            current_file = None
                            current_content = ""
                        continue

                    # Regular content line - stream it if we're inside a file
                    if current_file is not None:
                        line_with_newline = full_line + "\n"
                        current_content += line_with_newline
                        yield {
                            "type": "code_chunk",
                            "file": current_file,
                            "content": line_with_newline,
                        }

            # Process remaining buffer (no trailing newline)
            if buffer.strip():
                end_match = _FILE_END_PATTERN.search(buffer)
                if end_match and current_file is not None:
                    result.generated_files[current_file] = current_content
                    yield {"type": "code_complete", "file": current_file}
                    files_completed += 1
                    yield {
                        "type": "log",
                        "message": f"✓ {current_file} generated ({len(current_content)} chars)",
                    }
                    current_file = None
                elif current_file is not None:
                    # Remaining text belongs to current file
                    current_content += buffer
                    yield {
                        "type": "code_chunk",
                        "file": current_file,
                        "content": buffer,
                    }

            # Close any unclosed file
            if current_file is not None:
                result.generated_files[current_file] = current_content
                yield {"type": "code_complete", "file": current_file}
                files_completed += 1
                yield {
                    "type": "log",
                    "message": f"✓ {current_file} generated ({len(current_content)} chars)",
                }

            yield {
                "type": "log",
                "message": f"✅ Batch generation complete: {files_completed} files generated in 1 LLM call",
            }

        except Exception as e:
            yield {"type": "error", "message": _classify_error(e)}

    async def close(self):
        try:
            await self.client.close()
        except Exception:
            pass


def _classify_error(e: Exception) -> str:
    error_msg = str(e)
    if "authentication" in error_msg.lower() or "api key" in error_msg.lower() or "401" in error_msg:
        return "❌ Invalid API Key. Please check your Qwen API key in Settings."
    elif "rate" in error_msg.lower() or "429" in error_msg:
        return "⚠️ Rate limit exceeded. Please wait a moment and try again."
    elif "connect" in error_msg.lower() or "timeout" in error_msg.lower():
        return "❌ Cannot connect to LLM API. Please check your Base URL in Settings."
    else:
        return f"❌ Error during code generation: {error_msg}"