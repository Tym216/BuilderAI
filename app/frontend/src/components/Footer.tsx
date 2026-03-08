import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

const LINKS = {
  Product: ["Features", "Pricing", "Showcase", "Changelog", "Roadmap"],
  Resources: ["Documentation", "API Reference", "Templates", "Blog", "Tutorials"],
  Company: ["About", "Careers", "Press", "Partners", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
};

const SOCIALS = [
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-[#2A2A3E] bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">BuilderAI</span>
            </div>
            <p className="text-[#8B8BA3] text-sm leading-relaxed mb-6 max-w-xs">
              Transform your ideas into production-ready software with
              AI-powered agents. Build faster, ship sooner.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2">
              {subscribed ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#00D4AA] text-sm"
                >
                  ✓ Thanks for subscribing!
                </motion.p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 px-4 py-2 rounded-lg bg-[#12121A] border border-[#2A2A3E] text-white text-sm placeholder-[#4A4A6A] focus:outline-none focus:border-[#6C63FF] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#6C63FF]/25 transition-all"
                  >
                    Subscribe
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#8B8BA3] text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#2A2A3E]">
          <p className="text-[#4A4A6A] text-sm mb-4 md:mb-0">
            © 2026 BuilderAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-[#12121A] border border-[#2A2A3E] flex items-center justify-center text-[#8B8BA3] hover:text-white hover:border-[#4A4A6A] transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}