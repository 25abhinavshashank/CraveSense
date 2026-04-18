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
      <nav className="fixed top-0 z-50 w-full px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="panel px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand shadow-lg shadow-brand/20">
                <Brain className="text-white" size={18} />
              </div>
              <p className="font-display text-lg sm:text-2xl font-bold tracking-tight">CraveSense</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              {user ? (
                <Link to="/dashboard" className="primary-btn px-4 py-2 text-xs sm:text-sm">
                  Dashboard <ChevronRight size={14} className="ml-1" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="px-3 py-2 text-xs sm:text-sm font-semibold opacity-70 transition hover:opacity-100">
                    Log In
                  </Link>
                  <Link to="/register" className="primary-btn px-4 py-2 text-xs sm:text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-12 pt-28 sm:pb-20 sm:pt-36 lg:pt-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="relative z-10 text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
                </span>
                AI-Powered Craving Coach
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl xl:text-7xl">
                See your cravings <br className="hidden sm:block" />
                <span className="brand-text-gradient">before they hit.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400 lg:mx-0">
                CraveSense maps your impulsive eating patterns and provides real-time coaching to keep you in control. The discipline you need.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link to={user ? '/dashboard' : '/register'} className="primary-btn group w-full sm:w-auto min-w-[180px]">
                  {user ? 'Go to Dashboard' : 'Join the Alpha'}
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#features" className="secondary-btn w-full sm:w-auto min-w-[180px]">
                  How it works
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 grid grid-cols-2 gap-6 border-t border-white/5 pt-10 sm:grid-cols-3 sm:gap-8">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-widest">Resistance</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">84%</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-widest">Saved Cals</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">12k+</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-widest">Active Users</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">2.4k</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="absolute -inset-4 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-tr from-brand to-transparent opacity-20 blur-3xl"></div>
              <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 bg-panel/30 p-2 sm:p-4 shadow-2xl backdrop-blur-sm">
                <img 
                  src="/hero.png" 
                  alt="CraveSense Dashboard" 
                  className="rounded-[1rem] sm:rounded-[2rem] shadow-2xl w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white/[0.02] py-16 sm:py-24 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="grid gap-10 sm:gap-12 lg:grid-cols-3">
            {[
              { icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10', title: 'Impulse Reduction', desc: 'Reduce unplanned snacking by identifying stress triggers and habit loops early.' },
              { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', title: 'Smart Substitution', desc: 'Receive instant, nutrition-focused alternatives that satisfy cravings without breaking your bank.' },
              { icon: Zap, color: 'text-brand', bg: 'bg-brand/10', title: 'Guided Coaching', desc: 'Interactive 10-minute challenges designed by neuroscientists to dismantle acute urges.' }
            ].map((stat, idx) => (
              <motion.div 
                key={stat.title}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold">{stat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mb-12 sm:mb-20 text-center">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand"
            >
              The Science of Self-Control
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-display text-3xl font-bold sm:text-5xl"
            >
              Everything focused on management
            </motion.h2>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="panel panel-hover group p-6 sm:p-8"
              >
                <div className={`mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/[0.03] ${feature.color} border border-white/5 transition-transform group-hover:scale-110`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold">{feature.title}</h3>
                <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="panel overflow-hidden border-brand/20 bg-brand/[0.02]">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-12 lg:p-16">
                <h2 className="font-display text-3xl sm:text-4xl font-bold">Built for real life.</h2>
                <p className="mt-4 sm:mt-6 text-sm sm:text-base text-slate-400">Late-night snacking, stress spirals, or habit cues—CraveSense keeps the data honest and the feedback useful.</p>
                
                <ul className="mt-8 sm:mt-10 space-y-4 sm:space-y-6">
                  {[
                    'Identify and tag emotional triggers accurately',
                    'Interactive 5-step flow for acute cravings',
                    'Synced cross-device with Chrome Extension',
                    'Pattern detection for "High Risk" times'
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 size={18} className="text-brand shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 sm:mt-12">
                  <Link to="/register" className="primary-btn w-full sm:w-auto">
                    Start Your 14-Day Baseline
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex relative bg-brand/5 border-l border-white/5 items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Brain size={300} strokeWidth={0.5} className="text-brand" />
                </div>
                <Brain size={120} className="text-brand relative z-10 animate-pulse-slow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 flex flex-col items-center justify-between gap-8 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-3">
            <Brain className="text-brand" size={20} />
            <p className="font-display font-bold">CraveSense</p>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 order-last sm:order-none">
            © 2026 CraveSense. Stay disciplined.
          </p>
          <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>

  );
}
