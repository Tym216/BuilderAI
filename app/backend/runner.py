"""
BuilderAI Runner - Writes generated files to disk, installs dependencies,
starts a dev server, and returns a real local preview URL.

No LLM calls. All operations are local filesystem + subprocess.
"""

import asyncio
import os
import re
import shutil
import signal
import socket
import logging
from pathlib import Path
from typing import AsyncGenerator

logger = logging.getLogger("builderai.runner")

# Base directory for generated projects
PROJECTS_DIR = Path(__file__).parent / "projects"

# Configurable npm registry mirror (e.g. https://registry.npmmirror.com)
NPM_REGISTRY = os.environ.get("NPM_REGISTRY", "")

# npm install timeout in seconds
NPM_INSTALL_TIMEOUT = 300


def _find_free_port(start: int = 3100, end: int = 3200) -> int:
    """Find an available port in the given range."""
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"No free port found in range {start}-{end}")


def _make_slug(description: str) -> str:
    """Create a filesystem-safe slug from project description."""
    slug = re.sub(r"[^a-z0-9]+", "-", description.lower())
    return slug[:40].strip("-") or "project"


def _truncate(text: str, max_chars: int = 1000) -> str:
    """Truncate text to the last max_chars characters if it exceeds the limit."""
    if len(text) > max_chars:
        return f"...(truncated)\n{text[-max_chars:]}"
    return text


def _build_npm_install_cmd(extra_flags: list[str] | None = None) -> list[str]:
    """Build the npm install command with fast flags and optional registry."""
    cmd = ["npm", "install", "--prefer-offline", "--no-audit", "--no-fund"]
    if extra_flags:
        cmd.extend(extra_flags)
    if NPM_REGISTRY:
        cmd.extend(["--registry", NPM_REGISTRY])
    return cmd


