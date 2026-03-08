/**
 * WebSocket client for communicating with the BuilderAI backend.
 * Handles connection, reconnection, and event streaming.
 */

export interface BuildConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface BuildEvent {
  type:
    | "status"
    | "plan"
    | "file_tree"
    | "code_start"
    | "code_chunk"
    | "code_complete"
    | "log"
    | "preview_url"
    | "error"
    | "complete"
    | "pong";
  step?: string;
  message?: string;
  data?: Record<string, unknown>;
  file?: string;
  content?: string;
  url?: string;
}

export type BuildEventHandler = (event: BuildEvent) => void;

const DEFAULT_WS_URL = "ws://localhost:8000/ws/build";
const DEFAULT_HEALTH_URL = "http://localhost:8000/health";

export class BuildClient {
  private ws: WebSocket | null = null;
  private onEvent: BuildEventHandler;
  private wsUrl: string;
  private healthUrl: string;

  constructor(
    onEvent: BuildEventHandler,
    wsUrl: string = DEFAULT_WS_URL,
    healthUrl: string = DEFAULT_HEALTH_URL
  ) {
    this.onEvent = onEvent;
    this.wsUrl = wsUrl;
    this.healthUrl = healthUrl;
  }

  /** Check if backend is reachable */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(this.healthUrl, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Connect to WebSocket and start a build */
  async startBuild(prompt: string, config: BuildConfig): Promise<void> {
    // Check backend health first
    const healthy = await this.checkHealth();
    if (!healthy) {
      this.onEvent({
        type: "error",
        message:
          "❌ Cannot connect to backend server. Please ensure the Python backend is running on port 8000.\n\nRun: cd backend && pip install -r requirements.txt && python main.py",
      });
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.disconnect();

        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          // Send build request
          this.ws?.send(
            JSON.stringify({
              type: "start_build",
              prompt,
              api_key: config.apiKey,
              base_url: config.baseUrl,
              model: config.model,
            })
          );
        };

        this.ws.onmessage = (event) => {
          try {
            const data: BuildEvent = JSON.parse(event.data);
            this.onEvent(data);

            // Resolve when build completes or errors fatally
            if (data.type === "complete") {
              resolve();
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        this.ws.onerror = () => {
          this.onEvent({
            type: "error",
            message: "❌ WebSocket connection error. Please check the backend server.",
          });
          reject(new Error("WebSocket error"));
        };

        this.ws.onclose = (event) => {
          if (!event.wasClean) {
            this.onEvent({
              type: "error",
              message: "⚠️ Connection to backend lost. Please retry.",
            });
          }
        };
      } catch (e) {
        this.onEvent({
          type: "error",
          message: `❌ Failed to connect: ${e instanceof Error ? e.message : String(e)}`,
        });
        reject(e);
      }
    });
  }

  /** Disconnect WebSocket */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** Check if connected */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}