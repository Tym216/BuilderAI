import { motion } from "framer-motion";
import { ExternalLink, Star, Clock, Code2 } from "lucide-react";

const PROJECTS = [
  {
    title: "Analytics Dashboard",
    description:
      "Real-time analytics platform with interactive charts, user segmentation, and export capabilities.",
    image:
      "https://mgx-backend-cdn.metadl.com/generate/images/995988/2026-03-07/9654a3d5-9afb-4fe1-9e74-77c74c4a96db.png",
    prompt: "Build an analytics dashboard with real-time charts and filters",
    tech: ["React", "TypeScript", "Recharts", "Tailwind"],
    buildTime: "1m 23s",
    stars: 4.9,
  },
  {
    title: "AI Code Generator",
    description:
      "Code generation tool with syntax highlighting, multi-language support, and AI-powered suggestions.",
    image:
      "https://mgx-backend-cdn.metadl.com/generate/images/995988/2026-03-07/2a4f0125-927d-46ac-8744-3a7ebc3b7991.png",
    prompt: "Create an AI code generation tool with syntax highlighting",
    tech: ["Next.js", "OpenAI", "Monaco Editor"],
    buildTime: "2m 05s",
    stars: 4.8,
  },
  {
    title: "Cloud Platform",
    description:
      "Infrastructure management dashboard with server monitoring, deployment pipelines, and team management.",
    image:
      "https://mgx-backend-cdn.metadl.com/generate/images/995988/2026-03-07/76d9f1e0-3d19-4d65-a882-fb198678ba6c.png",
    prompt: "Build a cloud infrastructure management platform",
    tech: ["React", "Node.js", "PostgreSQL", "Docker"],
    buildTime: "1m 47s",
    stars: 4.7,
  },
];

export default function ShowcaseSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#00D4AA]/5 blur-[150px]" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#2A2A3E] bg-[#1A1A2E]/80 text-[#FF6B6B] text-sm font-medium mb-6">
            Showcase
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Built by{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
              Our Community
            </span>
          </h2>
          <p className="text-[#8B8BA3] text-lg max-w-2xl mx-auto">
            Real applications built by real users — each started with just one
            prompt.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-[#2A2A3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#12121A] rounded-2xl border border-[#2A2A3E] overflow-hidden hover:border-[#3A3A4E] transition-all duration-500 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs">
                    <Star className="w-3 h-3 text-[#FFBD2E] fill-[#FFBD2E]" />
                    <span className="text-white">{project.stars}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    {project.title}
                    <ExternalLink className="w-4 h-4 text-[#4A4A6A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-[#8B8BA3] text-sm mb-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Prompt used */}
                  <div className="bg-[#0A0A0F] rounded-lg p-3 border border-[#2A2A3E] mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Code2 className="w-3 h-3 text-[#6C63FF]" />
                      <span className="text-[10px] text-[#4A4A6A] uppercase tracking-wider font-semibold">
                        Prompt
                      </span>
                    </div>
                    <p className="text-xs text-[#6C63FF] font-mono">
                      "{project.prompt}"
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-[#1A1A2E] text-[#8B8BA3] text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[#00D4AA] text-xs">
                      <Clock className="w-3 h-3" />
                      {project.buildTime}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}