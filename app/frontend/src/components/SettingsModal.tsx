import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Key,
  Globe,
  Cpu,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  config: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  onSave: (config: { apiKey: string; baseUrl: string; model: string }) => void;
}

export default function SettingsModal({
  open,
  onClose,
  config,
  onSave,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);
  const [showKey, setShowKey] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setApiKey(config.apiKey);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
    setConfirmed(false);
    setTestResult(null);
  }, [config, open]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const resp = await fetch(`${backendUrl}/api/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          base_url: baseUrl,
          model: model,
        }),
      });

      if (!resp.ok) {
        setTestResult({
          success: false,
          message: `Server error: ${resp.status} ${resp.statusText}`,
        });
        return;
      }

      const data = await resp.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Cannot reach backend server. Make sure it is running. (${err instanceof Error ? err.message : String(err)})`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfirm = () => {
    onSave({ apiKey, baseUrl, model });
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 800);
  };

  const handleCancel = () => {
    setApiKey(config.apiKey);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
    setTestResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleCancel}
          />

          {/* Modal - centered with max-height and scroll */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <div
              className="bg-[#12121A] rounded-2xl border border-[#2A2A3E] shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A3E] flex-shrink-0">
                <h2 className="text-lg font-bold text-white">
                  API Configuration
                </h2>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B8BA3] hover:text-white hover:bg-[#1A1A2E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body - scrollable */}
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                {/* API Key */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#8B8BA3] mb-2">
                    <Key className="w-4 h-4 text-[#6C63FF]" />
                    Qwen API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="sk-..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3E] text-white placeholder-[#4A4A6A] text-sm focus:outline-none focus:border-[#6C63FF] transition-colors pr-10 font-mono"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-[#8B8BA3] transition-colors"
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#4A4A6A] mt-1">
                    Get your key from{" "}
                    <a
                      href="https://dashscope.console.aliyun.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6C63FF] hover:underline"
                    >
                      Alibaba Cloud DashScope
                    </a>
                  </p>
                </div>

                {/* Base URL */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#8B8BA3] mb-2">
                    <Globe className="w-4 h-4 text-[#00D4AA]" />
                    Model Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="https://coding.dashscope.aliyuncs.com/v1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3E] text-white placeholder-[#4A4A6A] text-sm focus:outline-none focus:border-[#6C63FF] transition-colors font-mono"
                  />
                  <p className="text-xs text-[#4A4A6A] mt-1">
                    OpenAI-compatible API endpoint
                  </p>
                </div>

                {/* Model Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#8B8BA3] mb-2">
                    <Cpu className="w-4 h-4 text-[#FF6B6B]" />
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="qwen3.5-plus"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3E] text-white placeholder-[#4A4A6A] text-sm focus:outline-none focus:border-[#6C63FF] transition-colors font-mono"
                  />
                  <p className="text-xs text-[#4A4A6A] mt-1">
                    e.g., qwen3.5-plus, qwen-turbo, qwen-max
                  </p>
                </div>

                {/* Test Connection Button */}
                <div>
                  <button
                    onClick={handleTest}
                    disabled={testing || !apiKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2A2A3E] text-sm font-medium text-[#8B8BA3] hover:text-white hover:border-[#6C63FF] hover:bg-[#6C63FF]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Test Connection
                      </>
                    )}
                  </button>

                  {/* Test Result */}
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 px-3 py-2 rounded-lg text-xs leading-relaxed ${
                        testResult.success
                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}
                    >
                      {testResult.success ? "✅ " : "❌ "}
                      {testResult.message}
                    </motion.div>
                  )}
                </div>

                {/* Info box */}
                <div className="bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl p-3">
                  <p className="text-xs text-[#8B8BA3] leading-relaxed">
                    💡 Your API key is stored locally in your browser and never
                    on our servers.
                  </p>
                </div>
              </div>

              {/* Footer with Confirm / Cancel */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A3E] flex-shrink-0">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-[#8B8BA3] hover:text-white border border-[#2A2A3E] hover:border-[#4A4A6A] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmed}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#6C63FF]/25 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed!
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}