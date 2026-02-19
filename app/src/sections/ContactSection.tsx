import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import CyberButton from '../components/ui/CyberButton';
import CyberCard from '../components/ui/CyberCard';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const contactMethods = [
    {
      icon: Mail,
      label: 'EMAIL',
      value: 'hola@kanlogic.systems',
      href: 'mailto:hola@kanlogic.systems',
    },
    {
      icon: Phone,
      label: 'WHATSAPP',
      value: '+52 55 1234 5678',
      href: 'https://wa.me/525512345678',
    },
    {
      icon: MapPin,
      label: 'UBICACIÓN',
      value: 'Ciudad de México, MX',
      href: '#',
    },
  ];

  return (
    <section id="contact" className="relative py-24 lg:py-32" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-mono text-[10px] text-cyber-cyan tracking-widest mb-4">
            CONTACTO
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Hablemos de tu <span className="text-gradient">operación</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-2xl mx-auto">
            ¿Tienes dudas? Escríbenos. Respondemos en menos de 24 horas.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact methods */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.label}
                href={method.href}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-steel-gray/30 border border-terminal-gray/50 rounded-lg hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all group"
              >
                <div className="w-12 h-12 bg-cyber-cyan/10 rounded-lg flex items-center justify-center group-hover:bg-cyber-cyan/20 transition-colors">
                  <method.icon className="w-5 h-5 text-cyber-cyan" />
                </div>
                <div className="flex-grow">
                  <span className="font-mono text-[10px] text-ghost-white tracking-wider">
                    {method.label}
                  </span>
                  <div className="font-display text-frost-white group-hover:text-cyber-cyan transition-colors">
                    {method.value}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-ghost-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            ))}

            {/* Quick WhatsApp CTA */}
            <motion.a
              href="https://wa.me/525512345678"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-3 p-4 bg-matrix-green/10 border border-matrix-green/30 rounded-lg hover:bg-matrix-green/20 transition-all group mt-6"
            >
              <MessageSquare className="w-5 h-5 text-matrix-green" />
              <span className="font-mono text-sm text-matrix-green tracking-wider">
                CHAT DIRECTO POR WHATSAPP
              </span>
            </motion.a>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            {!isSubmitted ? (
              <CyberCard>
                <h3 className="font-display text-xl font-semibold text-frost-white mb-6">
                  Envíanos un mensaje
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs text-ghost-white mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                      required
                      className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-ghost-white mb-2">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@email.com"
                      required
                      className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-ghost-white mb-2">
                      Mensaje
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="¿En qué podemos ayudarte?"
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm resize-none"
                    />
                  </div>
                  <CyberButton
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    icon={<Send className="w-4 h-4" />}
                  >
                    ENVIAR MENSAJE
                  </CyberButton>
                </form>
              </CyberCard>
            ) : (
              <CyberCard className="h-full flex flex-col items-center justify-center text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 bg-matrix-green/20 rounded-full flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-matrix-green" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-frost-white mb-2">
                  ¡Mensaje enviado!
                </h3>
                <p className="text-ghost-white text-sm">
                  Te responderemos en menos de 24 horas.
                </p>
              </CyberCard>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
