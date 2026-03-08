import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out BuilderAI and building personal projects.",
    icon: Zap,
    color: "#8B8BA3",
    features: [
      "5 builds per month",
      "Basic AI agents",
      "Community templates",
      "Shared hosting",
      "72h support response",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For developers and teams who need more power and flexibility.",
    icon: Sparkles,
    color: "#6C63FF",
    features: [
      "Unlimited builds",
      "Advanced AI agents",
      "Custom templates",
      "Priority hosting",
      "Real-time collaboration",
      "Custom domains",
      "API access",
      "1h support response",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations needing enterprise-grade security and scale.",
    icon: Building2,
    color: "#00D4AA",
    features: [
      "Everything in Pro",
      "Dedicated infrastructure",
      "SSO & SAML",
      "Audit logs",
      "SLA guarantee",
      "Custom AI training",
      "On-premise option",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#6C63FF]/3 blur-[200px]" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#2A2A3E] bg-[#1A1A2E]/80 text-[#FFBD2E] text-sm font-medium mb-6">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-[#8B8BA3] text-lg max-w-2xl mx-auto">
            Start building for free. Upgrade when you need more power.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative ${plan.popular ? "md:-mt-4 md:mb-[-16px]" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={`relative h-full rounded-2xl border p-8 transition-all duration-500 hover:-translate-y-1 ${
                    plan.popular
                      ? "bg-[#12121A] border-[#6C63FF]/50 shadow-lg shadow-[#6C63FF]/10"
                      : "bg-[#12121A] border-[#2A2A3E] hover:border-[#3A3A4E]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${plan.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: plan.color }} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    <span className="text-[#8B8BA3] ml-1">{plan.period}</span>
                  </div>

                  <p className="text-[#8B8BA3] text-sm mb-6">
                    {plan.description}
                  </p>

                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white hover:shadow-lg hover:shadow-[#6C63FF]/25"
                        : "bg-[#1A1A2E] text-white border border-[#2A2A3E] hover:border-[#4A4A6A]"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Check
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: plan.color }}
                        />
                        <span className="text-[#8B8BA3]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}