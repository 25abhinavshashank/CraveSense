import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  ChevronRight, 
  CheckCircle2, 
  Brain, 
  ArrowRight,
  TrendingDown,
  Timer
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    title: 'Catch Danger Windows',
    description: 'Our AI identifies the exact hours and triggers where your diet usually slips, turning patterns into clear warnings.',
    icon: Timer,
    color: 'text-warning'
  },
  {
    title: 'Real-time Intervention',
    description: 'The Chrome extension interrupts cravings with coaching, timed challenges, and smart low-calorie alternatives.',
    icon: Zap,
    color: 'text-brand'
  },
  {
    title: 'Macro Intelligence',
    description: 'Live macro rings and calorie tracking that keep your data synchronized with your long-term nutrition goals.',
    icon: BarChart3,
    color: 'text-success'
  }
];

export default function Landing({ user }) {
  return (
    <div className="min-h-screen bg-transparent selection:bg-brand/30">
      <nav className="fixed top-0 z-50 w-full bg-transparent">
        <div className="mx-auto max-w-[1350px] px-4 py-4 sm:px-8 lg:px-10">
          <div className="panel px-6 py-4 flex items-center justify-between shadow-xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/20">
              <Brain className="text-white" size={24} />
            </div>
            <p className="font-display text-2xl font-bold tracking-tight">CraveSense</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {user ? (
              <Link to="/dashboard" className="primary-btn text-sm">
                Open Dashboard <ChevronRight size={16} className="ml-1" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold opacity-70 transition hover:opacity-100">
                  Log In
                </Link>
                <Link to="/register" className="primary-btn text-sm">
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="relative z-10"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
                </span>
                AI-Powered Craving Coach
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="mt-8 font-display text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl xl:text-7xl">
                See your cravings <br />
                <span className="brand-text-gradient">before they hit.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="mt-8 max-w-xl text-lg leading-relaxed text-slate-400">
                CraveSense maps your impulsive eating patterns and provides real-time coaching to keep you in control. The discipline you need, powered by intelligence.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap gap-5">
                <Link to={user ? '/dashboard' : '/register'} className="primary-btn group min-w-[180px]">
                  {user ? 'Go to Dashboard' : 'Join the Alpha'}
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#features" className="secondary-btn min-w-[180px]">
                  How it works
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 grid grid-cols-2 gap-8 border-t border-white/5 pt-10 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Resistance</p>
                  <p className="mt-2 text-3xl font-bold font-display tracking-tight text-white">84%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Saved Cals</p>
                  <p className="mt-2 text-3xl font-bold font-display tracking-tight text-white">12k+</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Active Users</p>
                  <p className="mt-2 text-3xl font-bold font-display tracking-tight text-white">2.4k</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-brand to-transparent opacity-20 blur-3xl"></div>
              <div className="relative rounded-[2.5rem] border border-white/10 bg-panel/30 p-4 shadow-2xl backdrop-blur-sm">
                <img 
                  src="/hero.png" 
                  alt="CraveSense Dashboard" 
                  className="rounded-[2rem] shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white/[0.02] py-24 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-3">
            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              className="flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                <TrendingDown size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Impulse Reduction</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">Reduce unplanned snacking by identifying stress triggers and habit loops early.</p>
              </div>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Smart Substitution</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">Receive instant, nutrition-focused alternatives that satisfy cravings without breaking your bank.</p>
              </div>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Guided Coaching</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">Interactive 10-minute challenges designed by neuroscientists to dismantle acute urges.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mb-20 text-center">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-bold uppercase tracking-widest text-brand"
            >
              The Science of Self-Control
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-display text-4xl font-bold sm:text-5xl"
            >
              Everything focused on management
            </motion.h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="panel panel-hover group p-8"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ${feature.color} border border-white/5 transition-transform group-hover:scale-110`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="font-display text-2xl font-bold">{feature.title}</h3>
                <p className="mt-4 text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="panel overflow-hidden border-brand/20 bg-brand/[0.02]">
            <div className="grid lg:grid-cols-2">
              <div className="p-10 lg:p-16">
                <h2 className="font-display text-4xl font-bold">Built for real life.</h2>
                <p className="mt-6 text-slate-400">Late-night snacking, stress spirals, or habit cues—CraveSense keeps the data honest and the feedback useful.</p>
                
                <ul className="mt-10 space-y-6">
                  {[
                    'Identify and tag emotional triggers accurately',
                    'Interactive 5-step flow for acute cravings',
                    'Synced cross-device with Chrome Extension',
                    'Pattern detection for "High Risk" times'
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 size={20} className="text-brand shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-12">
                  <Link to="/register" className="primary-btn">
                    Start Your 14-Day Baseline
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block relative bg-brand/5 border-l border-white/5">
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Brain size={300} strokeWidth={0.5} className="text-brand opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Brain className="text-brand" size={20} />
            <p className="font-display font-bold">CraveSense</p>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 CraveSense. Stay disciplined.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
