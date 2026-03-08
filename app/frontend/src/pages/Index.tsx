import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X, Settings } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import BuildSimulation from "@/components/BuildSimulation";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import ShowcaseSection from "@/components/ShowcaseSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import SettingsModal from "@/components/SettingsModal";
import type { BuildConfig } from "@/lib/buildApi";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Showcase", href: "#showcase" },
  { label: "Pricing", href: "#pricing" },
];

const STORAGE_KEY = "builderai_config";

function loadConfig(): BuildConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    apiKey: "",
    baseUrl: "https://coding.dashscope.aliyuncs.com/v1",
    model: "qwen3.5-plus",
  };
}

function saveConfig(config: BuildConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

function Navbar({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#2A2A3E]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">BuilderAI</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#8B8BA3] text-sm font-medium hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8B8BA3] hover:text-white hover:bg-[#1A1A2E] border border-[#2A2A3E] transition-all"
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 text-sm text-[#8B8BA3] hover:text-white transition-colors">
            Sign In
          </button>
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#6C63FF]/25 transition-all">
            Get Started
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-[#2A2A3E]"
          >
            <div className="px-6 py-4 space-y-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[#8B8BA3] text-sm font-medium hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenSettings();
                }}
                className="block text-[#8B8BA3] text-sm font-medium hover:text-white transition-colors"
              >
                ⚙️ API Settings
              </button>
              <div className="pt-4 border-t border-[#2A2A3E] space-y-3">
                <button className="w-full py-2.5 text-sm text-[#8B8BA3] hover:text-white transition-colors">
                  Sign In
                </button>
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default function Index() {
  const [config, setConfig] = useState<BuildConfig>(loadConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [buildPrompt, setBuildPrompt] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildTriggered, setBuildTriggered] = useState(false);

  const handleSaveConfig = useCallback((newConfig: BuildConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  const handleStartBuild = useCallback(
    (prompt: string) => {
      setBuildPrompt(prompt);
      setBuildTriggered(true);
      setIsBuilding(true);

      // Scroll to build simulation
      setTimeout(() => {
        const el = document.getElementById("build-simulation");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-['Inter',sans-serif]">
      <Navbar onOpenSettings={() => setSettingsOpen(true)} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      <HeroSection
        onStartBuild={handleStartBuild}
        isBuilding={isBuilding}
        hasApiKey={!!config.apiKey}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div id="build-sim">
        <BuildSimulation
          prompt={buildPrompt}
          config={config}
          autoStart={buildTriggered}
          onBuildStart={() => setIsBuilding(true)}
          onBuildEnd={() => setIsBuilding(false)}
        />
      </div>

      <div id="features">
        <FeaturesSection />
      </div>

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="showcase">
        <ShowcaseSection />
      </div>

      <div id="pricing">
        <PricingSection />
      </div>

      <Footer />
    </div>
  );
}