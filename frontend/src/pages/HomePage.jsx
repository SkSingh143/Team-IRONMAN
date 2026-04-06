import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { PenTool, Code, BarChart2, Mic } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-root overflow-hidden relative text-gray-200">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-3 text-xl font-bold text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #6C63FF)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>LiveCollab</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-gray-400 font-medium hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-lg shadow-primary/25">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-40 pb-32 min-h-[80vh]"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold mb-8 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Now in Beta
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white mb-6 max-w-4xl">
          Your workspace, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            synchronized in real-time.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
          The ultimate collaboration platform for modern teams. Draw on infinite canvases, share code, run live polls, and talk over crystal-clear voice chat — all in one place.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-1">
            Get Started for Free
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-white rounded-xl font-semibold transition-all hover:-translate-y-1">
            Explore Features
          </a>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<PenTool className="w-6 h-6" />}
            title="Infinite Canvas"
            desc="Freestanding digital whiteboard featuring smooth curve rendering and real-time multiplayer cursors so you never miss a beat."
          />
          <FeatureCard 
            icon={<Code className="w-6 h-6" />}
            title="Collaborative Code"
            desc="Share snippets securely. Select from over 10 programming languages and sync updates to your team instantly."
          />
          <FeatureCard 
            icon={<BarChart2 className="w-6 h-6" />}
            title="Instant Polling"
            desc="Make decisions rapidly. Create dynamic polls, gather votes, and visualize team consensus with animated progress bars."
          />
          <FeatureCard 
            icon={<Mic className="w-6 h-6" />}
            title="Native Voice Chat"
            desc="Built-in WebRTC audio means you don't need external call links. Hop into a room and instantly start talking contextually."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-gray-500 text-sm border-t border-border">
        © {new Date().getFullYear()} LiveCollab. Built for high-performance teams.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="glass-panel p-6 rounded-2xl transition-shadow hover:shadow-2xl hover:shadow-primary/10 hover:border-border-focus group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
