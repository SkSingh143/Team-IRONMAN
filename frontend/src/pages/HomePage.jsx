import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/useThemeStore';
import { motion } from 'framer-motion';
import {
  PenTool,
  Code,
  BarChart2,
  Mic,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Play,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const HERO_TYPED_TEXT = 'synchronized';
const HERO_TYPE_STEP_MS = 118;
const HERO_TYPE_PAUSE_MS = 500;
const HERO_TYPE_LOOPS = 5;

const features = [
  {
    icon: <PenTool className="w-6 h-6" />,
    title: 'Infinite Canvas',
    desc: 'Sketch on a darker zinc canvas in night mode, with smoother strokes and a calmer, more premium visual feel.',
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: 'Collaborative Code',
    desc: 'Drop snippets, review updates, and keep everyone synced without switching between tabs and tools.',
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: 'Instant Polling',
    desc: 'Turn decisions into momentum with fast voting, clear progress bars, and live consensus tracking.',
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: 'Native Voice Chat',
    desc: 'Talk right inside the room so feedback, drawing, and code reviews happen in the same shared context.',
  },
];

const roomHighlights = [
  { label: 'Live Cursors', value: '12 ms sync' },
  { label: 'Voice Ready', value: 'Room audio on' },
  { label: 'Whiteboard', value: 'Dark zinc mode' },
  { label: 'Teams', value: 'Multi-surface flow' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [typeStep, setTypeStep] = useState(0);
  const [isTypeAnimating, setIsTypeAnimating] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const totalSteps = HERO_TYPED_TEXT.length;
    let timeoutId;
    let cancelled = false;
    let currentStep = 0;
    let direction = 1;
    let completedLoops = 0;

    const schedule = (delay) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        if (direction === 1) {
          if (currentStep < totalSteps) {
            currentStep += 1;
            setTypeStep(currentStep);
            schedule(HERO_TYPE_STEP_MS);
            return;
          }

          direction = -1;
          schedule(HERO_TYPE_PAUSE_MS);
          return;
        }

        if (currentStep > 0) {
          currentStep -= 1;
          setTypeStep(currentStep);
          schedule(HERO_TYPE_STEP_MS);
          return;
        }

        completedLoops += 1;
        if (completedLoops >= HERO_TYPE_LOOPS) {
          timeoutId = window.setTimeout(() => {
            if (cancelled) return;
            setTypeStep(totalSteps);
            setIsTypeAnimating(false);
          }, HERO_TYPE_PAUSE_MS);
          return;
        }

        direction = 1;
        schedule(HERO_TYPE_PAUSE_MS);
      }, delay);
    };

    setTypeStep(0);
    setIsTypeAnimating(true);
    schedule(HERO_TYPE_PAUSE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 22, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
  };

  const typedVisible = HERO_TYPED_TEXT.slice(0, Math.min(typeStep, HERO_TYPED_TEXT.length));
  const isTyping = isTypeAnimating;

  return (
    <div className="relative min-h-screen overflow-hidden bg-root text-main">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(183, 138, 91, 0.18), transparent 22%), radial-gradient(circle at 88% 10%, rgba(240, 215, 187, 0.12), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.03), transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '110px 110px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent)',
          }}
        />
      </div>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-0 h-[560px] w-[560px] rounded-full bg-primary/15 blur-[155px]"
        animate={{
          x: mousePos.x - 280,
          y: mousePos.y - 280,
        }}
        transition={{ type: 'spring', damping: 42, stiffness: 180, mass: 0.55 }}
      />

      <div className="pointer-events-none absolute right-[-8rem] top-24 z-0 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[135px]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-[-10rem] z-0 h-[24rem] w-[24rem] rounded-full bg-primary/8 blur-[120px]" />

      <nav className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10 lg:px-12">
        <div className="flex items-center gap-3 text-xl font-bold text-main">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary, #B78A5B)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[1.65rem] font-black tracking-tight">LiveCollab</span>
            <span className="font-cursive text-sm text-primary">cinematic teamwork</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-xl border border-border bg-surface-elevated p-2 text-muted transition-all hover:border-primary/30 hover:text-main"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="hidden text-sm font-semibold text-muted transition-colors hover:text-primary sm:block">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <motion.section
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-6 pb-24 pt-6 md:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col items-start text-left">
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/75 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            Built for immersive team rooms
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="max-w-4xl font-display text-5xl font-black leading-[0.96] tracking-tight text-main sm:text-6xl lg:text-[5.4rem]"
          >
            Your{' '}
            <span className="relative inline-block font-cursive text-primary">
              workspace
              <span className="absolute -bottom-2 left-0 h-3 w-full rounded-full bg-accent/35 blur-md" />
            </span>
            <br />
            <span className="mt-3 inline-flex flex-wrap items-end gap-x-3 gap-y-2">
              <TypingWord text={HERO_TYPED_TEXT} visibleText={typedVisible} isTyping={isTyping} />
              <span className="text-main">for every day.</span>
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-7 max-w-2xl text-base leading-8 text-muted sm:text-lg"
          >
            A richer collaboration space for modern teams - draw on a cleaner dark canvas, review code together,
            vote instantly, and jump into voice chat without leaving the room.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-9 flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(139,94,60,0.28)] transition-all hover:-translate-y-1 hover:bg-primary-dark"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface/80 px-8 py-4 text-base font-semibold text-main transition-all hover:-translate-y-1 hover:border-primary/25 hover:bg-surface-elevated"
            >
              <Play className="h-4 w-4" />
              Explore Features
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="relative mt-10 w-full max-w-3xl">
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-primary/12 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <video
                className="aspect-[16/10] w-full object-cover object-center opacity-90"
                src="/Real_Time_Collaboration_Data_Flow_Animation.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
                <FloatingTag label="LiveCollab Room" value="Realtime sync" />
                <FloatingTag label="Voice" value="Connected" align="right" />
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-4 top-24 hidden w-44 rounded-2xl border border-white/10 bg-black/55 p-4 text-white shadow-2xl backdrop-blur md:block"
              >
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/55">Dark Canvas</div>
                <div className="mt-2 text-base font-semibold">Black zinc board</div>
                <div className="mt-2 text-sm text-white/65">Cleaner contrast for writing, shapes, and focus.</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-4 left-4 max-w-[74%] rounded-2xl border border-white/10 bg-black/60 p-4 text-white shadow-xl backdrop-blur sm:max-w-sm sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/25 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Everything stays in one room</div>
                    <div className="text-xs text-white/65">Whiteboard, code, polls, and voice stacked together.</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
                transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 right-5 hidden rounded-2xl border border-primary/20 bg-surface/90 px-5 py-4 shadow-2xl backdrop-blur md:block"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Mood</div>
                <div className="mt-1 font-cursive text-2xl text-primary">premium, not loud</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="relative hidden lg:block">
          <motion.div variants={itemVariants}>
            <HeroCharacter />
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 grid gap-4 sm:grid-cols-2">
            {roomHighlights.map((item) => (
              <div key={item.label} className="glass-panel rounded-[1.75rem] p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-muted">{item.label}</div>
                <div className="mt-3 text-xl font-semibold text-main">{item.value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-28 md:px-10 lg:px-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Workflow Surfaces</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-main md:text-4xl">
              A calmer visual system, with stronger presence.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted md:text-base">
            The homepage now leans into graphite surfaces, warmer metallic accents, and layered motion so the product
            feels premium instead of neon.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} desc={feature.desc} />
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted">
        Copyright {new Date().getFullYear()} LiveCollab. Built for high-focus teams.
      </footer>
    </div>
  );
}

function FloatingTag({ label, value, align = 'left' }) {
  return (
    <div
      className={`rounded-full border border-white/10 bg-black/45 px-4 py-2 text-white shadow-lg backdrop-blur ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/50">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function TypingWord({ text, visibleText, isTyping }) {
  return (
    <motion.span
      aria-label={text}
      initial={{ opacity: 0, x: -32, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
      className="relative inline-grid"
    >
      <span className="invisible whitespace-pre">{text}</span>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 inline-flex items-center whitespace-pre text-primary">
        {visibleText}
        {isTyping && (
          <motion.span
            aria-hidden="true"
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
            className="ml-1 inline-block h-[0.88em] w-[2px] rounded-full bg-current"
          />
        )}
      </span>
    </motion.span>
  );
}

function HeroCharacter() {
  return (
    <div className="relative mx-auto max-w-[32rem]">
      <div className="pointer-events-none absolute -inset-8 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(240,215,187,0.2), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent 55%)',
          }}
        />

        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mx-auto flex h-[27rem] max-w-[22rem] items-center justify-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute h-[20rem] w-[20rem] rounded-full border border-white/10"
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute h-[14rem] w-[14rem] rounded-full border border-primary/20"
          />

          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 flex h-72 w-56 flex-col items-center"
          >
            <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-b from-[#f2e1ce] to-[#c89d71] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <div className="h-full w-full rounded-[1.4rem] bg-[#111111] pt-8">
                <div className="flex items-center justify-center gap-4">
                  <motion.span
                    animate={{ scaleY: [1, 0.45, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
                    className="h-3 w-3 rounded-full bg-accent"
                  />
                  <motion.span
                    animate={{ scaleY: [1, 0.45, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, delay: 0.12 }}
                    className="h-3 w-3 rounded-full bg-accent"
                  />
                </div>
              </div>
              <div className="absolute -left-3 top-6 h-10 w-4 rounded-full border border-primary/25 bg-surface-elevated" />
              <div className="absolute -right-3 top-6 h-10 w-4 rounded-full border border-primary/25 bg-surface-elevated" />
            </div>

            <div className="mt-3 h-24 w-32 rounded-[2rem] bg-gradient-to-b from-[#241b15] to-[#0f0f10] shadow-[0_18px_45px_rgba(0,0,0,0.28)]" />
            <div className="mt-2 flex w-full items-center justify-between px-10">
              <motion.div
                animate={{ rotate: [10, 20, 10] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="h-16 w-4 origin-top rounded-full bg-gradient-to-b from-[#3a2b20] to-[#8b5e3c]"
              />
              <motion.div
                animate={{ rotate: [-10, -22, -10] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.18 }}
                className="h-16 w-4 origin-top rounded-full bg-gradient-to-b from-[#3a2b20] to-[#8b5e3c]"
              />
            </div>
          </motion.div>

          <OrbitChip className="left-0 top-10" label="Voice linked" />
          <OrbitChip className="right-0 top-16" label="Canvas live" />
          <OrbitChip className="bottom-8 left-8" label="Code synced" />
        </motion.div>

        <div className="relative z-10 mt-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Animated room guide</div>
          <div className="mt-2 font-display text-3xl font-black text-main">Focus without the chaos</div>
          <p className="mt-3 text-sm leading-7 text-muted">
            Softer motion, warmer light, and darker surfaces give the landing page a calmer premium identity.
          </p>
        </div>
      </div>
    </div>
  );
}

function OrbitChip({ className, label }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur ${className}`}
    >
      {label}
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -8, transition: { duration: 0.22 } }}
      className="glass-panel group rounded-[2rem] p-6 transition-all hover:border-primary/25 hover:shadow-[0_25px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/18">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-main">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{desc}</p>
    </motion.div>
  );
}
