import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Settings, AlertTriangle } from "lucide-react";

const PLACEHOLDER_PROMPTS = [
  "Build me a project management dashboard with Kanban boards...",
  "Create an e-commerce store with shopping cart and checkout...",
  "Design a social media analytics platform with real-time charts...",
  "Build a SaaS landing page with pricing and auth...",
  "Create a real-time chat application with file sharing...",
];

interface HeroSectionProps {
  onStartBuild: (prompt: string) => void;
  isBuilding: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export default function HeroSection({
  onStartBuild,
  isBuilding,
  hasApiKey,
  onOpenSettings,
}: HeroSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showConfigHint, setShowConfigHint] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hide hint when API key is configured
  useEffect(() => {
    if (hasApiKey) {
      setShowConfigHint(false);
    }
  }, [hasApiKey]);

  const handleBuild = () => {
    if (!prompt.trim() || isBuilding) return;

    // If no API key, show hint and open settings
    if (!hasApiKey) {
      setShowConfigHint(true);
      onOpenSettings();
      return;
    }

    onStartBuild(prompt.trim());
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://mgx-backend-cdn.metadl.com/generate/images/995988/2026-03-07/3d3037c6-0b71-495b-9581-7882b601c416.png"
          alt="Abstract neural network background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F]/80 via-[#0A0A0F]/60 to-[#0A0A0F]" />
      </div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(108,99,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#6C63FF]/20 blur-[100px]"
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#00D4AA]/20 blur-[80px]"
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A3E] bg-[#1A1A2E]/80 backdrop-blur-sm mb-8"
        >
          <Zap className="w-4 h-4 text-[#00D4AA]" />
          <span className="text-sm text-[#8B8BA3]">
            Powered by AI Agents — From prompt to production in minutes
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
        >
          <span className="text-white">Build Software</span>
          <br />
          <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
            With One Prompt
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-[#8B8BA3] max-w-2xl mx-auto mb-12"
        >
          Describe your vision. Our AI agents write the code, design the UI,
          set up the backend, and deploy — all from a single prompt.
        </motion.p>

        {/* API Key Warning Banner */}
        <AnimatePresence>
          {!hasApiKey && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto mb-4"
            >
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all group"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-300">
                  API key not configured.{" "}
                  <span className="underline underline-offset-2 font-semibold group-hover:text-amber-200">
                    Click here to set up your Qwen API key
                  </span>{" "}
                  before building.
                </span>
                <Settings className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Config hint after trying to build without key */}
        <AnimatePresence>
          {showConfigHint && !hasApiKey && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto mb-4"
            >
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <span className="text-sm text-red-400">
                  ⚠️ Please configure your API key in the Settings modal first, then click Confirm.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Input */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="relative group">
            {/* Glow border */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] opacity-40 group-hover:opacity-70 blur-sm transition-opacity duration-500" />

            <div className="relative bg-[#12121A] rounded-2xl border border-[#2A2A3E] p-2">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-white placeholder-[#4A4A6A] text-lg px-4 py-3 resize-none focus:outline-none font-['Inter']"
                    placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleBuild();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex items-center gap-2 text-[#4A4A6A] text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Press Enter to build</span>
                </div>
                <button
                  onClick={handleBuild}
                  disabled={isBuilding || !prompt.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#6C63FF]/25 transition-all duration-300 disabled:opacity-50"
                >
                  {isBuilding ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Building...
                    </>
                  ) : (
                    <>
                      Start Building
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex items-center justify-center gap-8 md:gap-16 mt-16"
        >
          {[
            { value: "50K+", label: "Apps Built" },
            { value: "120+", label: "Languages" },
            { value: "< 2min", label: "Avg Build Time" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-sm text-[#8B8BA3] mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-[#2A2A3E] flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}