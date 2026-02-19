import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import CyberButton from '../components/ui/CyberButton';
import CyberCard from '../components/ui/CyberCard';
import DataCounter from '../components/ui/DataCounter';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Send
} from 'lucide-react';

interface FormStep {
  id: string;
  label: string;
  title: string;
}

const formSteps: FormStep[] = [
  { id: 'contact', label: 'CONTACTO', title: 'Paso cero: guardamos tu contacto' },
  { id: 'business', label: 'NEGOCIO', title: 'Cuéntanos de tu negocio' },
  { id: 'priorities', label: 'PRIORIDADES', title: '¿Qué quieres resolver primero?' },
  { id: 'numbers', label: 'NÚMEROS', title: 'Tus números (opcional)' },
];

export default function AuditSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    businessName: '',
    businessType: '',
    priorities: [] as string[],
    monthlyLeads: '',
    monthlyRevenue: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / formSteps.length) * 100;

  return (
    <section id="audit" className="relative py-24 lg:py-32" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] ambient-glow ambient-glow--purple -translate-y-1/2" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full font-mono text-[10px] text-neon-purple tracking-widest mb-4">
            AUDITORÍA IA
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Inicia tu <span className="text-gradient">auditoría IA</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-2xl mx-auto">
            Primero guardamos tu contacto. Luego estimamos tu ganancia anual con IA.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left side - Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <CyberCard>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                <span className="font-mono text-xs text-neon-purple tracking-wider">DIAGNÓSTICO EXPRESS</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-frost-white mb-2">
                Te toma 90 segundos
              </h3>
              <p className="text-ghost-white text-sm">
                Así, si te sales a la mitad, no perdemos el avance y te podemos enviar el diagnóstico.
              </p>
            </CyberCard>

            <div className="grid grid-cols-2 gap-4">
              <CyberCard className="text-center">
                <Clock className="w-6 h-6 text-cyber-cyan mx-auto mb-2" />
                <DataCounter value={90} suffix="s" label="DURACIÓN" variant="cyan" />
              </CyberCard>
              <CyberCard className="text-center">
                <TrendingUp className="w-6 h-6 text-matrix-green mx-auto mb-2" />
                <DataCounter value={3} suffix="x" label="ROI MÍNIMO" variant="green" />
              </CyberCard>
            </div>

            <CyberCard>
              <h4 className="font-display font-semibold text-frost-white mb-4">
                Qué recibes exactamente
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Express', desc: 'chatbot/agenda activos + 1 ajuste + handoff' },
                  { label: 'Auditoría', desc: 'diagnóstico + plan por fases + propuesta económica' },
                  { label: 'Arquitectura', desc: 'integraciones, seguridad y escalamiento modular' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-mono text-xs text-cyber-cyan">{item.label}:</span>
                      <span className="text-sm text-ghost-white ml-1">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CyberCard>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            {!isSubmitted ? (
              <CyberCard className="h-full">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-ghost-white">
                      PASO {currentStep + 1} DE {formSteps.length}
                    </span>
                    <span className="font-mono text-xs text-cyber-cyan">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1 bg-steel-gray rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyber-cyan to-neon-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-8">
                  {formSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`
                        flex-1 py-2 px-1 text-center font-mono text-[10px] tracking-wider transition-all
                        ${index === currentStep 
                          ? 'bg-cyber-cyan/20 text-cyber-cyan border-b-2 border-cyber-cyan' 
                          : index < currentStep 
                            ? 'text-matrix-green' 
                            : 'text-ghost-white/50'}
                      `}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>

                {/* Step content */}
                <div className="mb-8">
                  <h3 className="font-display text-xl font-semibold text-frost-white mb-6">
                    {formSteps[currentStep].title}
                  </h3>

                  {/* Contact Step */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          ¿A qué correo te enviamos tu diagnóstico?
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@empresa.com"
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          WhatsApp (opcional)
                        </label>
                        <input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="Ej. +52 55 1234 5678"
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Step */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          Nombre de tu negocio
                        </label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Ej. Tienda La Esquina"
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          Tipo de negocio
                        </label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-deep-void">Selecciona...</option>
                          <option value="retail" className="bg-deep-void">Tienda / Retail</option>
                          <option value="health" className="bg-deep-void">Clínica / Salud</option>
                          <option value="office" className="bg-deep-void">Despacho / Servicios</option>
                          <option value="other" className="bg-deep-void">Otro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Priorities Step */}
                  {currentStep === 2 && (
                    <div className="space-y-3">
                      {[
                        'Responder mensajes fuera de horario',
                        'Capturar leads automáticamente',
                        'Confirmar citas y recordatorios',
                        'Hacer seguimiento a prospectos',
                        'Responder preguntas frecuentes',
                      ].map((priority) => (
                        <label
                          key={priority}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${formData.priorities.includes(priority)
                              ? 'bg-cyber-cyan/10 border-cyber-cyan'
                              : 'bg-steel-gray/30 border-terminal-gray/50 hover:border-cyber-cyan/50'}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={formData.priorities.includes(priority)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, priorities: [...formData.priorities, priority] });
                              } else {
                                setFormData({ ...formData, priorities: formData.priorities.filter(p => p !== priority) });
                              }
                            }}
                            className="w-4 h-4 accent-cyber-cyan"
                          />
                          <span className="text-sm text-ghost-white">{priority}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Numbers Step */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          ¿Cuántos leads recibes al mes? (aprox)
                        </label>
                        <input
                          type="number"
                          value={formData.monthlyLeads}
                          onChange={(e) => setFormData({ ...formData, monthlyLeads: e.target.value })}
                          placeholder="Ej. 50"
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-ghost-white mb-2">
                          ¿Cuál es tu ingreso mensual aproximado?
                        </label>
                        <select
                          value={formData.monthlyRevenue}
                          onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                          className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-deep-void">Selecciona...</option>
                          <option value="0-50k" className="bg-deep-void">$0 - $50,000 MXN</option>
                          <option value="50k-100k" className="bg-deep-void">$50,000 - $100,000 MXN</option>
                          <option value="100k-500k" className="bg-deep-void">$100,000 - $500,000 MXN</option>
                          <option value="500k+" className="bg-deep-void">$500,000+ MXN</option>
                        </select>
                      </div>
                      <p className="text-xs text-ghost-white/60">
                        * Esta información nos ayuda a calcular tu ROI potencial
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    ATRÁS
                  </CyberButton>
                  <CyberButton
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    icon={currentStep === formSteps.length - 1 ? <Send className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  >
                    {currentStep === formSteps.length - 1 ? 'ENVIAR' : 'SIGUIENTE'}
                  </CyberButton>
                </div>
              </CyberCard>
            ) : (
              <CyberCard className="h-full flex flex-col items-center justify-center text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-20 h-20 bg-matrix-green/20 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-matrix-green" />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  ¡Diagnóstico enviado!
                </h3>
                <p className="text-ghost-white mb-6 max-w-md">
                  Revisa tu correo en los próximos 5 minutos. Si no lo encuentras, revisa tu carpeta de spam.
                </p>
                <CyberButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentStep(0);
                    setFormData({
                      email: '',
                      whatsapp: '',
                      businessName: '',
                      businessType: '',
                      priorities: [],
                      monthlyLeads: '',
                      monthlyRevenue: '',
                    });
                  }}
                >
                  ENVIAR OTRO
                </CyberButton>
              </CyberCard>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
