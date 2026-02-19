import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import CyberCard from '../components/ui/CyberCard';
import { 
  CreditCard, 
  Mail, 
  Monitor, 
  Rocket, 
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
  type LucideIcon
} from 'lucide-react';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  details: string[];
  time: string;
}

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Pago confirmado',
    description: 'Recibes confirmacion por correo y WhatsApp.',
    icon: CreditCard,
    details: [
      'Factura automatica generada',
      'Acceso al portal de cliente',
      'Notificacion de bienvenida',
    ],
    time: 'Inmediato',
  },
  {
    number: '02',
    title: 'Contacto del equipo',
    description: 'Te escribimos para coordinar la sesion de activacion.',
    icon: Mail,
    details: [
      'Asignacion de especialista',
      'Agendamiento de sesion',
      'Preparacion de materiales',
    ],
    time: '15-30 min',
  },
  {
    number: '03',
    title: 'Sesion guiada',
    description: 'Conectamos cuentas en pantalla, sin pedirte tecnicismos.',
    icon: Monitor,
    details: [
      'Configuracion en vivo',
      'Pruebas de funcionamiento',
      'Capacitacion basica',
    ],
    time: '45-60 min',
  },
  {
    number: '04',
    title: 'Activacion',
    description: 'Publicamos el flujo y hacemos pruebas contigo.',
    icon: Rocket,
    details: [
      'Deploy a produccion',
      'Pruebas finales',
      'Documentacion entregada',
    ],
    time: '24h',
  },
  {
    number: '05',
    title: 'Uso diario',
    description: 'Empiezas a operar y medimos resultados desde la primera semana.',
    icon: BarChart3,
    details: [
      'Dashboard de metricas',
      'Soporte continuo',
      'Optimizacion mensual',
    ],
    time: 'Continuo',
  },
];

export default function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="process" className="relative py-24 lg:py-32" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-steel-gray/20 to-void-black" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-mono text-[10px] text-cyber-cyan tracking-widest mb-4">
            PROCESO
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Que pasa <span className="text-gradient">despues de pagar?</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-2xl mx-auto">
            Un proceso claro, sin sorpresas. De la confirmacion al uso diario.
          </p>
        </motion.div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-5 gap-4 mb-8">
            {processSteps.map((step, index) => {
              const isActive = activeStep === index;
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className={isActive ? 'relative cursor-pointer transition-all duration-300 scale-105' : 'relative cursor-pointer transition-all duration-300 opacity-70 hover:opacity-100'}
                  onClick={() => setActiveStep(index)}
                >
                  <div className={isActive ? 'p-4 rounded-lg border transition-all duration-300 bg-cyber-cyan/10 border-cyber-cyan shadow-cyber-glow' : 'p-4 rounded-lg border transition-all duration-300 bg-steel-gray/30 border-terminal-gray/50'}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={isActive ? 'font-mono text-lg font-bold text-cyber-cyan' : 'font-mono text-lg font-bold text-ghost-white'}>
                        {step.number}
                      </span>
                      <div className={isActive ? 'text-cyber-cyan' : 'text-ghost-white'}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-display font-semibold text-frost-white text-sm mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-ghost-white line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                  
                  {index < processSteps.length - 1 && (
                    <div className="absolute top-1/2 -right-2 w-4 h-px bg-terminal-gray">
                      <ChevronRight className="absolute -right-2 -top-2 w-4 h-4 text-terminal-gray" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-cyber-cyan/10 rounded-xl flex items-center justify-center flex-shrink-0 text-cyber-cyan">
                {(() => {
                  const Icon = processSteps[activeStep].icon;
                  return <Icon className="w-8 h-8" />;
                })()}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs text-cyber-cyan tracking-wider">
                    PASO {processSteps[activeStep].number}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ghost-white">
                    <Clock className="w-3 h-3" />
                    {processSteps[activeStep].time}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  {processSteps[activeStep].title}
                </h3>
                <p className="text-ghost-white mb-4">
                  {processSteps[activeStep].description}
                </p>
                <ul className="grid grid-cols-3 gap-3">
                  {processSteps[activeStep].details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ghost-white">
                      <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:hidden space-y-4">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 }}
              >
                <CyberCard className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyber-cyan/10 rounded-lg flex items-center justify-center flex-shrink-0 text-cyber-cyan">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyber-cyan">{step.number}</span>
                      <span className="text-xs text-ghost-white flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.time}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-frost-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-ghost-white">
                      {step.description}
                    </p>
                  </div>
                </CyberCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 grid md:grid-cols-2 gap-6"
        >
          <div className="bg-steel-gray/20 border border-error-crimson/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-error-crimson" />
              <span className="font-mono text-sm text-error-crimson tracking-wider">ANTES</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-frost-white mb-4">
              Ejemplo tipo tienda
            </h3>
            <ul className="space-y-3">
              {[
                '40 mensajes sin responder cada dia',
                '2 horas diarias contestando lo mismo',
                'Citas y prospectos perdidos por falta de seguimiento',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-ghost-white">
                  <span className="text-error-crimson mt-1">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-steel-gray/20 border border-matrix-green/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-matrix-green" />
              <span className="font-mono text-sm text-matrix-green tracking-wider">DESPUES</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-frost-white mb-4">
              Primeras semanas
            </h3>
            <ul className="space-y-3">
              {[
                '0 mensajes perdidos fuera de horario',
                '80% de respuestas automaticas en FAQ',
                'Agenda confirmada y seguimiento en el mismo chat',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-ghost-white">
                  <CheckCircle2 className="w-4 h-4 text-matrix-green mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
