import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import InteractiveSphere from '../components/three/InteractiveSphere';
import CyberButton from '../components/ui/CyberButton';
import { Zap, Play, ChevronRight, Bot, Clock, TrendingUp } from 'lucide-react';

export default function HeroSection() {
  const [typedText, setTypedText] = useState('');
  const fullText = 'TU FUERZA LABORAL DIGITAL 24/7';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] ambient-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] ambient-glow ambient-glow--purple" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="order-2 lg:order-1"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full">
                <Bot className="w-4 h-4 text-cyber-cyan" />
                <span className="font-mono text-[10px] text-cyber-cyan tracking-widest">
                  EMPLEADOS DIGITALES ACTIVOS
                </span>
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight mb-4"
            >
              <span className="text-frost-white">ATIENDE,</span>
              <br />
              <span className="text-gradient">AGENDA Y VENDE</span>
              <br />
              <span className="text-frost-white">EN </span>
              <span className="text-cyber-cyan">AUTOMATICO</span>
            </motion.h1>

            {/* Typed subtitle */}
            <motion.div variants={itemVariants} className="mb-8">
              <span className="font-mono text-sm text-ghost-white tracking-wider">
                <span className="text-cyber-cyan">{'>'}</span> {typedText}
                <span className="animate-pulse text-cyber-cyan">_</span>
              </span>
            </motion.div>

            {/* Description */}
            <motion.p 
              variants={itemVariants}
              className="text-ghost-white/80 text-lg max-w-lg mb-8 leading-relaxed"
            >
              Empleados digitales que atienden, venden y operan procesos 24/7. 
              Chat + automatización + agente que usa web/PC, con panel, auditoría y seguridad.
            </motion.p>

            {/* Feature pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Bot, text: 'Agente Autónomo' },
                { icon: Clock, text: '24/7 Sin Pausas' },
                { icon: TrendingUp, text: 'ROI 3-8x' },
              ].map((item, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-steel-gray/50 border border-terminal-gray/50 rounded-full text-sm text-ghost-white"
                >
                  <item.icon className="w-3.5 h-3.5 text-cyber-cyan" />
                  {item.text}
                </span>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-12">
              <CyberButton 
                href="#workforce" 
                variant="primary" 
                size="lg"
                icon={<Zap className="w-4 h-4" />}
              >
                VER_EMPLEADOS_DIGITALES
              </CyberButton>
              <CyberButton 
                href="#audit" 
                variant="secondary" 
                size="lg"
                icon={<Play className="w-4 h-4" />}
              >
                INICIAR_AUDITORIA
              </CyberButton>
            </motion.div>

            {/* Quick stats */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-6"
            >
              {[
                { value: '72h', label: 'IMPLEMENTACION' },
                { value: '3-8x', label: 'ROI ESPERADO' },
                { value: '99.9%', label: 'UPTIME' },
              ].map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-px h-8 bg-gradient-to-b from-cyber-cyan to-neon-purple" />
                  <div>
                    <div className="font-mono text-xl font-bold text-cyber-cyan">{stat.value}</div>
                    <div className="font-mono text-[10px] text-ghost-white tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right content - 3D Sphere */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="order-1 lg:order-2 h-[400px] lg:h-[600px]"
          >
            <InteractiveSphere />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] text-ghost-white tracking-widest">EXPLORAR</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-4 h-4 text-cyber-cyan rotate-90" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-black to-transparent pointer-events-none" />
    </section>
  );
}
