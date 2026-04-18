'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Layout, ArrowLeft, Mail, Globe } from 'lucide-react';
import Footer from '../components/ui/Footer';

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const PortfolioPreview = ({ url, title }: { url: string; title: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // We use 1280px as our "Standard Desktop" rendering target
        const containerWidth = containerRef.current.clientWidth;
        setScale(containerWidth / 1280);
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    updateScale(); // Initial call

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden shadow-2xl group select-none">
      {/* Browser Header - Stays crisp/unscaled */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 ml-4 py-1 px-3 bg-[#0d1117] border border-[#30363d] rounded text-[10px] text-[#8b949e] truncate font-mono">
          {url}
        </div>
      </div>
      
      {/* Scaled Iframe Content */}
      <div 
        className="absolute top-[48px] left-0 origin-top-left overflow-hidden bg-[#0d1117]"
        style={{ 
          width: '1280px', 
          height: '800px', // Fixed desktop height for consistent rendering
          transform: `scale(${scale})`,
        }}
      >
        <iframe 
          src={url} 
          className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
          title={title}
          loading="lazy"
        />
      </div>

      {/* Hover Overlay / Interaction Prompt */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-accent/0 group-hover:bg-accent/[0.02] transition-colors" />
    </div>
  );
};

export default function AboutPage() {
  const developers = [
    {
      name: "Geric Morit",
      role: "Full-Stack Software Engineer",
      image: "/developers/geric.png",
      github: "https://github.com/gericandmorty",
      facebook: "https://web.facebook.com/geric.morit.t/",
      email: "gericmorit.dev@gmail.com",
      website: "https://geric.vercel.app/",
      bio: "Visionary lead behind ViceKanBan's architecture and design system."
    },
    {
      name: "Jherson Aguto",
      role: "Mobile Developer",
      image: "/developers/jherson.jpg",
      github: "https://github.com/Jherson-Aguto",
      facebook: "https://web.facebook.com/jherson.aguto.50",
      email: "agutojherson@gmail.com",
      website: "https://jherson.onrender.com/",
      bio: "Crafting seamless mobile experiences and cross-platform integrations."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col font-sans selection:bg-accent/30 text-[#c9d1d9]">
      {/* Header */}
      <header className="px-6 md:px-12 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={24} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-sm text-[#f0f6fc]">About the Team</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-[#8b949e] hover:text-accent transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to ViceKanBan
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* Hero Section */}
        <div className="border-b border-[#30363d] pb-10">
          <h1 className="text-3xl font-extrabold text-[#f0f6fc] mb-3 tracking-tight">The Team behind the Code.</h1>
          <p className="text-[#8b949e] text-lg max-w-2xl">
            We are a small, dedicated group of engineers passionate about building high-performance developer tools that stay out of your way.
          </p>
        </div>

        {/* Team Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {developers.map((dev) => (
            <div key={dev.name} className="flex flex-col md:flex-row gap-6 p-6 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#8b949e] transition-all group">
              {/* Profile Image - GitHub Style */}
              <div className="shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-md border border-[#30363d] overflow-hidden grayscale-[0.3] group-hover:grayscale-0 transition-all shadow-sm">
                  <Image 
                    src={dev.image} 
                    alt={dev.name} 
                    width={128} 
                    height={128} 
                    className="object-cover w-full h-full" 
                  />
                </div>
              </div>

              {/* Dev Info */}
              <div className="flex flex-col justify-between space-y-4 flex-1">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#f0f6fc] hover:text-accent transition-colors cursor-default">
                    {dev.name}
                  </h2>
                  <p className="text-sm font-medium text-accent opacity-80">{dev.role}</p>
                  <p className="text-sm text-[#8b949e] mt-2 leading-relaxed">
                    {dev.bio}
                  </p>
                </div>

                {/* GitHub-style links */}
                <div className="flex items-center flex-wrap gap-4 pt-2">
                  <a href={dev.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-accent transition-colors font-medium">
                    <GithubIcon /> {dev.name.split(' ')[0]}
                  </a>
                  <a href={dev.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-accent transition-colors font-medium">
                    <FacebookIcon /> Profile
                  </a>
                  <a href={dev.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-accent transition-colors font-medium">
                    <Globe size={14} /> Portfolio
                  </a>
                  <a href={`mailto:${dev.email}`} className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-accent transition-colors font-medium">
                    <Mail size={14} /> Contact
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Portfolio Showcase Section */}
        <section className="space-y-8">
          <div className="border-b border-[#30363d] pb-4">
            <h2 className="text-2xl font-bold text-[#f0f6fc]">Portfolio Spotlight</h2>
            <p className="text-[#8b949e] text-sm mt-1">Live previews of our individual creative spaces and projects.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {developers.map((dev) => (
              <div key={`${dev.name}-preview`} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-[#8b949e] flex items-center gap-2">
                    <Globe size={12} /> {dev.name.split(' ')[0]}'s Portfolio
                  </span>
                  <a 
                    href={dev.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-accent hover:underline flex items-center gap-1"
                  >
                    View Live Site <ArrowLeft size={10} className="rotate-180" />
                  </a>
                </div>

                {/* Browser Mockup with Desktop Scaling */}
                <PortfolioPreview url={dev.website} title={`${dev.name} Portfolio`} />
              </div>
            ))}
          </div>
        </section>

        {/* Vision Details - GitHub README Style */}
        <div className="space-y-8 p-8 rounded-lg bg-[#0d1117] border border-[#30363d]">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">Our Vision</h3>
            <p className="text-[#8b949e] leading-relaxed">
              ViceKanBan was born from a shared vision to eliminate the visual noise and enterprise bloat that hampers modern development workflows. We believe that professional tools should be as snappy, focused, and well-designed as the codebases they manage.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">Technical Philosophy</h3>
            <p className="text-[#8b949e] leading-relaxed">
              Our project draws deep inspiration from the GitHub design language—clean, information-dense, and built for a dark-mode-first world. Every interaction, from dragging a Kanban card to collaborating on task threads, is engineered for zero-latency feedback and maximum developer comfort.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-accent">Next.js 16</span>
              <span className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-accent">NestJS</span>
              <span className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-accent">Mongoose</span>
              <span className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-accent">TailwindCSS</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
