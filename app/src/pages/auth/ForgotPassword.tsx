import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Cpu, Zap, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'success'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] ambient-glow opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow ambient-glow--purple opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="relative bg-steel-gray/30 backdrop-blur-xl border border-terminal-gray/50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl p-[1px]">
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, transparent 50%, rgba(184, 41, 247, 0.3) 100%)',
              }}
            />
          </div>

          <div className="relative p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl mb-3">
                <Cpu className="w-6 h-6 text-cyber-cyan" />
              </div>
              <h1 className="font-display text-xl font-bold text-frost-white">
                Recuperar Contraseña
              </h1>
            </div>

            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-ghost-white text-sm text-center mb-6">
                    Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
                  </p>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg mb-4"
                    >
                      <AlertCircle className="w-4 h-4 text-error-crimson flex-shrink-0" />
                      <span className="text-sm text-error-crimson">{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                        CORREO ELECTRÓNICO
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@empresa.com"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 hover:shadow-cyber-glow transition-all rounded-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ENVIANDO...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4" />
                          ENVIAR INSTRUCCIONES
                        </span>
                      )}
                    </motion.button>

                    <div className="text-center text-sm">
                      <Link to="/reset-password" className="text-cyber-cyan hover:underline">
                        Ya tengo un token
                      </Link>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-matrix-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-matrix-green" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-frost-white mb-2">
                    ¡Email Enviado!
                  </h2>
                  <p className="text-ghost-white text-sm mb-6">
                    Revisa tu bandeja de entrada. Si no lo encuentras, revisa tu carpeta de spam.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    VOLVER AL LOGIN
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-ghost-white hover:text-cyber-cyan transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
