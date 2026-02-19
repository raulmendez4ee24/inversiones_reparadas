import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Zap, Shield, Menu, X, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HUDProps {
  currentSection?: string;
}

export default function HUD({ currentSection = 'INICIO' }: HUDProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cpuUsage, setCpuUsage] = useState(12);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate CPU usage fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(5, Math.min(45, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'INICIO', href: '#hero' },
    { label: 'FUERZA LABORAL', href: '#workforce' },
    { label: 'SERVICIOS', href: '#services' },
    { label: 'PROCESO', href: '#process' },
    { label: 'AUDITORIA', href: '#audit' },
    { label: 'CONTACTO', href: '#contact' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-void-black/90 backdrop-blur-xl border-b border-cyber-cyan/20' 
            : 'bg-transparent'
        }`}
      >
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Corner decorations */}
          <div className="hud-corner hud-corner--bl" />
          <div className="hud-corner hud-corner--br" />
          
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.a 
              href="#hero"
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-cyber-cyan rounded-lg group-hover:shadow-cyber-glow transition-shadow duration-300" />
                <div className="absolute inset-2 bg-cyber-cyan/20 rounded group-hover:bg-cyber-cyan/30 transition-colors" />
                <Cpu className="absolute inset-0 m-auto w-5 h-5 text-cyber-cyan" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-bold text-lg tracking-tight text-frost-white group-hover:text-cyber-cyan transition-colors">
                  KAN LOGIC
                </div>
                <div className="font-mono text-[10px] text-ghost-white tracking-widest">
                  ARQUITECTURA IA
                </div>
              </div>
            </motion.a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className={`relative px-4 py-2 font-mono text-xs tracking-widest transition-all duration-300 group ${
                    currentSection === item.label 
                      ? 'text-cyber-cyan' 
                      : 'text-ghost-white hover:text-cyber-cyan'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  
                  {/* Hover effect */}
                  <span className="absolute inset-0 bg-cyber-cyan/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  
                  {/* Active indicator */}
                  {currentSection === item.label && (
                    <motion.span 
                      layoutId="activeNav"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyber-cyan rounded-full"
                    />
                  )}
                </motion.a>
              ))}
            </nav>

            {/* Right side - Status & CTA */}
            <div className="flex items-center gap-4">
              {/* System Status */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-steel-gray/50 rounded-lg border border-terminal-gray/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-cyber-cyan" />
                  <span className="font-mono text-[10px] text-ghost-white">
                    CPU: {cpuUsage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-px h-3 bg-terminal-gray" />
                <div className="status-indicator text-[10px]">
                  ONLINE
                </div>
              </div>

              {/* Login Button */}
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-steel-gray/50 border border-terminal-gray text-ghost-white font-mono text-xs tracking-widest hover:border-cyber-cyan hover:text-cyber-cyan transition-all duration-300"
                >
                  <LogIn className="w-3 h-3" />
                  ACCESO
                </motion.button>
              </Link>

              {/* CTA Button */}
              <motion.a
                href="#workforce"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-xs tracking-widest hover:bg-cyber-cyan/20 hover:shadow-cyber-glow transition-all duration-300"
              >
                <Zap className="w-3 h-3" />
                VER_PLANES
              </motion.a>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-frost-white hover:text-cyber-cyan transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden bg-void-black/95 backdrop-blur-xl border-b border-cyber-cyan/20"
          >
            <nav className="flex flex-col p-6 gap-2">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 font-mono text-sm tracking-widest text-ghost-white hover:text-cyber-cyan hover:bg-cyber-cyan/10 border-l-2 border-transparent hover:border-cyber-cyan transition-all"
                >
                  {item.label}
                </motion.a>
              ))}
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-steel-gray/50 border border-terminal-gray text-ghost-white font-mono text-sm tracking-widest"
                >
                  <LogIn className="w-4 h-4" />
                  ACCESO
                </motion.button>
              </Link>
              <motion.a
                href="#workforce"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 px-5 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest"
              >
                <Zap className="w-4 h-4" />
                VER_PLANES
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Status Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 hidden lg:block"
      >
        <div className="max-w-[1400px] mx-auto px-12">
          <div className="flex items-center justify-between py-2 px-4 bg-void-black/80 backdrop-blur-md border-t border-cyber-cyan/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-matrix-green" />
                <span className="font-mono text-[10px] text-ghost-white">
                  AES-256 ENCRYPTION
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-pulse" />
                <span className="font-mono text-[10px] text-ghost-white">
                  OPENAI ENTERPRISE
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className="font-mono text-[10px] text-ghost-white">
                SECCION: <span className="text-cyber-cyan">{currentSection}</span>
              </span>
              <span className="font-mono text-[10px] text-ghost-white">
                v2.0.26
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