class Runner:
    """
    Real runner that:
    1. Writes generated files to a project directory
    2. Installs dependencies (npm install)
    3. Starts the dev server (npm run dev) on an available port
    4. Returns a real http://localhost:PORT preview URL
    """

    def __init__(self):
        self._dev_process: asyncio.subprocess.Process | None = None
        self._project_dir: Path | None = None

    async def finalize(
        self, plan: dict, generated_files: dict[str, str]
    ) -> AsyncGenerator[dict, None]:
        """
        Real build pipeline:
        1. Write files to disk
        2. npm install
        3. npm run dev on a free port
        4. Wait for server to be ready
        5. Return real preview URL
        """
        if not generated_files:
            yield {
                "type": "error",
                "message": "❌ No files were generated. Cannot build.",
            }
            return

        description = plan.get("description", "my-app")
        slug = _make_slug(description)

        # ── Step 1: Write files to disk ──
        yield {
            "type": "status",
            "step": "building",
            "message": "📁 Writing generated files to disk...",
        }

        project_dir = PROJECTS_DIR / slug
        self._project_dir = project_dir

        # Clean previous build if exists
        if project_dir.exists():
            yield {"type": "log", "message": f"Cleaning previous build at {project_dir}..."}
            shutil.rmtree(project_dir, ignore_errors=True)

        project_dir.mkdir(parents=True, exist_ok=True)

        files_written = 0
        for file_path, content in generated_files.items():
            full_path = project_dir / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            files_written += 1
            yield {
                "type": "log",
                "message": f"  📄 Written: {file_path} ({len(content)} chars)",
            }

        yield {
            "type": "log",
            "message": f"✓ {files_written} files written to {project_dir}",
        }

        # ── Step 2: Detect project type and install dependencies ──
        has_package_json = (project_dir / "package.json").exists()
        has_index_html = (project_dir / "index.html").exists()

        if has_package_json:
            # Node.js project - install and run dev server
            async for event in self._run_node_project(project_dir, plan):
                yield event
        elif has_index_html:
            # Static HTML project - serve with a simple HTTP server
            async for event in self._serve_static(project_dir, plan):
                yield event
        else:
            # Try to find index.html in subdirectories
            html_files = list(project_dir.rglob("index.html"))
            if html_files:
                serve_dir = html_files[0].parent
                async for event in self._serve_static(serve_dir, plan):
                    yield event
            else:
                yield {
                    "type": "log",
                    "message": "⚠️ No package.json or index.html found. Files written but no server started.",
                }
                yield {
                    "type": "status",
                    "step": "complete",
                    "message": "✅ Files generated (no runnable project detected)",
                }
                yield {
                    "type": "complete",
                    "message": "Files have been generated but no runnable project was detected.",
                }

    async def _run_node_project(
        self, project_dir: Path, plan: dict
    ) -> AsyncGenerator[dict, None]:
        """Install npm dependencies and start dev server."""

        yield {
            "type": "status",
            "step": "building",
            "message": "📦 Installing dependencies...",
        }

        # Log registry info
        if NPM_REGISTRY:
            yield {"type": "log", "message": f"Using npm registry: {NPM_REGISTRY}"}
        else:
            yield {"type": "log", "message": "Using default npm registry"}

        # Build the initial install command
        install_cmd = _build_npm_install_cmd()
        cmd_str = " ".join(install_cmd)
        yield {"type": "log", "message": f"Running: {cmd_str}"}

        # Run npm install
        try:
            proc = await asyncio.create_subprocess_exec(
                *install_cmd,
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(), timeout=NPM_INSTALL_TIMEOUT
            )

            stdout_text = stdout_bytes.decode("utf-8", errors="replace").strip()
            stderr_text = stderr_bytes.decode("utf-8", errors="replace").strip()

            # Log installation output
            if stdout_text:
                yield {
                    "type": "log",
                    "message": f"npm install stdout:\n{_truncate(stdout_text)}",
                }
            if stderr_text:
                yield {
                    "type": "log",
                    "message": f"npm install stderr:\n{_truncate(stderr_text)}",
                }

            if proc.returncode != 0:
                # Retry with --legacy-peer-deps
                retry_cmd = _build_npm_install_cmd(extra_flags=["--legacy-peer-deps"])
                retry_cmd_str = " ".join(retry_cmd)
                yield {
                    "type": "log",
                    "message": f"⚠️ npm install failed (exit code {proc.returncode}), retrying with --legacy-peer-deps...",
                }
                yield {"type": "log", "message": f"Running: {retry_cmd_str}"}

                proc = await asyncio.create_subprocess_exec(
                    *retry_cmd,
                    cwd=str(project_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(), timeout=NPM_INSTALL_TIMEOUT
                )

                stdout_text = stdout_bytes.decode("utf-8", errors="replace").strip()
                stderr_text = stderr_bytes.decode("utf-8", errors="replace").strip()

                # Log retry output
                if stdout_text:
                    yield {
                        "type": "log",
                        "message": f"npm install (retry) stdout:\n{_truncate(stdout_text)}",
                    }
                if stderr_text:
                    yield {
                        "type": "log",
                        "message": f"npm install (retry) stderr:\n{_truncate(stderr_text)}",
                    }

                if proc.returncode != 0:
                    yield {
                        "type": "log",
                        "message": f"❌ npm install failed after retry (exit code {proc.returncode})",
                    }
                    yield {
                        "type": "error",
                        "message": "❌ Failed to install dependencies. The generated code may have issues.",
                        "details": {
                            "stdout": _truncate(stdout_text),
                            "stderr": _truncate(stderr_text),
                            "exit_code": proc.returncode,
                            "command": retry_cmd_str,
                        },
                    }
                    return

            yield {"type": "log", "message": "✓ Dependencies installed successfully"}

        except asyncio.TimeoutError:
            yield {
                "type": "error",
                "message": f"❌ npm install timed out after {NPM_INSTALL_TIMEOUT} seconds.",
                "details": {
                    "stdout": "",
                    "stderr": "Process timed out",
                    "exit_code": -1,
                    "command": cmd_str,
                },
            }
            return
        except FileNotFoundError:
            yield {
                "type": "error",
                "message": "❌ npm not found. Please install Node.js.",
                "details": {
                    "stdout": "",
                    "stderr": "npm executable not found in PATH",
                    "exit_code": -1,
                    "command": cmd_str,
                },
            }
            return

        # ── Start dev server ──
        port = _find_free_port()

        yield {
            "type": "status",
            "step": "deploying",
            "message": f"🚀 Starting dev server on port {port}...",
        }
        yield {"type": "log", "message": f"Starting dev server on port {port}..."}

        # Set PORT env var and start npm run dev
        env = os.environ.copy()
        env["PORT"] = str(port)
        # For Vite projects
        env["VITE_PORT"] = str(port)

        # Read package.json to check available scripts
        try:
            import json
            pkg_json = json.loads((project_dir / "package.json").read_text())
            scripts = pkg_json.get("scripts", {})
        except Exception:
            scripts = {}

        # Determine the dev command
        if "dev" in scripts:
            dev_cmd = ["npm", "run", "dev", "--", "--port", str(port), "--host", "0.0.0.0"]
        elif "start" in scripts:
            dev_cmd = ["npm", "start"]
        else:
            # Fallback: use npx vite
            dev_cmd = ["npx", "vite", "--port", str(port), "--host", "0.0.0.0"]

        yield {"type": "log", "message": f"Command: {' '.join(dev_cmd)}"}

        try:
            self._dev_process = await asyncio.create_subprocess_exec(
                *dev_cmd,
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env=env,
            )

            # Wait for server to be ready by checking port
            preview_url = f"http://localhost:{port}"
            server_ready = await self._wait_for_server(port, timeout=30)

            if server_ready:
                yield {"type": "log", "message": f"✓ Dev server is running on port {port}"}
                yield {"type": "preview_url", "url": preview_url}
                yield {"type": "log", "message": f"✓ Preview available at {preview_url}"}
            else:
                # Server might still be starting, send URL anyway
                yield {"type": "log", "message": f"⚠️ Server may still be starting on port {port}"}
                yield {"type": "preview_url", "url": preview_url}
                yield {"type": "log", "message": f"Preview URL: {preview_url} (may take a moment to load)"}

        except FileNotFoundError:
            yield {
                "type": "error",
                "message": "❌ npm not found. Please install Node.js.",
            }
            return
        except Exception as e:
            yield {
                "type": "error",
                "message": f"❌ Failed to start dev server: {str(e)}",
            }
            return

        yield {
            "type": "status",
            "step": "complete",
            "message": "✅ Build complete!",
        }
        yield {
            "type": "complete",
            "message": f"Your application is running at {preview_url}",
        }

    async def _serve_static(
        self, serve_dir: Path, plan: dict
    ) -> AsyncGenerator[dict, None]:
        """Serve a static HTML project using Python's http.server."""
        port = _find_free_port()

        yield {
            "type": "status",
            "step": "deploying",
            "message": f"🚀 Starting static server on port {port}...",
        }
        yield {"type": "log", "message": f"Serving static files from {serve_dir} on port {port}..."}

        try:
            self._dev_process = await asyncio.create_subprocess_exec(
                "python3", "-m", "http.server", str(port),
                "--bind", "0.0.0.0",
                cwd=str(serve_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

            preview_url = f"http://localhost:{port}"
            server_ready = await self._wait_for_server(port, timeout=10)

            if server_ready:
                yield {"type": "log", "message": f"✓ Static server running on port {port}"}
            else:
                yield {"type": "log", "message": f"⚠️ Server starting on port {port}..."}

            yield {"type": "preview_url", "url": preview_url}
            yield {"type": "log", "message": f"✓ Preview available at {preview_url}"}

        except Exception as e:
            yield {
                "type": "error",
                "message": f"❌ Failed to start static server: {str(e)}",
            }
            return

        yield {
            "type": "status",
            "step": "complete",
            "message": "✅ Build complete!",
        }
        yield {
            "type": "complete",
            "message": f"Your application is running at {preview_url}",
        }

    async def _wait_for_server(self, port: int, timeout: int = 30) -> bool:
        """Wait for a server to start accepting connections on the given port."""
        for _ in range(timeout * 2):  # Check every 0.5 seconds
            try:
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection("127.0.0.1", port),
                    timeout=1.0,
                )
                writer.close()
                await writer.wait_closed()
                return True
            except (ConnectionRefusedError, asyncio.TimeoutError, OSError):
                await asyncio.sleep(0.5)
        return False

    async def cleanup(self):
        """Kill the dev server process if it's still running."""
        if self._dev_process and self._dev_process.returncode is None:
            try:
                # Try graceful termination first
                self._dev_process.terminate()
                try:
                    await asyncio.wait_for(self._dev_process.wait(), timeout=5)
                except asyncio.TimeoutError:
                    self._dev_process.kill()
                    await self._dev_process.wait()
                logger.info("Dev server process terminated")
            except ProcessLookupError:
                pass
            except Exception as e:
                logger.warning(f"Error cleaning up dev process: {e}")