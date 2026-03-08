import { motion } from "framer-motion";
import {
  Code2,
  Rocket,
  Shield,
  Layers,
  Cpu,
  GitBranch,
  Paintbrush,
  Database,
} from "lucide-react";

const FEATURES = [
  {
    icon: Cpu,
    title: "AI-Powered Agents",
    description:
      "Multiple specialized agents collaborate to analyze, code, test, and deploy your application autonomously.",
    gradient: "from-[#6C63FF] to-[#8B5CF6]",
  },
  {
    icon: Code2,
    title: "Full-Stack Generation",
    description:
      "Frontend, backend, database schemas, and API routes — all generated from your natural language description.",
    gradient: "from-[#00D4AA] to-[#06B6D4]",
  },
  {
    icon: Paintbrush,
    title: "Intelligent UI Design",
    description:
      "AI designs beautiful, responsive interfaces following modern design principles and accessibility standards.",
    gradient: "from-[#FF6B6B] to-[#F472B6]",
  },
  {
    icon: Database,
    title: "Auto Database Setup",
    description:
      "Automatically generates database schemas, migrations, and ORM models based on your data requirements.",
    gradient: "from-[#FFBD2E] to-[#F59E0B]",
  },
  {
    icon: Shield,
    title: "Built-in Security",
    description:
      "Authentication, authorization, input validation, and security best practices applied by default.",
    gradient: "from-[#6C63FF] to-[#00D4AA]",
  },
  {
    icon: Rocket,
    title: "Instant Deployment",
    description:
      "One-click deploy to our global edge network with automatic SSL, CDN, and scaling configured.",
    gradient: "from-[#00D4AA] to-[#34D399]",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description:
      "Every iteration is tracked. Branch, compare, and roll back to any previous version of your app.",
    gradient: "from-[#FF6B6B] to-[#EF4444]",
  },
  {
    icon: Layers,
    title: "Iterative Refinement",
    description:
      "Chat with the agent to refine your app. Add features, fix bugs, and improve — all through conversation.",
    gradient: "from-[#FFBD2E] to-[#FB923C]",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-6 relative">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#6C63FF]/5 blur-[150px]" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#2A2A3E] bg-[#1A1A2E]/80 text-[#6C63FF] text-sm font-medium mb-6">
            Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
              Ship Fast
            </span>
          </h2>
          <p className="text-[#8B8BA3] text-lg max-w-2xl mx-auto">
            Our AI agents handle every aspect of software development, from
            architecture to deployment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative"
              >
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-[#2A2A3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[#12121A] rounded-2xl border border-[#2A2A3E] p-6 hover:border-[#3A3A4E] transition-all duration-500 hover:-translate-y-1">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#8B8BA3] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}