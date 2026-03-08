import { motion } from "framer-motion";
import { MessageSquare, Cog, Rocket } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Describe Your Vision",
    description:
      "Write a single prompt describing the software you want. Be as detailed or as brief as you like — our AI understands context.",
    color: "#6C63FF",
    example: '"Build a project management tool with Kanban boards, team collaboration, and real-time updates."',
  },
  {
    step: "02",
    icon: Cog,
    title: "Agent Builds It",
    description:
      "Our specialized AI agents collaborate to architect, code, design, and test your application in real-time. Watch the magic happen.",
    color: "#00D4AA",
    example: "Frontend • Backend • Database • API • Tests • CI/CD",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Deploy & Iterate",
    description:
      "Your app is deployed instantly on our global edge network. Continue refining through conversation — add features, fix issues, scale.",
    color: "#FF6B6B",
    example: "Live URL • Custom Domain • Auto-scaling • Analytics",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(108,99,255,0.5) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#2A2A3E] bg-[#1A1A2E]/80 text-[#00D4AA] text-sm font-medium mb-6">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Three Steps to{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
              Production
            </span>
          </h2>
          <p className="text-[#8B8BA3] text-lg max-w-2xl mx-auto">
            From idea to deployed application in minutes, not months.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6C63FF] via-[#00D4AA] to-[#FF6B6B] opacity-20 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3E] p-8 hover:border-[#3A3A4E] transition-all duration-500 h-full">
                    {/* Step number */}
                    <div
                      className="text-6xl font-extrabold mb-6 opacity-10"
                      style={{ color: step.color }}
                    >
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${step.color}20` }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: step.color }}
                      />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#8B8BA3] mb-5 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Example */}
                    <div className="bg-[#0A0A0F] rounded-lg p-3 border border-[#2A2A3E]">
                      <p
                        className="text-sm font-mono"
                        style={{ color: step.color }}
                      >
                        {step.example}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}