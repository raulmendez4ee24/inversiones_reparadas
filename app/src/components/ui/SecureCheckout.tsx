import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle2, Cpu, Zap, Fingerprint, Eye, EyeOff } from 'lucide-react';

interface SecureCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  planPrice?: string;
}

export default function SecureCheckout({ 
  isOpen, 
  onClose, 
  planName = 'Plan Growth',
  planPrice = '$12,000'
}: SecureCheckoutProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [securityLevel, setSecurityLevel] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Simular escaneo de seguridad mientras escribe
  useEffect(() => {
    if (cardNumber.length > 0 || name.length > 0) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 800);
      return () => clearTimeout(timer);
    }
  }, [cardNumber, name]);

  // Calcular nivel de seguridad
  useEffect(() => {
    let level = 0;
    if (cardNumber.length >= 16) level += 25;
    if (expiry.length === 5) level += 25;
    if (cvv.length >= 3) level += 25;
    if (name.length > 3) level += 25;
    setSecurityLevel(level);
  }, [cardNumber, expiry, cvv, name]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => setStep('success'), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop with blur */}
        <div 
          className="absolute inset-0 bg-void-black/80 backdrop-blur-xl"
          onClick={onClose}
        />
        
        {/* Scan lines overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div 
            className="w-full h-full"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.03) 2px, rgba(0, 240, 255, 0.03) 4px)',
            }}
          />
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg"
        >
          {/* Glassmorphism container */}
          <div className="relative bg-steel-gray/30 backdrop-blur-2xl border border-cyber-cyan/30 rounded-2xl overflow-hidden">
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-2xl p-[1px]">
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.5) 0%, transparent 30%, transparent 70%, rgba(184, 41, 247, 0.5) 100%)',
                }}
              />
            </div>

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-cyan/50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-cyan/50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-cyan/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-cyan/50" />

            {/* Floating security indicators */}
            <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-matrix-green/20 border border-matrix-green/50 rounded text-[10px] font-mono text-matrix-green">
              <Shield className="w-3 h-3" />
              AES-256
            </div>

            <div className="relative p-8">
              {step === 'form' && (
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full mb-4"
                    >
                      <Lock className="w-3 h-3 text-cyber-cyan" />
                      <span className="font-mono text-[10px] text-cyber-cyan tracking-widest">
                        PROTOCOLO DE PAGO SEGURO
                      </span>
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-frost-white mb-1">
                      {planName}
                    </h2>
                    <p className="font-mono text-3xl font-bold text-cyber-cyan">
                      {planPrice}<span className="text-sm text-ghost-white">/mes</span>
                    </p>
                  </div>

                  {/* Security level indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-ghost-white tracking-wider">
                        NIVEL DE ENCRIPTACIÓN
                      </span>
                      <span className="font-mono text-[10px] text-cyber-cyan">
                        {securityLevel}%
                      </span>
                    </div>
                    <div className="h-1 bg-steel-gray rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyber-cyan to-matrix-green"
                        initial={{ width: 0 }}
                        animate={{ width: `${securityLevel}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Card Number */}
                    <div className="relative">
                      <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                        NÚMERO DE TARJETA
                      </label>
                      <div className="relative">
                        <input
                          ref={el => { if (el) inputRefs.current[0] = el; }}
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white font-mono text-lg tracking-wider placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all"
                        />
                        {/* Scanning animation */}
                        {isScanning && cardNumber.length > 0 && (
                          <motion.div
                            className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              className="absolute top-0 left-0 w-full h-full"
                              style={{
                                background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.2), transparent)',
                              }}
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 0.8, ease: 'linear' }}
                            />
                          </motion.div>
                        )}
                        {/* Data bits flowing */}
                        {cardNumber.length > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-3 bg-cyber-cyan/60 rounded-full"
                                animate={{ 
                                  opacity: [0.3, 1, 0.3],
                                  height: [6, 12, 6]
                                }}
                                transition={{ 
                                  duration: 0.5, 
                                  repeat: Infinity, 
                                  delay: i * 0.1 
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Security micro-text */}
                      <div className="flex items-center gap-2 mt-1">
                        <Fingerprint className="w-3 h-3 text-terminal-gray" />
                        <span className="font-mono text-[8px] text-terminal-gray tracking-wider">
                          TOKENIZACIÓN ACTIVA • PCI-DSS COMPLIANT
                        </span>
                      </div>
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                          VENCIMIENTO
                        </label>
                        <input
                          ref={el => { if (el) inputRefs.current[1] = el; }}
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white font-mono text-lg tracking-wider placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            ref={el => { if (el) inputRefs.current[2] = el; }}
                            type={showCvv ? 'text' : 'password'}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white font-mono text-lg tracking-wider placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost-white hover:text-cyber-cyan transition-colors"
                          >
                            {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Holder */}
                    <div>
                      <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                        TITULAR DE LA TARJETA
                      </label>
                      <input
                        ref={el => { if (el) inputRefs.current[3] = el; }}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        placeholder="NOMBRE COMPLETO"
                        className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white font-mono text-lg tracking-wider placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={securityLevel < 100}
                      className="w-full relative overflow-hidden group"
                    >
                      <div className={`
                        relative px-6 py-4 border rounded-lg font-mono text-sm tracking-widest uppercase transition-all
                        ${securityLevel === 100 
                          ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-cyber-glow' 
                          : 'bg-steel-gray/30 border-terminal-gray text-ghost-white/50 cursor-not-allowed'}
                      `}>
                        {/* Laser scan effect */}
                        {securityLevel === 100 && (
                          <span className="absolute inset-0 overflow-hidden">
                            <span 
                              className="absolute top-0 left-0 w-full h-full -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                              style={{
                                background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)',
                              }}
                            />
                          </span>
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          {securityLevel === 100 ? 'CONFIRMAR PAGO SEGURO' : 'COMPLETE LOS DATOS'}
                        </span>
                      </div>
                    </motion.button>
                  </form>

                  {/* Security badges */}
                  <div className="mt-6 flex items-center justify-center gap-4">
                    {[
                      { icon: Shield, label: 'SSL 256-bit' },
                      { icon: Cpu, label: 'AI Fraud Detection' },
                      { icon: Fingerprint, label: 'Biometric Auth' },
                    ].map((badge, i) => (
                      <div key={i} className="flex items-center gap-1 text-terminal-gray">
                        <badge.icon className="w-3 h-3" />
                        <span className="font-mono text-[8px] tracking-wider">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 'processing' && (
                <div className="py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-24 h-24 mx-auto mb-8"
                  >
                    {/* Outer ring */}
                    <motion.div
                      className="absolute inset-0 border-2 border-cyber-cyan/30 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Middle ring */}
                    <motion.div
                      className="absolute inset-2 border-2 border-neon-purple/50 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Inner core */}
                    <div className="absolute inset-4 bg-cyber-cyan/20 rounded-full flex items-center justify-center">
                      <Cpu className="w-8 h-8 text-cyber-cyan animate-pulse" />
                    </div>
                    {/* Data particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyber-cyan rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                        }}
                        animate={{
                          x: [0, Math.cos(i * Math.PI / 4) * 50, 0],
                          y: [0, Math.sin(i * Math.PI / 4) * 50, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-display text-xl font-bold text-frost-white mb-2"
                  >
                    SINCRONIZANDO NÚCLEO
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-mono text-sm text-ghost-white"
                  >
                    Validando transacción con protocolos de seguridad...
                  </motion.p>

                  {/* Terminal output */}
                  <div className="mt-6 text-left bg-void-black/50 rounded-lg p-3 font-mono text-[10px]">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-cyber-cyan"
                    >
                      {'>'} INITIATING_SECURE_CHANNEL...
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-matrix-green"
                    >
                      {'>'} ENCRYPTION_HANDSHAKE_OK
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="text-cyber-cyan"
                    >
                      {'>'} PROCESSING_TRANSACTION...
                    </motion.div>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative w-24 h-24 mx-auto mb-8"
                  >
                    {/* Success glow */}
                    <div className="absolute inset-0 bg-matrix-green/30 rounded-full blur-xl" />
                    <div className="relative w-full h-full bg-matrix-green/20 rounded-full flex items-center justify-center border-2 border-matrix-green">
                      <CheckCircle2 className="w-10 h-10 text-matrix-green" />
                    </div>
                    {/* Confetti particles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          backgroundColor: i % 2 === 0 ? '#00F0FF' : '#00FF88',
                        }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos(i * Math.PI / 6) * 80,
                          y: Math.sin(i * Math.PI / 6) * 80,
                          opacity: 0,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-matrix-green/10 border border-matrix-green/30 rounded-full mb-4">
                      <Zap className="w-3 h-3 text-matrix-green" />
                      <span className="font-mono text-[10px] text-matrix-green tracking-widest">
                        PROTOCOLO DE PAGO AUTORIZADO
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-frost-white mb-2">
                      ¡PAGO EXITOSO!
                    </h3>
                    <p className="font-mono text-sm text-ghost-white mb-6">
                      Transacción #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-steel-gray/30 rounded-lg p-4 mb-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-ghost-white">Plan</span>
                      <span className="font-mono text-sm text-frost-white">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-ghost-white">Monto</span>
                      <span className="font-mono text-lg text-cyber-cyan font-bold">{planPrice}</span>
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onClose}
                    className="px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-lg"
                  >
                    CONTINUAR AL PANEL
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Floating security text */}
          <motion.div
            className="absolute -bottom-8 left-0 right-0 text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <p className="font-mono text-[8px] text-terminal-gray tracking-[0.3em]">
              ENCRIPTACIÓN DE GRADO MILITAR • VALIDACIÓN POR IA • ZERO-KNOWLEDGE PRIVACY
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
