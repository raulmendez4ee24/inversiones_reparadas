import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import BentoGrid, { BentoItem } from '../components/ui/BentoGrid';
import CyberButton from '../components/ui/CyberButton';
import DataCounter from '../components/ui/DataCounter';
import RealTimePanel from '../components/ui/RealTimePanel';
import { 
  Rocket, 
  Building2, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <section id="services" className="relative py-24 lg:py-32" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full font-mono text-[10px] text-neon-purple tracking-widest mb-4">
            ELIGE TU RUTA
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Dos mundos. <span className="text-gradient">Un objetivo.</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-2xl mx-auto">
            No todos ocupan lo mismo: micro-negocio express o transformación completa.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <BentoGrid columns={4} className="mb-8">
            {/* Express Card - Large */}
            <BentoItem size="large" glowColor="cyan">
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyber-cyan/20 rounded-lg flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <span className="font-mono text-[10px] text-cyber-cyan tracking-widest">
                    MUNDO 1 • EXPRESS
                  </span>
                </div>
                
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  Quiero algo funcionando ya
                </h3>
                
                <p className="text-ghost-white text-sm mb-6 flex-grow">
                  Ideal para tienda, clínica o despacho que quiere ahorrar tiempo hoy.
                </p>

                <ul className="space-y-2 mb-6">
                  {[
                    'Precio fijo',
                    'Activación en 72 horas',
                    'Sin tecnicismos',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ghost-white">
                      <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <CyberButton 
                  href="#express" 
                  variant="primary" 
                  size="sm"
                  className="w-full justify-center"
                >
                  IR A EXPRESS
                </CyberButton>
              </div>
            </BentoItem>

            {/* Architecture Card - Large */}
            <BentoItem size="large" glowColor="purple">
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-neon-purple" />
                  </div>
                  <span className="font-mono text-[10px] text-neon-purple tracking-widest">
                    MUNDO 2 • ARQUITECTURA
                  </span>
                </div>
                
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  Quiero transformar mi operación
                </h3>
                
                <p className="text-ghost-white text-sm mb-6 flex-grow">
                  Para empresas que necesitan roadmap, integraciones y escalamiento por fases.
                </p>

                <ul className="space-y-2 mb-6">
                  {[
                    'Auditoría con ROI',
                    'Roadmap por etapas',
                    'Integraciones complejas',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ghost-white">
                      <CheckCircle2 className="w-4 h-4 text-neon-purple flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <CyberButton 
                  href="#audit" 
                  variant="secondary" 
                  size="sm"
                  className="w-full justify-center"
                >
                  IR A AUDITORÍA
                </CyberButton>
              </div>
            </BentoItem>

            {/* Chatbot Card */}
            <BentoItem glowColor="cyan">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-cyber-cyan" />
                <span className="font-mono text-[10px] text-ghost-white tracking-wider">CHATBOT</span>
              </div>
              <h4 className="font-display text-lg font-semibold text-frost-white mb-2">
                Básico WhatsApp
              </h4>
              <ul className="space-y-1 text-xs text-ghost-white mb-4">
                <li>• Respuestas FAQ automáticas</li>
                <li>• Captura de leads</li>
                <li>• Mensaje fuera de horario</li>
              </ul>
              <div className="font-mono text-lg font-bold text-cyber-cyan">
                $2,000 <span className="text-xs text-ghost-white">MXN/mes</span>
              </div>
            </BentoItem>

            {/* Agenda Card */}
            <BentoItem glowColor="purple">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-neon-purple" />
                <span className="font-mono text-[10px] text-ghost-white tracking-wider">AGENDA</span>
              </div>
              <h4 className="font-display text-lg font-semibold text-frost-white mb-2">
                Agenda + Chatbot
              </h4>
              <ul className="space-y-1 text-xs text-ghost-white mb-4">
                <li>• Confirmación automática</li>
                <li>• Recordatorio 24h antes</li>
                <li>• Reagendado por chat</li>
              </ul>
              <div className="font-mono text-lg font-bold text-neon-purple">
                $3,500 <span className="text-xs text-ghost-white">MXN/mes</span>
              </div>
            </BentoItem>

            {/* ROI Stats */}
            <BentoItem glowColor="mixed">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-matrix-green mx-auto mb-2" />
                <DataCounter 
                  value={5} 
                  prefix="" 
                  suffix="x" 
                  label="ROI PROMEDIO"
                  variant="green"
                />
              </div>
            </BentoItem>

            {/* Time Stats */}
            <BentoItem glowColor="mixed">
              <div className="text-center">
                <Clock className="w-6 h-6 text-cyber-cyan mx-auto mb-2" />
                <DataCounter 
                  value={72} 
                  suffix="h" 
                  label="IMPLEMENTACIÓN"
                  variant="cyan"
                />
              </div>
            </BentoItem>

            {/* Security */}
            <BentoItem glowColor="mixed">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-matrix-green" />
                <span className="font-mono text-[10px] text-ghost-white tracking-wider">SEGURIDAD</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-ghost-white">
                  <CheckCircle2 className="w-3 h-3 text-matrix-green" />
                  AES-256 Encryption
                </div>
                <div className="flex items-center gap-2 text-xs text-ghost-white">
                  <CheckCircle2 className="w-3 h-3 text-matrix-green" />
                  Zero-Knowledge Privacy
                </div>
                <div className="flex items-center gap-2 text-xs text-ghost-white">
                  <CheckCircle2 className="w-3 h-3 text-matrix-green" />
                  GDPR Compliant
                </div>
              </div>
            </BentoItem>

            {/* Real-time panel */}
            <BentoItem size="wide" glowColor="cyan">
              <RealTimePanel />
            </BentoItem>
          </BentoGrid>
        </motion.div>

        {/* Tech stack bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4 lg:gap-8"
        >
          <span className="font-mono text-xs text-ghost-white tracking-wider">TRABAJAMOS CON:</span>
          {[
            'OpenAI Enterprise',
            'Google Cloud Platform',
            'Meta Business',
            'AWS',
          ].map((tech, i) => (
            <span 
              key={i} 
              className="px-3 py-1.5 bg-steel-gray/50 border border-terminal-gray/50 rounded-full font-mono text-[10px] text-ghost-white hover:border-cyber-cyan/50 hover:text-cyber-cyan transition-colors cursor-default"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
