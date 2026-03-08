import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  FolderTree,
  FileCode2,
  FileJson,
  Terminal as TerminalIcon,
  CheckCircle2,
  Loader2,
  Code2,
  Globe,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  FileText,
  Monitor,
} from "lucide-react";
import { BuildClient, type BuildEvent, type BuildConfig } from "@/lib/buildApi";

interface FileTreeItem {
  name: string;
  type: "file" | "folder";
  indent: number;
}

interface GeneratedFile {
  path: string;
  content: string;
  complete: boolean;
}

interface BuildSimulationProps {
  prompt: string;
  config: BuildConfig;
  autoStart?: boolean;
  onBuildStart?: () => void;
  onBuildEnd?: () => void;
}

const BUILD_STEPS = [
  { key: "analyzing", label: "Analyzing", icon: Code2 },
  { key: "planning", label: "Planning", icon: FolderTree },
  { key: "generating", label: "Generating", icon: FileCode2 },
  { key: "deploying", label: "Deploying", icon: Globe },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

// Demo mode data for when no backend is connected
const DEMO_FILE_TREE: FileTreeItem[] = [
  { name: "src/", type: "folder", indent: 0 },
  { name: "components/", type: "folder", indent: 1 },
  { name: "Dashboard.tsx", type: "file", indent: 2 },
  { name: "Sidebar.tsx", type: "file", indent: 2 },
  { name: "Chart.tsx", type: "file", indent: 2 },
  { name: "pages/", type: "folder", indent: 1 },
  { name: "index.tsx", type: "file", indent: 2 },
  { name: "api/", type: "folder", indent: 1 },
  { name: "routes.ts", type: "file", indent: 2 },
  { name: "package.json", type: "file", indent: 0 },
  { name: "tailwind.config.js", type: "file", indent: 0 },
];

const DEMO_CODE = `import { useState, useEffect } from "react";
import { BarChart, LineChart } from "@/components/Chart";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      {data.map((metric) => (
        <Card key={metric.id}>
          <CardContent>
            <LineChart data={metric.values} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}`;

export default function BuildSimulation({
  prompt,
  config,
  autoStart = false,
  onBuildStart,
  onBuildEnd,
}: BuildSimulationProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [files, setFiles] = useState<Map<string, GeneratedFile>>(new Map());
  const [activeFile, setActiveFile] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"code" | "terminal" | "preview">("code");
  const [buildComplete, setBuildComplete] = useState(false);
  // Track which main view to show: "workspace" or "preview"
  const [mainView, setMainView] = useState<"workspace" | "preview">("workspace");

  const codeRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<BuildClient | null>(null);
  const hasAutoStarted = useRef(false);

  // Auto-scroll code panel
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [files, activeFile]);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs, errors]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleEvent = useCallback(
    (event: BuildEvent) => {
      switch (event.type) {
        case "status": {
          const stepIndex = BUILD_STEPS.findIndex(
            (s) => s.key === event.step
          );
          if (stepIndex >= 0) setCurrentStep(stepIndex);
          if (event.message) addLog(event.message);
          break;
        }
        case "plan":
          addLog(`📋 Plan: ${(event.data as Record<string, string>)?.description || "Project planned"}`);
          break;
        case "file_tree":
          setFileTree(event.data as unknown as FileTreeItem[]);
          break;
        case "code_start":
          if (event.file) {
            setActiveFile(event.file);
            setActiveTab("code");
            setFiles((prev) => {
              const next = new Map(prev);
              next.set(event.file!, {
                path: event.file!,
                content: "",
                complete: false,
              });
              return next;
            });
          }
          break;
        case "code_chunk":
          if (event.file && event.content) {
            setFiles((prev) => {
              const next = new Map(prev);
              const existing = next.get(event.file!);
              if (existing) {
                next.set(event.file!, {
                  ...existing,
                  content: existing.content + event.content!,
                });
              }
              return next;
            });
          }
          break;
        case "code_complete":
          if (event.file) {
            setFiles((prev) => {
              const next = new Map(prev);
              const existing = next.get(event.file!);
              if (existing) {
                next.set(event.file!, { ...existing, complete: true });
              }
              return next;
            });
          }
          break;
        case "log":
          if (event.message) addLog(event.message);
          break;
        case "preview_url":
          if (event.url) setPreviewUrl(event.url);
          break;
        case "error":
          if (event.message) {
            setErrors((prev) => [...prev, event.message!]);
            addLog(`❌ ${event.message}`);
            setActiveTab("terminal");
          }
          break;
        case "complete":
          setBuildComplete(true);
          setIsBuilding(false);
          if (event.message) addLog(event.message);
          onBuildEnd?.();
          break;
      }
    },
    [addLog, onBuildEnd]
  );

  // Demo mode simulation
  const runDemo = useCallback(async () => {
    setIsDemoMode(true);
    setIsBuilding(true);
    setBuildComplete(false);
    setFileTree([]);
    setFiles(new Map());
    setLogs([]);
    setErrors([]);
    setPreviewUrl("");
    setCurrentStep(0);
    setMainView("workspace");
    onBuildStart?.();

    addLog("🔍 Analyzing your prompt and understanding requirements...");
    addLog(`Prompt received: "${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}"`);
    await new Promise((r) => setTimeout(r, 1000));

    setCurrentStep(1);
    addLog("📋 Creating project plan and architecture...");
    await new Promise((r) => setTimeout(r, 800));
    addLog("📋 Plan: Analytics Dashboard with interactive charts");

    // Animate file tree
    for (let i = 0; i <= DEMO_FILE_TREE.length; i++) {
      setFileTree(DEMO_FILE_TREE.slice(0, i));
      await new Promise((r) => setTimeout(r, 150));
    }

    setCurrentStep(2);
    addLog("⚡ Generating Dashboard.tsx (1/5)...");
    setActiveFile("Dashboard.tsx");
    setActiveTab("code");

    // Simulate streaming code
    const demoFile: GeneratedFile = {
      path: "Dashboard.tsx",
      content: "",
      complete: false,
    };
    setFiles(new Map([["Dashboard.tsx", demoFile]]));

    const lines = DEMO_CODE.split("\n");
    for (const line of lines) {
      demoFile.content += line + "\n";
      setFiles(new Map([["Dashboard.tsx", { ...demoFile }]]));
      await new Promise((r) => setTimeout(r, 80));
    }
    demoFile.complete = true;
    setFiles(new Map([["Dashboard.tsx", { ...demoFile }]]));
    addLog("✓ Dashboard.tsx generated (487 chars)");

    // Simulate more files quickly
    const moreFiles = ["Sidebar.tsx", "Chart.tsx", "index.tsx", "routes.ts"];
    for (let i = 0; i < moreFiles.length; i++) {
      addLog(`⚡ Generating ${moreFiles[i]} (${i + 2}/5)...`);
      await new Promise((r) => setTimeout(r, 500));
      addLog(`✓ ${moreFiles[i]} generated`);
    }

    setCurrentStep(3);
    addLog("🚀 Finalizing build...");
    addLog("Running lint checks...");
    await new Promise((r) => setTimeout(r, 500));
    addLog("✓ All checks passed");
    addLog("Deploying to edge network...");
    await new Promise((r) => setTimeout(r, 500));

    const slug = "analytics-dashboard";
    setPreviewUrl(`https://${slug}.builderai.app`);
    addLog(`✓ Deployed to https://${slug}.builderai.app`);

    setCurrentStep(4);
    addLog("✅ Build complete!");
    setBuildComplete(true);
    setIsBuilding(false);
    onBuildEnd?.();
  }, [prompt, addLog, onBuildStart, onBuildEnd]);

  const startBuild = useCallback(async () => {
    setIsBuilding(true);
    setBuildComplete(false);
    setFileTree([]);
    setFiles(new Map());
    setLogs([]);
    setErrors([]);
    setPreviewUrl("");
    setCurrentStep(0);
    setIsDemoMode(false);
    setMainView("workspace");
    onBuildStart?.();

    const client = new BuildClient(handleEvent);
    clientRef.current = client;

    try {
      await client.startBuild(prompt, config);
    } catch {
      // Errors are handled via events
      setIsBuilding(false);
      onBuildEnd?.();
    }
  }, [prompt, config, handleEvent, onBuildStart, onBuildEnd]);

  // Auto-start when prompt changes
  useEffect(() => {
    if (autoStart && prompt && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      if (config.apiKey) {
        startBuild();
      } else {
        runDemo();
      }
    }
  }, [autoStart, prompt, config.apiKey, startBuild, runDemo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const currentFileContent = activeFile ? files.get(activeFile)?.content || "" : "";
  const currentFileComplete = activeFile
    ? files.get(activeFile)?.complete || false
    : false;

  const getFileIcon = (name: string) => {
    if (name.endsWith("/")) return <FolderTree className="w-3.5 h-3.5 text-[#6C63FF]" />;
    if (name.endsWith(".json")) return <FileJson className="w-3.5 h-3.5 text-[#FFBD2E]" />;
    if (name.endsWith(".md") || name.endsWith(".txt")) return <FileText className="w-3.5 h-3.5 text-[#8B8BA3]" />;
    return <FileCode2 className="w-3.5 h-3.5 text-[#00D4AA]" />;
  };

  return (
    <section id="build-simulation" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Watch the Agent{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
              Build in Real-Time
            </span>
          </h2>
          <p className="text-[#8B8BA3] text-lg max-w-2xl mx-auto">
            {isDemoMode
              ? "Demo mode — configure your Qwen API key in Settings for real AI-powered builds."
              : "See how our AI agents analyze your prompt, generate code, and deploy your application."}
          </p>
        </motion.div>

        {/* Build Progress Steps */}
        {(isBuilding || buildComplete) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 md:gap-4 mb-8 flex-wrap"
          >
            {BUILD_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isComplete = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                      isComplete
                        ? "bg-[#00D4AA]/20 text-[#00D4AA]"
                        : isCurrent
                        ? "bg-[#6C63FF]/20 text-[#6C63FF]"
                        : "bg-[#1A1A2E] text-[#4A4A6A]"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent && isBuilding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">{step.label}</span>
                  </div>
                  {i < BUILD_STEPS.length - 1 && (
                    <div
                      className={`w-6 h-0.5 ${
                        isComplete ? "bg-[#00D4AA]" : "bg-[#2A2A3E]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Main View Toggle - appears after build completes with a preview URL */}
        {buildComplete && previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="inline-flex rounded-xl bg-[#12121A] border border-[#2A2A3E] p-1">
              <button
                onClick={() => setMainView("workspace")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mainView === "workspace"
                    ? "bg-gradient-to-r from-[#6C63FF] to-[#6C63FF]/80 text-white shadow-lg shadow-[#6C63FF]/20"
                    : "text-[#8B8BA3] hover:text-white"
                }`}
              >
                <Code2 className="w-4 h-4" />
                Agent Workspace
              </button>
              <button
                onClick={() => setMainView("preview")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mainView === "preview"
                    ? "bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white shadow-lg shadow-[#00D4AA]/20"
                    : "text-[#8B8BA3] hover:text-white"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Live Preview
              </button>
            </div>
          </motion.div>
        )}

        {/* IDE Simulation / Preview Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative group"
        >
          {/* Glow */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#6C63FF]/30 to-[#00D4AA]/30 opacity-50 blur-sm" />

          <div className="relative bg-[#0D0D14] rounded-2xl border border-[#2A2A3E] overflow-hidden">
            {/* === PREVIEW VIEW === */}
            {mainView === "preview" && previewUrl ? (
              <>
                {/* Preview Title bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#12121A] border-b border-[#2A2A3E]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#2A2A3E] max-w-lg mx-auto">
                      <Globe className="w-3.5 h-3.5 text-[#00D4AA] flex-shrink-0" />
                      <span className="text-[#00D4AA] text-sm font-mono truncate">
                        {previewUrl}
                      </span>
                    </div>
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium hover:bg-[#00D4AA]/30 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in New Tab
                  </a>
                </div>

                {/* Preview iframe */}
                <div className="h-[480px] bg-white">
                  <iframe
                    src={previewUrl}
                    title="App Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </>
            ) : (
              <>
                {/* === WORKSPACE VIEW === */}
                {/* Title bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#12121A] border-b border-[#2A2A3E]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                  </div>
                  <span className="text-[#4A4A6A] text-sm font-mono">
                    BuilderAI — Agent Workspace
                    {isDemoMode && " (Demo)"}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isBuilding && !buildComplete && (
                      <button
                        onClick={() => {
                          if (config.apiKey) {
                            startBuild();
                          } else {
                            runDemo();
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#6C63FF]/25 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {config.apiKey ? "Build" : "Run Demo"}
                      </button>
                    )}
                    {isBuilding && (
                      <div className="flex items-center gap-2 text-[#00D4AA] text-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Agent working...
                      </div>
                    )}
                    {buildComplete && (
                      <button
                        onClick={() => {
                          hasAutoStarted.current = false;
                          setBuildComplete(false);
                          setCurrentStep(-1);
                          setMainView("workspace");
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2A3E] text-[#8B8BA3] text-sm hover:text-white hover:border-[#4A4A6A] transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex h-[480px]">
                  {/* File Tree */}
                  <div className="w-56 border-r border-[#2A2A3E] bg-[#0D0D14] p-3 overflow-y-auto hidden md:block">
                    <div className="text-xs text-[#4A4A6A] uppercase tracking-wider mb-3 font-semibold">
                      Explorer
                    </div>
                    {fileTree.length === 0 && !isBuilding && (
                      <p className="text-xs text-[#3A3A4A] italic">
                        Files will appear here during build...
                      </p>
                    )}
                    <AnimatePresence>
                      {fileTree.map((file, i) => {
                        const isClickable =
                          file.type === "file" && files.has(file.name);
                        const isActive = file.name === activeFile;
                        return (
                          <motion.div
                            key={`${file.name}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex items-center gap-2 py-1 text-sm cursor-pointer rounded px-1 transition-colors ${
                              isActive
                                ? "bg-[#6C63FF]/20 text-white"
                                : isClickable
                                ? "hover:bg-[#1A1A2E] text-[#6B6B80]"
                                : "text-[#6B6B80]"
                            }`}
                            style={{ paddingLeft: `${file.indent * 16 + 4}px` }}
                            onClick={() => {
                              if (isClickable) {
                                setActiveFile(file.name);
                                setActiveTab("code");
                              }
                            }}
                          >
                            {getFileIcon(file.name)}
                            <span
                              className={
                                file.type === "folder"
                                  ? "text-[#8B8BA3] font-medium"
                                  : ""
                              }
                            >
                              {file.name}
                            </span>
                            {isClickable && files.get(file.name)?.complete && (
                              <CheckCircle2 className="w-3 h-3 text-[#00D4AA] ml-auto" />
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Main Editor Area */}
                  <div className="flex-1 flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-[#2A2A3E]">
                      <button
                        onClick={() => setActiveTab("code")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === "code"
                            ? "text-white border-b-2 border-[#6C63FF] bg-[#12121A]"
                            : "text-[#4A4A6A] hover:text-[#8B8BA3]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileCode2 className="w-3.5 h-3.5" />
                          {activeFile || "Code"}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab("terminal")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === "terminal"
                            ? "text-white border-b-2 border-[#00D4AA] bg-[#12121A]"
                            : "text-[#4A4A6A] hover:text-[#8B8BA3]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <TerminalIcon className="w-3.5 h-3.5" />
                          Terminal
                          {errors.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      {activeTab === "code" ? (
                        <div
                          ref={codeRef}
                          className="h-full overflow-y-auto p-4 font-mono text-sm leading-6"
                        >
                          {!activeFile && !isBuilding && (
                            <div className="flex items-center justify-center h-full text-[#3A3A4A]">
                              <p>Click &quot;Build&quot; or &quot;Run Demo&quot; to start generating code...</p>
                            </div>
                          )}
                          {currentFileContent.split("\n").map((line, i) => (
                            <div key={i} className="flex">
                              <span className="w-10 text-right mr-4 text-[#3A3A4A] select-none flex-shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-[#D4D4D4] whitespace-pre">
                                {line}
                              </span>
                            </div>
                          ))}
                          {isBuilding && activeFile && !currentFileComplete && (
                            <div className="flex items-center mt-1">
                              <span className="w-10 text-right mr-4 text-[#3A3A4A]">
                                {currentFileContent.split("\n").length + 1}
                              </span>
                              <motion.span
                                className="w-2 h-5 bg-[#6C63FF]"
                                animate={{ opacity: [1, 0] }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          ref={termRef}
                          className="h-full overflow-y-auto p-4 font-mono text-sm bg-[#0A0A0F]"
                        >
                          {logs.map((log, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`leading-7 ${
                                log.startsWith("✓") || log.startsWith("✅")
                                  ? "text-[#00D4AA]"
                                  : log.startsWith("❌")
                                  ? "text-[#FF5F57]"
                                  : log.startsWith("⚠️")
                                  ? "text-[#FFBD2E]"
                                  : log.startsWith("🚀") || log.startsWith("🔍") || log.startsWith("📋") || log.startsWith("⚡") || log.startsWith("🔨")
                                  ? "text-[#6C63FF]"
                                  : "text-[#8B8BA3]"
                              }`}
                            >
                              {log}
                            </motion.div>
                          ))}
                          {errors.map((err, i) => (
                            <motion.div
                              key={`err-${i}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-start gap-2 text-[#FF5F57] leading-7"
                            >
                              <AlertCircle className="w-4 h-4 mt-1.5 flex-shrink-0" />
                              <span>{err}</span>
                            </motion.div>
                          ))}
                          {isBuilding && (
                            <motion.span
                              className="inline-block w-2 h-4 bg-[#00D4AA] mt-1"
                              animate={{ opacity: [1, 0] }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatType: "reverse",
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview URL bar */}
                    {previewUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-t border-[#2A2A3E] px-4 py-3 bg-[#12121A] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#00D4AA]" />
                          <span className="text-sm text-[#8B8BA3]">
                            Preview:{" "}
                            <span className="text-[#00D4AA] font-mono">
                              {previewUrl}
                            </span>
                          </span>
                        </div>
                        <button
                          onClick={() => setMainView("preview")}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium hover:bg-[#00D4AA]/30 transition-colors"
                        >
                          <Monitor className="w-3 h-3" />
                          Open Preview
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}